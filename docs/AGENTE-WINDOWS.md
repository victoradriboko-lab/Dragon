# Agente Dragon para Windows — instalação manual

**O instalador EXE com token do cliente está documentado em [INSTALADOR-EXE.md](INSTALADOR-EXE.md).** Os passos abaixo descrevem a alternativa manual, com credencial individual por coletor. Não confunda essa credencial com o token compartilhado de instalação do cliente.

O agente identifica impressoras de rede por SNMP v2c, guarda os relatórios em uma fila local e envia para o servidor Dragon. Não precisa instalar o servidor web em cada cliente: somente Node.js 24 e os arquivos do agente. Uma única máquina ligada por rede normalmente é suficiente.

## 1. Atualizar o servidor Dragon

Faça backup da pasta `data` com o servidor parado. Atualize os arquivos do repositório, incluindo `collector-api.mjs`, `server.mjs` e a pasta `public`. Preserve `data`. Reinicie com `npm start`, mantendo suas variáveis de endereço e a porta 3080. As novas tabelas são criadas automaticamente; os cadastros existentes são preservados.

O agente precisa alcançar o endereço do servidor: em LAN use o IP/DNS do servidor; em outra empresa use uma VPN ou um endereço HTTPS com certificado confiável. `127.0.0.1` no PC cliente aponta para o próprio PC, não para seu servidor Dragon. Não configure encaminhamento da porta SNMP dos clientes para a internet.

## 2. Gerar uma credencial

1. Entre como administrador no Dragon.
2. Cadastre o cliente, se necessário.
3. Abra **Monitoramento de Conexões → Coletores Windows**.
4. Clique **Cadastrar coletor**, informe nome e cliente.
5. Copie o token mostrado uma única vez. Guarde apenas na configuração protegida do agente. O servidor armazena somente seu hash.

Cada credencial fica vinculada a um cliente. Não reutilize em clientes diferentes. É possível revogar na plataforma; nesse caso o agente deixará de transmitir e preservará a fila. Para trocar a credencial, cadastre outro coletor e substitua o token local.

## 3. Instalar no PC ou servidor Windows do cliente

1. Instale **Node.js 24 LTS**, disponível em https://nodejs.org/.
2. Baixe o repositório e mantenha as pastas `agents` e `windows` juntas.
3. Abra PowerShell **como administrador** na pasta do projeto:

```powershell
.\windows\instalar-agente.ps1
```

