import { test } from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import { mkdtempSync,writeFileSync,readdirSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { identify,query,parseResponse,requestPacket } from '../agents/snmp.mjs';
import { targets,configuration,flush } from '../agents/agent.mjs';

// Impressora SNMP simulada, sem consultar equipamentos ou redes reais.
function node(tag,value){const len=value.length;return Buffer.concat([Buffer.from(len<128?[tag,len]:[tag,0x81,len]),value]);}
const seq=v=>node(0x30,v);
function int(value,tag=2){const b=Buffer.alloc(4);b.writeUInt32BE(value);return node(tag,b);}
function oid(value){const a=value.split('.').map(Number);return node(6,Buffer.from([40*a[0]+a[1],...a.slice(2).flatMap(n=>{const out=[n&127];while(n>>>=7)out.unshift((n&127)|128);return out})]));}
function readAll(buffer){let out=[],pos=0;while(pos<buffer.length){let tag=buffer[pos++],len=buffer[pos++];if(len&128){let count=len&127;len=0;for(let i=0;i<count;i++)len=len*256+buffer[pos++]}out.push({tag,raw:buffer.subarray(pos,pos+len)});pos+=len}return out;}
function oidString(buffer){let parts=[Math.floor(buffer[0]/40),buffer[0]%40],value=0;for(const b of buffer.subarray(1)){value=value*128+(b&127);if(!(b&128)){parts.push(value);value=0}}return parts.join('.');}
function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.min(x.length,y.length);i++){if(x[i]!==y[i])return x[i]-y[i]}return x.length-y.length;}
test('SNMP v2c identifica impressora, série, contador e suprimentos; ignora roteador',async()=>{
 const table=new Map([
 ['1.3.6.1.2.1.1.1.0',node(4,Buffer.from('Brother fixture'))],
 ['1.3.6.1.2.1.25.3.2.1.2.1',oid('1.3.6.1.2.1.25.3.1.5')],
 ['1.3.6.1.2.1.25.3.2.1.3.1',node(4,Buffer.from('Brother TEST-100'))],
 ['1.3.6.1.2.1.43.5.1.1.17.1',node(4,Buffer.from('SERIAL-TEST'))],
 ['1.3.6.1.2.1.43.10.2.1.3.1.1',int(7)],
 ['1.3.6.1.2.1.43.10.2.1.4.1.1',int(123456,0x41)],
 ['1.3.6.1.2.1.43.11.1.1.6.1.1',node(4,Buffer.from('Black toner'))],
 ['1.3.6.1.2.1.43.11.1.1.7.1.1',int(19)],
 ['1.3.6.1.2.1.43.11.1.1.8.1.1',int(100)],
 ['1.3.6.1.2.1.43.11.1.1.9.1.1',int(35)]
 ]);
 const socket=dgram.createSocket('udp4');
 socket.on('message',(data,remote)=>{
  const root=readAll(readAll(data)[0].raw),pdu=readAll(root[2].raw),requested=oidString(readAll(readAll(pdu[3].raw)[0].raw)[0].raw);
  const key=root[2].tag===0xa1?[...table.keys()].sort(compare).find(k=>compare(k,requested)>0):table.has(requested)?requested:undefined;
  const val=key?table.get(key):node(0x82,Buffer.alloc(0));
  const response=seq(Buffer.concat([int(1),node(4,root[1].raw),node(0xa2,Buffer.concat([node(2,pdu[0].raw),int(0),int(0),seq(seq(Buffer.concat([oid(key||requested),val])))]))]));
  socket.send(response,remote.port,remote.address);
 });
 await new Promise(r=>socket.bind(0,'127.0.0.1',r));
 try{
  const options={port:socket.address().port,timeout:300};
  const printer=await identify('127.0.0.1','test-only',options);
  assert.equal(printer.manufacturer,'Brother');assert.equal(printer.serial,'SERIAL-TEST');assert.equal(printer.total_pages,123456);assert.equal(printer.supplies[0].level,35);
  // Em folhas (unidade 8), não apresentar como páginas/impressões.
  table.set('1.3.6.1.2.1.43.10.2.1.3.1.1',int(8));assert.equal((await identify('127.0.0.1','test-only',options)).total_pages,null);
  table.clear();table.set('1.3.6.1.2.1.1.1.0',node(4,Buffer.from('Router fixture')));assert.equal(await identify('127.0.0.1','test-only',options),null);
  await assert.rejects(query('127.0.0.1','test-only','1.3.6.1.2.1.1.1.0',{port:1,timeout:100}));
  assert.throws(()=>parseResponse(requestPacket(1,'test-only','1.3.6.1.2.1.1.1.0'),1,'test-only'));
  assert.throws(()=>parseResponse(Buffer.from([0x30,0x80]),1,'test-only'));
 }finally{socket.close()}
});

test('varredura limitada a redes privadas e fila só é removida após confirmação',async()=>{
 assert.deepEqual(targets(['192.168.1.0/30']),['192.168.1.1','192.168.1.2']);
 assert.equal(targets(['10.0.0.1','10.0.0.1']).length,1);
 assert.throws(()=>targets(['8.8.8.8']));assert.throws(()=>targets(['10.0.0.0/16']));
 const dir=mkdtempSync(join(tmpdir(),'dragon-queue-'));
 const input={server_url:'http://127.0.0.1:3080',token:'a'.repeat(64),community:'test-only',networks:['10.0.0.1'],queue_dir:dir};
 try{
  assert.throws(()=>configuration(input));const c=configuration({...input,allow_insecure_http:true});
  writeFileSync(join(dir,'batch.json'),JSON.stringify({batch_id:'test'}));
  await assert.rejects(flush(c,async()=>({ok:false,status:503})));assert.equal(readdirSync(dir).length,1);
  await assert.rejects(flush(c,async()=>({ok:true,json:async()=>({ok:false})})));assert.equal(readdirSync(dir).length,1);
  let count=0;await flush(c,async(url,request)=>{count++;assert.equal(request.redirect,'error');assert.equal(request.headers.Authorization,'Bearer '+input.token);return {ok:true,json:async()=>({ok:true})}});assert.equal(count,1);assert.equal(readdirSync(dir).length,0);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
