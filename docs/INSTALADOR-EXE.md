# Instalador EXE do Dragon Agent — 0.3

## Como funciona

O administrador gera um **token de instalação por cliente** no Dragon. O mesmo token pode ser usado em vários PCs daquele cliente. Durante a instalação, cada PC gera uma identidade e uma credencial operacional próprias, e o servidor vincula o ponto ao cliente indicado pelo token.

O instalador é `DragonAgentSetup-0.3.0-x64.exe`. Ele contém o `DragonAgent.exe` com runtime embutido: **não é preciso instalar Node.js no PC do cliente**. O Node.js 24 continua sendo necessário no servidor Dragon.

O processo instalado executa pela tarefa Windows `DragonAgent`, como SYSTEM, ao iniciar o computador. Trata-se de execução automática por tarefa, não de um serviço nativo do Windows. O alvo inicial é Windows 10/11 e Windows Server x64 compatíveis com Node.js 24; realizar piloto antes de distribuir.

## 1. Atualize primeiro a plataforma

1. Pare o Dragon e faça backup da pasta `data`.
2. Atualize o código para a versão 0.3, preservando `data` e configurações locais.
3. Reinicie o servidor, mantendo o endereço e a porta 3080.
4. Pressione Ctrl+F5 no navegador.

As tabelas de inscrição e a identidade dos coletores são acrescentadas automaticamente. Coletores manuais existentes continuam aceitos. O servidor antigo sem a versão 0.3 não possui o endpoint de inscrição usado pelo EXE.

## 2. Obtenha o token do cliente

- Ao criar um cliente novo, o Dragon gera e exibe seu token de instalação.
- Para clientes existentes, abra **Clientes → Token de instalação**.
- O token é mostrado uma única vez. Copie e guarde com segurança para as demais instalações do mesmo cliente.
- Ao gerar outro token, o anterior deixa de autorizar novos PCs. As instalações que já terminaram continuam operando.
- **Desativar token** impede novas inscrições, sem parar os agentes existentes.
- Para parar apenas um PC, use **Monitoramento de Conexões → Coletores Windows → Revogar**.

O token do cliente e a credencial operacional do PC são diferentes. Não use o botão de credencial manual como token do instalador EXE. Um PC revogado não volta a funcionar ao simplesmente repetir a instalação; o administrador precisa autorizar a substituição de sua identidade.

## 3. Baixe e instale em cada PC

Baixe o instalador em [Releases do Dragon](https://github.com/victoradriboko-lab/Dragon/releases). O workflow publica uma versão piloto após testes e compilação em Windows. Se uma compilação falhar, não haverá instalador daquela versão para baixar; consulte a execução em Actions.

Execute o EXE como administrador. O assistente solicita:

1. Endereço da plataforma, por exemplo `https://dragon.suaempresa.com.br` ou `http://IP-DO-SERVIDOR:3080`.
2. **Token de instalação do cliente**.
3. Nome do ponto: por exemplo `PC Recepção — Matriz` ou `Servidor — Filial Centro`.
4. IPs ou redes autorizadas: `192.168.1.0/24, 192.168.2.50`.
5. Comunidade SNMP v2c de leitura configurada nas impressoras.
6. Permissão explícita para HTTP, se for um piloto em LAN/VPN confiável. HTTPS é o padrão recomendado.

Revise as redes em cada cliente. Não use `127.0.0.1` para apontar ao Dragon instalado em outro computador. Para clientes em outra empresa, é necessário que o endereço seja alcançável por VPN ou HTTPS; o token não estabelece conectividade sozinho.

Antes de copiar os arquivos definitivos, o instalador valida a configuração e solicita a inscrição ao servidor. Se endereço, certificado, token ou rede forem inválidos, a instalação apresenta erro e não conclui a configuração da tarefa. Repetir a tentativa usa a mesma identidade local e evita duplicar o PC quando apenas a resposta do servidor se perdeu.

Os arquivos do programa ficam em `C:\Program Files\DragonAgent`. Identidade, configuração e fila ficam em `C:\ProgramData\DragonAgent`, com permissões para SYSTEM e administradores. O token compartilhado do cliente é removido do arquivo temporário após a tentativa; apenas a credencial individual do PC permanece na configuração.

## 4. Instale outros PCs do mesmo cliente

Execute o mesmo EXE nos demais PCs e informe o **mesmo token do cliente**, com nomes e redes adequados a cada ponto. A plataforma exibirá um coletor por PC no mesmo cliente. A identidade é criada por instalação, não pelo nome do computador.

Não copie a pasta `C:\ProgramData\DragonAgent` entre PCs e não a inclua em uma imagem clonada: isso copiaria também a identidade e a credencial. Instale o programa em cada máquina e faça a inscrição individual. Um equipamento compartilhado entre clientes deve ter outro desenho de coleta; não reutilize uma instalação mudando arbitrariamente o token.

Impressoras que vários PCs enxergam podem aparecer como descobertas em mais de um ponto. A aprovação reaproveita o cadastro quando série, cliente e IP são os mesmos, evitando criar outro ativo. O painel de duplicidades ajuda a revisar os pontos; não se deve somar contadores de dois agentes como produções diferentes da mesma impressora.

## 5. Atualização, remoção e instalação manual antiga

Executar uma nova versão do instalador com os mesmos dados preserva a identidade, a fila e o vínculo do PC. A desinstalação remove a tarefa e os arquivos do programa, mas preserva `ProgramData` para recuperação e auditoria. Revogue também o coletor na plataforma quando o ponto for desativado.

Se houver uma instalação manual 0.2 no mesmo `ProgramData` sem identidade de inscrição, o EXE recusa sobrescrevê-la silenciosamente. Primeiro envie a fila antiga, pare a tarefa, faça cópia protegida de `config.json` e `queue`, revogue a credencial manual e mova a configuração antiga para o backup. Depois faça uma inscrição nova pelo EXE. Não descarte leituras pendentes nem reutilize a credencial manual como token de cliente.

## Geração e verificações

O workflow `.github/workflows/build-agent.yml` testa o sistema em Windows, gera o agente como Node SEA, testa inscrição com o executável gerado, compila o assistente com Inno Setup, calcula SHA-256 e publica o instalador como prerelease. O EXE e o hash também ficam no artefato `DragonAgent-Windows-x64` da execução.

Para reproduzir em Windows com Node.js 24 e Inno Setup 6:

```powershell
npm ci
npm test
npm run build:agent
# Acrescente a licença do runtime em build\payload\NODE-LICENSE.txt,
# conforme a etapa documentada no workflow, e compile:
& 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe' windows\DragonAgent.iss
```

O executável piloto não possui assinatura Authenticode da sua empresa. O Windows pode mostrar editor desconhecido; a assinatura comercial requer um certificado da empresa e será uma etapa de distribuição posterior. Não desative antivírus ou validação TLS para contornar falhas.

Testes automatizados cobrem vários PCs do mesmo cliente, chave rotacionada, isolamento entre clientes, identidade idempotente, credencial individual revogada, limpeza do token compartilhado, criação de configuração e execução do binário gerado. A instalação interativa completa e a coleta em impressoras reais ainda exigem validação no seu ambiente Windows.
