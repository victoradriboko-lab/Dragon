import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn,spawnSync } from 'node:child_process';
import { mkdtempSync,rmSync,readFileSync,writeFileSync,existsSync,mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import net from 'node:net';
import { randomBytes,randomUUID } from 'node:crypto';
import { enroll,enrollFromFile } from '../agents/enroll.mjs';

test('token do cliente cadastra vários PCs, preserva identidade e permite revogação individual',async()=>{
 const data=mkdtempSync(join(tmpdir(),'dragon-enrollment-'));
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const origin=`http://127.0.0.1:${port}`;
 const env={...process.env,DRAGON_DATA:join(data,'db'),PORT:String(port),DRAGON_ADMIN_EMAIL:'admin@example.test',DRAGON_ADMIN_PASSWORD:'Enrollment-test-2026'};
 const init=spawnSync(process.execPath,['server.mjs','--init'],{env,encoding:'utf8'});assert.equal(init.status,0,init.stderr);
 const server=spawn(process.execPath,['server.mjs'],{env,stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j)});
  const login=await fetch(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:env.DRAGON_ADMIN_EMAIL,password:env.DRAGON_ADMIN_PASSWORD})});const session=await login.json(),cookie=login.headers.get('set-cookie').split(';')[0];
  const admin=async(path,method='GET',body)=>{const r=await fetch(origin+'/api/'+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':session.csrf},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()}};
  const a=await admin('clients','POST',{name:'Cliente São Paulo'}),b=await admin('clients','POST',{name:'Cliente B'});
  assert.match(a.body.installation_token,/^[a-f0-9]{64}$/);assert.notEqual(a.body.installation_token,b.body.installation_token);
  const payload=(id=randomUUID())=>({installation_id:id,device_token:randomBytes(32).toString('hex'),name:'PC Matriz',hostname:'PC-CLIENTE'});
  const register=async(key,p)=>{const r=await fetch(origin+'/api/agent/enroll',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(p)});return {status:r.status,body:await r.json()}};
  const pc1=payload(),pc2=payload();
  const first=await register(a.body.installation_token,pc1),second=await register(a.body.installation_token,pc2);
  assert.equal(first.status,201);assert.equal(second.status,201);assert.equal(first.body.client_id,a.body.id);assert.equal(second.body.client_id,a.body.id);assert.notEqual(first.body.collector_id,second.body.collector_id);
  assert.equal((await register(a.body.installation_token,pc1)).status,200);assert.equal((await admin('collectors')).body.length,2);
  assert.equal((await register(b.body.installation_token,pc1)).status,409);assert.equal((await register(a.body.installation_token,{...pc1,device_token:'f'.repeat(64)})).status,409);
  const keys=(await admin('client-installation-keys')).body;assert.equal(keys[0].token_hash,undefined);assert.equal(keys[0].token,undefined);
  const rotated=await admin('clients/'+a.body.id+'/installation-key','POST',{});assert.equal(rotated.status,201);assert.equal((await register(a.body.installation_token,payload())).status,401);
  const report=async(token)=>fetch(origin+'/api/agent/report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({batch_id:randomUUID(),observed_at:new Date().toISOString(),hostname:'PC-CLIENTE',version:'0.3.0',printers:[]})});
  assert.equal((await report(pc1.device_token)).status,200);assert.equal((await report(rotated.body.token)).status,401);
  await admin('collectors/'+first.body.collector_id+'/revoke','POST',{});assert.equal((await report(pc1.device_token)).status,401);assert.equal((await report(pc2.device_token)).status,200);assert.equal((await register(rotated.body.token,pc1)).status,403);
  const state=join(data,'installation'),input={server_url:origin,client_token:rotated.body.token,name:'Unidade Centro',community:'test-only',networks:['192.168.1.50'],allow_insecure_http:true};
  const installed=await enroll(input,state);assert.equal(installed.client_id,a.body.id);
  const config=JSON.parse(readFileSync(join(state,'config.json'),'utf8'));assert.equal(config.client_token,undefined);assert.notEqual(config.token,input.client_token);assert.equal(config.client_name,'Cliente São Paulo');
  const before=(await admin('collectors')).body.length;await enroll(input,state);assert.equal((await admin('collectors')).body.length,before);
  await assert.rejects(enroll({...input,client_token:b.body.installation_token},state));
  assert.equal(JSON.parse(readFileSync(join(state,'config.json'),'utf8')).client_id,a.body.id);
  // Uma resposta perdida é repetida com a mesma identidade, sem criar outro PC.
  const retryState=join(data,'retry');let failed=false;
  await assert.rejects(enroll(input,retryState,async(...args)=>{await fetch(...args);failed=true;throw Error('Resposta perdida')}));assert.equal(failed,true);
  const registeredBefore=(await admin('collectors')).body.length;await enroll(input,retryState);assert.equal((await admin('collectors')).body.length,registeredBefore);
  const invalidPath=join(state,'pending.json');writeFileSync(invalidPath,JSON.stringify({...input,client_token:'invalid'}));await assert.rejects(enrollFromFile(invalidPath,state));assert.equal(existsSync(invalidPath),false);
  if(process.env.DRAGON_AGENT_BINARY){
   const exe=process.env.DRAGON_AGENT_BINARY,version=spawnSync(exe,['--version'],{encoding:'utf8'});assert.equal(version.status,0,version.stderr);assert.match(version.stdout,/Dragon Agent 0\.3\.0/);
   const binaryState=join(data,'binary');mkdirSync(binaryState);const file=join(binaryState,'enrollment.json');writeFileSync(file,JSON.stringify(input));
   const result=spawnSync(exe,['--enroll-file',file,'--state',binaryState],{encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);assert.equal(existsSync(file),false);
   const saved=JSON.parse(readFileSync(join(binaryState,'config.json'),'utf8'));assert.equal(saved.client_id,a.body.id);assert.equal(saved.client_token,undefined);
   const validation=spawnSync(exe,['--validate-config','--config',join(binaryState,'config.json')],{encoding:'utf8'});assert.equal(validation.status,0,validation.stderr);
  }
  await admin('clients/'+a.body.id+'/installation-key/revoke','POST',{});assert.equal((await register(rotated.body.token,payload())).status,401);assert.equal((await report(pc2.device_token)).status,200);
 }finally{const exited=new Promise(r=>server.once('exit',r));server.kill();await exited;rmSync(data,{recursive:true,force:true})}
});
