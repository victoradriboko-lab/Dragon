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
 assert.equal((await req('logout','POST',{})).status,200);assert.equal((await req('clients')).status,401);
 const page=await fetch(origin);assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/default-src 'self'/);
 }finally{if(child?.exitCode===null)await stop();rmSync(data,{recursive:true,force:true})}
});