O primeiro comando cria `C:\ProgramData\DragonAgent` com acesso limitado a SYSTEM e administradores. Ele copia o agente e um `config.json` de exemplo, mas não inicia a tarefa enquanto o token não estiver preenchido. Caso a política de execução bloqueie o script, execute-o com uma exceção apenas para este processo, se permitido pela política da empresa:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\instalar-agente.ps1
```

4. Edite `C:\ProgramData\DragonAgent\config.json` em um editor executado como administrador:

```json
{
  "server_url": "https://dragon.suaempresa.com.br",
  "token": "TOKEN_GERADO_NA_PLATAFORMA",
  "community": "COMUNIDADE_SNMP_SOMENTE_LEITURA",
  "networks": ["192.168.1.0/24"],
  "interval_seconds": 900,
  "timeout_ms": 800,
  "concurrency": 12,
  "allow_insecure_http": false,
  "queue_dir": "queue"
}
```

Informe as redes reais autorizadas do cliente. Também pode usar IPs específicos, por exemplo `"networks": ["192.168.1.50", "192.168.1.51"]`. A lista é obrigatória: o agente não varre redes inferidas automaticamente, VPNs ou todas as interfaces. Aceita apenas IPv4 privado e CIDRs de /22 a /32, até 4096 endereços no total.

Para um piloto em LAN/VPN confiável sem HTTPS, use `"server_url": "http://IP-DO-SERVIDOR:3080"` e `"allow_insecure_http": true`. HTTP e SNMP v2c não cifram os dados; para operação entre empresas use HTTPS/VPN e uma comunidade de leitura restrita ao coletor. O agente mantém a validação de certificados TLS e não segue redirecionamentos.

5. Antes de ativar, teste **um IP real de impressora**:

```powershell
node C:\ProgramData\DragonAgent\agent.mjs --config C:\ProgramData\DragonAgent\config.json --once
```

O terminal informa a quantidade encontrada e falhas de envio sem imprimir token ou comunidade. A impressora precisa ter SNMP v2c habilitado, comunidade correta e permitir UDP 161 a partir do PC agente. Não é necessário instalar drivers nem habilitar o serviço SNMP do Windows.

6. Execute novamente `windows\instalar-agente.ps1`. Ele registra e inicia a tarefa **DragonAgent**, executada como SYSTEM ao iniciar o computador. A tarefa evita instâncias simultâneas e reinicia o processo após falhas. Não é um serviço nativo nem um instalador MSI; é uma tarefa de inicialização administrada pelo Windows.

## 4. Conferir e aprovar

Na plataforma:

- **Coletores Windows:** computador, versão, última comunicação, última coleta e revogação da credencial.
- **Impressoras → Novas impressoras:** descobertas aguardando aprovação. Confira os dados e clique **Adicionar ao parque**. Os equipamentos aprovados ficam vinculados ao cliente do coletor.
- Sem número de série, não há aprovação automática: confirme a identidade e cadastre manualmente. Identificação do fabricante/modelo é uma aproximação pelos dados SNMP; revise no cadastro.
- **Monitoramentos duplicados:** mesmo número de série em mais de um coletor/IP dentro do cliente. Pode ser movimentação antiga: confira datas antes de concluir que há duplicidade ativa.
- **Níveis dos suprimentos:** dados disponíveis no Printer-MIB, com nível/capacidade/unidade. Valores desconhecidos não viram 0%.
- **Relatórios → Impressões e cópias por impressora:** última leitura do contador total e botão de histórico (últimas 100 leituras). Ainda não separa P&B, coloridas, cópias ou volumes por período.

## Funcionamento e limites

O agente consulta Host Resources MIB e Printer-MIB padrão. Um host precisa anunciar um dispositivo do tipo impressora ou uma tabela de série do Printer-MIB para ser listado. O contador só é apresentado como páginas/impressões quando a unidade do marcador é `impressions(7)`; não soma marcadores para evitar dupla contagem.

Não há garantia para todas as marcas: SNMP v3, USB, protocolo proprietário, digitalizações e contadores separados por cor ainda não foram implementados. Impressoras térmicas e scanners podem não oferecer os MIBs necessários. Timeout ou ausência de resposta não é considerado confirmação de impressora desligada; o histórico anterior é preservado.

Coleta a cada 15 minutos **após terminar o ciclo anterior**, com até 12 consultas simultâneas por padrão. Equipamentos com muitas entradas SNMP ou sem resposta podem alongar a varredura. Configure somente as redes necessárias.

Cada lote tem identificador único. Se o servidor receber e a resposta se perder, a repetição não duplica o lote nem a leitura. Leituras atrasadas alimentam o histórico sem substituir a última leitura mais recente. Mudanças de série no mesmo IP geram uma nova descoberta e exigem aprovação; os históricos anteriores são preservados separadamente.

A fila armazena até 1000 lotes, com até 200 equipamentos por lote. Ao atingir o limite, suspende novas coletas até liberar espaço. O servidor aceita relatórios dos últimos 90 dias: filas mais antigas precisam de revisão manual. Relógios do agente e servidor devem estar sincronizados. Nenhum relatório é removido da fila sem confirmação positiva do servidor. Um lote recusado bloqueia o envio dos seguintes até corrigir a causa; verifique o teste `--once`.

## Atualizar, parar e remover

Para atualizar, pare a tarefa, atualize os arquivos do agente e execute o instalador novamente. Preserve `config.json` e a pasta `queue`.

```powershell
Stop-ScheduledTask -TaskName DragonAgent
Start-ScheduledTask -TaskName DragonAgent
.\windows\remover-agente.ps1
```

Os comandos de parar e iniciar são alternativas de administração, não uma sequência necessária para remover. A remoção exclui apenas a tarefa. Revogue a credencial no Dragon e trate os arquivos locais conforme a política da empresa.

## Validação

`npm test` testa UDP SNMP com uma impressora simulada, leitura de contador/unidade/suprimento, rejeição de roteadores, fila offline, autenticação, aprovação e recebimento idempotente. A instalação da tarefa Windows e a compatibilidade com impressoras reais devem ser verificadas no piloto; não foram executadas em Windows neste ambiente.
