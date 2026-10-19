import dgram from 'node:dgram';
import { randomInt } from 'node:crypto';

function length(n){if(n<128)return Buffer.from([n]);let a=[];for(;n;n>>>=8)a.unshift(n&255);return Buffer.from([128|a.length,...a]);}
const tlv=(tag,bytes)=>Buffer.concat([Buffer.from([tag]),length(bytes.length),bytes]);
const sequence=bytes=>tlv(0x30,bytes);
const integer=n=>{let a=[];do{a.unshift(n&255);n=Math.floor(n/256)}while(n);if(a[0]&128)a.unshift(0);return tlv(2,Buffer.from(a));};
function base128(n){let a=[Number(n&127n)];while(n>>=7n)a.unshift(Number(n&127n)|128);return a;}
function encodeOID(oid){const a=oid.split('.').map(BigInt);return tlv(6,Buffer.from([...(base128(a[0]*40n+a[1])),...a.slice(2).flatMap(base128)]));}
export function requestPacket(id,community,oid,next=false){return sequence(Buffer.concat([integer(1),tlv(4,Buffer.from(community)),tlv(next?0xa1:0xa0,Buffer.concat([integer(id),integer(0),integer(0),sequence(sequence(Buffer.concat([encodeOID(oid),tlv(5,Buffer.alloc(0))])))]))]));}
function read(buffer,state){if(state.pos+2>buffer.length)throw Error('BER incompleto');let tag=buffer[state.pos++],size=buffer[state.pos++];if(size&128){const n=size&127;if(!n||n>4||state.pos+n>buffer.length)throw Error('Tamanho BER inválido');size=0;for(let i=0;i<n;i++)size=size*256+buffer[state.pos++];}if(state.pos+size>buffer.length)throw Error('BER truncado');const value=buffer.subarray(state.pos,state.pos+size);state.pos+=size;return {tag,value};}
const children=buffer=>{let s={pos:0},out=[];while(s.pos<buffer.length)out.push(read(buffer,s));return out;};
function number(node){if(![2,0x41,0x42,0x43,0x46].includes(node.tag)||!node.value.length)throw Error('Inteiro BER inválido');let n=0n;for(let byte of node.value)n=(n<<8n)|BigInt(byte);if(node.tag===2&&(node.value[0]&128))n-=1n<<BigInt(node.value.length*8);if(n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(Number.MIN_SAFE_INTEGER))return null;return Number(n);}
function decodeOID(buffer){let a=[],n=0n;for(const byte of buffer){n=(n<<7n)|BigInt(byte&127);if(!(byte&128)){a.push(n);n=0n}}if(!a.length||(buffer.at(-1)&128))throw Error('OID inválido');const first=a.shift();return [first<40n?0:first<80n?1:2,first<40n?first:first<80n?first-40n:first-80n,...a].join('.');}
export function parseResponse(buffer,id,community){const root=children(buffer);if(root.length!==1||root[0].tag!==0x30)throw Error('Pacote SNMP inválido');const packet=children(root[0].value);if(packet.length!==3||number(packet[0])!==1||packet[1].tag!==4||packet[1].value.toString()!==community||packet[2].tag!==0xa2)throw Error('Resposta SNMP inválida');const pdu=children(packet[2].value);if(pdu.length!==4||number(pdu[0])!==id||number(pdu[1])!==0)throw Error('Resposta SNMP com erro');const binds=children(pdu[3].value);if(binds.length!==1)throw Error('Variáveis SNMP inválidas');const pair=children(binds[0].value);if(pair.length!==2||pair[0].tag!==6)throw Error('Variável SNMP inválida');const value=pair[1];return {oid:decodeOID(pair[0].value),value:value.tag===4?value.value.toString('utf8').replaceAll('\0','').trim():value.tag===6?decodeOID(value.value):[2,0x41,0x42,0x43,0x46].includes(value.tag)?number(value):null};}
export async function query(host,community,oid,{next=false,timeout=800,port=161}={}){
 return new Promise((resolve,reject)=>{const socket=dgram.createSocket('udp4'),id=randomInt(1,0x3fffffff);let done=false;const timer=setTimeout(()=>finish(Error('SNMP timeout')),timeout);function finish(err,value){if(done)return;done=true;clearTimeout(timer);socket.close();err?reject(err):resolve(value)}socket.on('error',finish);socket.on('message',message=>{try{finish(null,parseResponse(message,id,community))}catch{/* Ignore respostas sem correlação até expirar. */}});socket.connect(port,host,()=>{if(!done)socket.send(requestPacket(id,community,oid,next),error=>{if(error)finish(error)})});});
}
export async function walk(host,community,root,options={}){const out=[];let oid=root;for(let i=0;i<(options.limit||64);i++){const r=await query(host,community,oid,{...options,next:true});if(r.value===null||!r.oid.startsWith(root+'.')||compareOID(r.oid,oid)<=0)break;out.push(r);oid=r.oid}return out;}
function compareOID(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.min(x.length,y.length);i++){if(x[i]!==y[i])return x[i]-y[i]}return x.length-y.length;}
const roots={type:'1.3.6.1.2.1.25.3.2.1.2',model:'1.3.6.1.2.1.25.3.2.1.3',serial:'1.3.6.1.2.1.43.5.1.1.17',marker:'1.3.6.1.2.1.43.10.2.1.4',markerUnit:'1.3.6.1.2.1.43.10.2.1.3',supplyName:'1.3.6.1.2.1.43.11.1.1.6',supplyUnit:'1.3.6.1.2.1.43.11.1.1.7',capacity:'1.3.6.1.2.1.43.11.1.1.8',level:'1.3.6.1.2.1.43.11.1.1.9'};
export async function identify(host,community,options={}){
 const optional=async(root)=>{try{return await walk(host,community,root,options)}catch{return []}};
 const desc=await query(host,community,'1.3.6.1.2.1.1.1.0',options);
 if(typeof desc.value!=='string')return null;
 const types=await optional(roots.type), serial=await optional(roots.serial);
 const printerType=types.find(x=>x.value==='1.3.6.1.2.1.25.3.1.5');
 if(!printerType&&!serial.length)return null; // Não classificar outros equipamentos SNMP como impressoras.
 let model='';if(printerType){try{const result=await query(host,community,roots.model+printerType.oid.slice(roots.type.length),options);if(typeof result.value==='string')model=result.value}catch{}}
 const description=desc.value.slice(0,2000);
 const manufacturer=['Brother','HP','Hewlett-Packard','Ricoh','Epson','Canon','Samsung','Xerox','Lexmark','Kyocera','Konica Minolta','OKI','Toshiba','Sharp','Zebra','Argox','Pantum'].find(n=>(model+' '+description).toLowerCase().includes(n.toLowerCase()))||'';
 const markers=await optional(roots.marker);let total_pages=null;
 for(const marker of markers){try{const unit=await query(host,community,roots.markerUnit+marker.oid.slice(roots.marker.length),options);if(unit.value===7&&Number.isSafeInteger(marker.value)&&marker.value>=0){total_pages=marker.value;break}}catch{}}
 const names=await optional(roots.supplyName), supplies=[];
 for(const item of names.slice(0,32)){const suffix=item.oid.slice(roots.supplyName.length);const values=await Promise.all(['level','capacity','supplyUnit'].map(async key=>{try{const r=await query(host,community,roots[key]+suffix,options);return Number.isSafeInteger(r.value)&&r.value>=0?r.value:null}catch{return null}}));supplies.push({name:String(item.value).slice(0,200),level:values[0],capacity:values[1],unit:values[2]});}
 return {ip:host,manufacturer,model:(model||description).slice(0,500),serial:String(serial[0]?.value||'').slice(0,500),description,total_pages,supplies};
}
