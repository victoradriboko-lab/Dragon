import { readFileSync,writeFileSync,mkdirSync,renameSync,existsSync,unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes,randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { configuration } from './agent.mjs';

function atomic(path,value){writeFileSync(path+'.tmp',JSON.stringify(value,null,2),{mode:0o600});renameSync(path+'.tmp',path);}
export async function enroll(input,stateDir,fetcher=fetch){
 if(!/^[a-f0-9]{64}$/.test(input.client_token||''))throw Error('Informe o token de instalação do cliente.');
 const options=configuration({...input,token:'0'.repeat(64),queue_dir:'queue'},stateDir);
 if(typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>200)throw Error('Informe o nome deste ponto de instalação.');
 mkdirSync(stateDir,{recursive:true});
 const identityPath=join(stateDir,'installation.json'),configPath=join(stateDir,'config.json');
 let identity;
 if(existsSync(identityPath)){
  identity=JSON.parse(readFileSync(identityPath,'utf8'));
  if(identity.server_url!==options.server_url)throw Error('Este PC pertence a outro servidor. Remova ou migre a instalação antes de alterar o servidor.');
 }else{
  if(existsSync(configPath))throw Error('Existe uma configuração antiga neste local. Faça a migração orientada antes de instalar o EXE.');
  identity={installation_id:randomUUID(),device_token:randomBytes(32).toString('hex'),server_url:options.server_url};
  atomic(identityPath,identity); // Reutilizada em novas tentativas: uma resposta perdida não duplica o PC.
 }
 if(!/^[a-f0-9]{64}$/.test(identity.device_token||''))throw Error('Identidade local inválida.');
 const response=await fetcher(options.server_url+'/api/agent/enroll',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:'Bearer '+input.client_token},body:JSON.stringify({installation_id:identity.installation_id,device_token:identity.device_token,name:input.name.trim(),hostname:hostname().slice(0,200)}),signal:AbortSignal.timeout(20000)});
 if(!response.ok){const messages={401:'Token do cliente inválido ou desativado.',403:'Este PC foi revogado pelo administrador.',409:'Este PC já está vinculado a outro cliente ou credencial.',429:'Muitas tentativas. Aguarde um minuto.'};throw Error(messages[response.status]||'Não foi possível registrar o PC (HTTP '+response.status+').');}
 const result=await response.json();
 if(result.ok!==true||!Number.isSafeInteger(result.client_id)||!Number.isSafeInteger(result.collector_id)||typeof result.client_name!=='string')throw Error('Resposta de inscrição inválida.');
 atomic(configPath,{server_url:options.server_url,token:identity.device_token,community:input.community,networks:input.networks,interval_seconds:options.interval_seconds,timeout_ms:options.timeout_ms,concurrency:options.concurrency,allow_insecure_http:input.allow_insecure_http===true,queue_dir:'queue',client_id:result.client_id,client_name:result.client_name,collector_id:result.collector_id});
 return result;
}
export async function enrollFromFile(path,stateDir){
 try{
  const input=JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
  const result=await enroll(input,stateDir);
  writeFileSync(join(stateDir,'installation-status.txt'),'PC vinculado ao cliente: '+result.client_name,{mode:0o600});
  return result;
 }catch(error){
  // Mensagens próprias são seguras; mensagens de bibliotecas nunca incluem input ou credenciais.
  const safe=/^(Informe|Este PC|Existe uma|Token do|Não foi possível registrar|Muitas tentativas|Identidade local|Resposta de)/.test(error.message)?error.message:'Falha na instalação. Verifique endereço do servidor, rede, SNMP e certificado HTTPS.';
  mkdirSync(stateDir,{recursive:true});writeFileSync(join(stateDir,'installation-status.txt'),safe,{mode:0o600});throw Error(safe);
 }finally{if(existsSync(path))unlinkSync(path);}
}
