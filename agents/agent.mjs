import { readFileSync,writeFileSync,mkdirSync,readdirSync,renameSync,unlinkSync } from 'node:fs';
import { dirname,join,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { isIPv4 } from 'node:net';
import { identify } from './snmp.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const privateIP=ip=>{if(!isIPv4(ip))return false;const [a,b]=ip.split('.').map(Number);return a===10||a===192&&b===168||a===172&&b>=16&&b<=31;};
export function targets(networks){
 if(!Array.isArray(networks)||!networks.length||networks.length>32)throw Error('Informe de 1 a 32 redes/IPs privados.');
 const result=new Set();
 for(const network of networks){if(typeof network!=='string')throw Error('Rede inválida');const parts=network.split('/'),ip=parts[0],prefix=parts.length===1?32:Number(parts[1]);if(parts.length>2||!privateIP(ip)||!Number.isInteger(prefix)||prefix<22||prefix>32)throw Error('Use IPv4 privado ou CIDR /22 a /32.');const n=ip.split('.').reduce((v,x)=>(v*256+Number(x))>>>0,0),mask=(0xffffffff<<(32-prefix))>>>0,base=(n&mask)>>>0,count=2**(32-prefix);for(let i=prefix>=31?0:1;i<(prefix>=31?count:count-1);i++){const value=(base+i)>>>0,address=[value>>>24,(value>>>16)&255,(value>>>8)&255,value&255].join('.');if(!privateIP(address))throw Error('Faixa fora da rede privada.');result.add(address);if(result.size>4096)throw Error('Máximo de 4096 endereços por agente.');}}
 return [...result];
}
export function configuration(input,base=here){
 const url=new URL(input.server_url);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Informe somente a origem do servidor, sem caminho ou credenciais.');
 if(url.protocol!=='https:'&&input.allow_insecure_http!==true)throw Error('Use HTTPS ou habilite HTTP explicitamente para teste em LAN/VPN confiável.');
 if(!/^[a-f0-9]{64}$/.test(input.token||''))throw Error('Token inválido.');
 if(typeof input.community!=='string'||!input.community||Buffer.byteLength(input.community)>128)throw Error('Informe a comunidade SNMP de leitura.');
 const interval=input.interval_seconds??900,timeout=input.timeout_ms??800,concurrency=input.concurrency??12;
 if(!Number.isInteger(interval)||interval<60||interval>86400||!Number.isInteger(timeout)||timeout<100||timeout>5000||!Number.isInteger(concurrency)||concurrency<1||concurrency>32)throw Error('Intervalo, timeout ou concorrência inválidos.');
 return {...input,server_url:url.origin,interval_seconds:interval,timeout_ms:timeout,concurrency,queue_dir:resolve(base,input.queue_dir||'queue'),targets:targets(input.networks)};
}
export async function flush(config,fetcher=fetch){
 mkdirSync(config.queue_dir,{recursive:true});
 for(const name of readdirSync(config.queue_dir).filter(n=>n.endsWith('.json')).sort()){
  const file=join(config.queue_dir,name),payload=readFileSync(file,'utf8');
  const response=await fetcher(config.server_url+'/api/agent/report',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.token},body:payload,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Envio recusado pelo servidor (HTTP '+response.status+'). Lote preservado.');
  const result=await response.json();if(result.ok!==true)throw Error('Confirmação inválida. Lote preservado.');unlinkSync(file);
 }
}
export async function cycle(config,probe=identify){
 mkdirSync(config.queue_dir,{recursive:true});
 try{await flush(config)}catch(e){console.error(new Date().toISOString(),e.message)}
 const queued=readdirSync(config.queue_dir).filter(n=>n.endsWith('.json')).length;
 if(queued>=1000)throw Error('Fila local cheia (1000 lotes). Corrija a conexão antes de novas coletas.');
 const printers=[];let cursor=0;
 await Promise.all(Array.from({length:Math.min(config.concurrency,config.targets.length)},async()=>{while(cursor<config.targets.length){const ip=config.targets[cursor++];try{const p=await probe(ip,config.community,{timeout:config.timeout_ms});if(p)printers.push(p)}catch{/* Host sem resposta: manter o histórico anterior. */}}}));
 if(queued+Math.max(1,Math.ceil(printers.length/200))>1000)throw Error('Fila sem espaço para o resultado. Corrija a conexão.');
 const observed_at=new Date().toISOString();
 for(let i=0;i<Math.max(printers.length,1);i+=200){const batch={batch_id:randomUUID(),observed_at,hostname:hostname(),version:'0.2.0',printers:printers.slice(i,i+200)};const filename=join(config.queue_dir,Date.now()+'-'+batch.batch_id+'.json');writeFileSync(filename+'.tmp',JSON.stringify(batch),{mode:0o600});renameSync(filename+'.tmp',filename);}
 console.log(observed_at,`${printers.length} impressora(s) identificada(s).`);
 await flush(config);
 return printers.length;
}
async function main(){
 const arg=process.argv.indexOf('--config');const path=resolve(arg>=0?process.argv[arg+1]:join(here,'config.json'));
 const config=configuration(JSON.parse(readFileSync(path,'utf8')),dirname(path));
 let stopping=false;process.on('SIGTERM',()=>stopping=true);process.on('SIGINT',()=>{stopping=true;process.exit(0)});
 do{try{await cycle(config)}catch(e){console.error(new Date().toISOString(),e.message);if(process.argv.includes('--once'))process.exitCode=1}if(process.argv.includes('--once')||stopping)break;await new Promise(r=>setTimeout(r,config.interval_seconds*1000));}while(!stopping);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Falha ao iniciar o agente. Verifique config.json, token e redes.');process.exitCode=1});
