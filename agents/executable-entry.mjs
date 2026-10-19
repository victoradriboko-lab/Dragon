import { join,dirname } from 'node:path';
import { runAgent,configuration,AGENT_VERSION } from './agent.mjs';
import { enrollFromFile } from './enroll.mjs';
import { readFileSync } from 'node:fs';

function argument(name){const i=process.argv.indexOf(name);if(i<0)return null;if(!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw Error('Argumento ausente: '+name);return process.argv[i+1];}
async function main(){
 if(process.argv.includes('--version')){console.log('Dragon Agent '+AGENT_VERSION);return;}
 const enrollment=argument('--enroll-file');
 if(enrollment){const state=argument('--state');if(!state)throw Error('Diretório de instalação ausente.');await enrollFromFile(enrollment,state);console.log('Inscrição concluída.');return;}
 const config=argument('--config')||join(process.env.ProgramData||dirname(process.execPath),'DragonAgent','config.json');
 if(process.argv.includes('--validate-config')){configuration(JSON.parse(readFileSync(config,'utf8')),dirname(config));console.log('Configuração válida.');return;}
 await runAgent(config);
}
main().catch(()=>{console.error('Falha no agente. Consulte installation-status.txt ou valide a configuração.');process.exitCode=1});
