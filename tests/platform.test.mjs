import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';

test('autenticação, proteção dos cadastros e persistência após reinício',async()=>{
 const data=mkdtempSync(join(tmpdir(),'dragon-test-'));
 const probe=net.createServer(); await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const origin=`http://127.0.0.1:${port}`, password='SenhaTeste-Longa-2026';
 const env={...process.env,DRAGON_DATA:data,PORT:String(port),DRAGON_ADMIN_EMAIL:'admin@example.test',DRAGON_ADMIN_PASSWORD:password};
 const init=spawnSync(process.execPath,['server.mjs','--init'],{env,encoding:'utf8'});assert.equal(init.status,0,init.stderr);
 delete env.DRAGON_ADMIN_PASSWORD;
 let child,cookie='',csrf='';
 async function start(){child=spawn(process.execPath,['server.mjs'],{env,stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Servidor não iniciou')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(Error('Servidor encerrou: '+code))})})}
 async function stop(){const done=new Promise(r=>child.once('exit',r));child.kill();await done}
 async function req(path,method='GET',body,extra={}){const r=await fetch(origin+'/api/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf,...extra},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')}}
 try{await start();assert.equal((await req('clients')).status,401);assert.equal((await req('login','POST',{email:'admin@example.test',password:'wrong'})).status,401);
 const login=await req('login','POST',{email:'admin@example.test',password});assert.equal(login.status,200);cookie=login.cookie.split(';')[0];csrf=login.body.csrf;assert.match(login.cookie,/HttpOnly/);
 assert.equal((await req('clients','POST',{name:'Cliente'},{'X-CSRF-Token':''})).status,403);
 assert.equal((await req('clients','POST',{name:'Cliente'},{Origin:'https://evil.test'})).status,403);
 assert.equal((await req('clients','POST',{name:' '})).status,400);
 const c=await req('clients','POST',{name:'Cliente real',contact:'Maria'});assert.equal(c.status,201);
 const printer={client_id:c.body.id,manufacturer:'Brother',model:'DCP',serial:'SN-001',ip:'192.168.1.20'};
 const p=await req('printers','POST',printer);assert.equal(p.status,201);
 assert.equal((await req('printers','POST',printer)).status,409);
 assert.equal((await req('printers','POST',{...printer,serial:'SN-002',client_id:9999})).status,400);
 assert.equal((await req('clients/'+c.body.id,'DELETE',{})).status,409);
 assert.equal((await req('clients/'+c.body.id,'PUT',{name:'Cliente atualizado'})).status,200);
 const dash=await req('dashboard');assert.equal(dash.body.clients,1);assert.equal(dash.body.printers,1);
 await stop();await start();assert.equal((await req('session')).status,200);assert.equal((await req('clients')).body[0].name,'Cliente atualizado');assert.equal((await req('printers')).body[0].serial,'SN-001');
 assert.equal((await req('printers/'+p.body.id,'DELETE',{})).status,200);assert.equal((await req('clients/'+c.body.id,'DELETE',{})).status,200);
 
 const customer=await req('clients','POST',{name:'Cliente coletado'});
 const collector=await req('collectors','POST',{name:'Agente matriz',client_id:customer.body.id});assert.equal(collector.status,201);assert.match(collector.body.token,/^[a-f0-9]{64}$/);
 const list=await req('collectors');assert.equal(list.body[0].token_hash,undefined);assert.equal(list.body[0].token,undefined);
 const machine=async(payload,token=collector.body.token)=>{const r=await fetch(origin+'/api/agent/report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});return {status:r.status,body:await r.json()}};
 const observed=new Date().toISOString();
 const report={batch_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',observed_at:observed,hostname:'PC-CLIENTE',version:'0.2.0',printers:[{ip:'192.168.2.10',manufacturer:'Brother',model:'DCP',serial:'COLLECTED-1',description:'Printer',total_pages:1234,supplies:[{name:'Toner',level:50,capacity:100,unit:19}]}]};
 assert.equal((await machine(report,'0'.repeat(64))).status,401);
 assert.equal((await machine(report)).status,200);assert.equal((await machine(report)).body.duplicate,true);
 let found=(await req('discoveries')).body;assert.equal(found.length,1);assert.equal(found[0].printer_id,null);
 const discoveredId=found[0].id;
 assert.equal((await req('discoveries/'+discoveredId+'/readings')).body.length,1);
 const adopt=await req('discoveries/'+discoveredId+'/approve','POST',{});assert.equal(adopt.status,200);assert.equal((await req('discoveries/'+discoveredId+'/approve','POST',{})).body.id,adopt.body.id);
 assert.equal((await req('printers')).body[0].client_id,customer.body.id);
 const older={...report,batch_id:'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',observed_at:new Date(Date.now()-60000).toISOString(),printers:[{...report.printers[0],total_pages:1000}]};assert.equal((await machine(older)).status,200);assert.equal((await req('discoveries')).body[0].total_pages,1234);
 const invalid={...report,batch_id:'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee',printers:[{...report.printers[0],total_pages:-1}]};assert.equal((await machine(invalid)).status,400);
 const replacement={...report,batch_id:'dddddddd-bbbb-cccc-dddd-eeeeeeeeeeee',observed_at:new Date(Date.now()+1000).toISOString(),printers:[{...report.printers[0],serial:'NEW-DEVICE',total_pages:10}]};assert.equal((await machine(replacement)).status,200);found=(await req('discoveries')).body;assert.equal(found[0].serial,'NEW-DEVICE');assert.equal(found[0].printer_id,null);assert.equal((await req('discoveries/'+discoveredId+'/readings')).body.length,2);
 
 const otherClient=await req('clients','POST',{name:'Outro cliente'});
 const otherCollector=await req('collectors','POST',{name:'Outro agente',client_id:otherClient.body.id});
 const collision={...report,batch_id:'eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee',printers:[{...report.printers[0],ip:'192.168.3.10'}]};
 assert.equal((await machine(collision,otherCollector.body.token)).status,200);
 const conflicting=(await req('discoveries')).body.find(d=>d.client_id===otherClient.body.id);
 assert.equal((await req('discoveries/'+conflicting.id+'/approve','POST',{})).status,409);
 assert.equal((await req('collectors/'+collector.body.id+'/revoke','POST',{})).status,200);assert.equal((await machine(report)).status,401);
 assert.equal((await req('logout','POST',{})).status,200);assert.equal((await req('clients')).status,401);
 const page=await fetch(origin);assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/default-src 'self'/);
 }finally{if(child?.exitCode===null)await stop();rmSync(data,{recursive:true,force:true})}
});
