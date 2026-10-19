# Dragon no Windows Server 2025

## O que esta versão entrega

Aplicação web local com login, cadastro, edição, busca e exclusão de clientes e impressoras, e painel com totais reais. Os dados e sessões persistem em SQLite no servidor. Não há dependências npm externas.

Esta primeira versão usa SQLite para simplificar a instalação. PostgreSQL é uma evolução possível, ainda não implementada. Não existe coletor SNMP, contrato, faturamento ou leitura automática nesta versão. O layout anterior continua em `dist/index.html` como referência visual; o sistema funcional é iniciado por `server.mjs`.

## Instalar e abrir no servidor

1. Instale o Node.js 24 LTS para Windows a partir de https://nodejs.org/ e abra um novo PowerShell.
2. Baixe ou clone o repositório em `C:\Dragon`. Se usar Download ZIP, extraia e identifique a pasta que contém `package.json`.
3. No PowerShell, entre nessa pasta:

```powershell
cd C:\Dragon
node --version
.\scripts\configurar.ps1
```

Informe seu e-mail e uma senha com pelo menos 12 caracteres. A senha é solicitada de forma oculta e armazenada no banco como hash com salt. A configuração inicial recusa substituir um administrador existente.

Se a política de execução bloquear os scripts, use os comandos equivalentes abaixo sem alterar a política da máquina:

```powershell
$env:DRAGON_ADMIN_EMAIL = Read-Host 'E-mail'
$secret = Read-Host 'Senha de pelo menos 12 caracteres' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $env:DRAGON_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  node server.mjs --init
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Item Env:DRAGON_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:DRAGON_ADMIN_EMAIL -ErrorAction SilentlyContinue
}
```

4. Inicie a aplicação:

```powershell
npm start
```

5. Abra **http://127.0.0.1:3080** no próprio servidor e entre com o administrador criado.

O processo precisa permanecer em execução. Por padrão, o sistema aceita apenas conexões do próprio servidor. Não existe senha padrão ou cadastro público de administradores.

## Acesso na empresa

Para um teste em rede local confiável, defina o IP LAN do servidor e a origem exata usada pelos navegadores antes de iniciar:

```powershell
$env:DRAGON_HOST = '192.168.1.10'
$env:DRAGON_ORIGIN = 'http://192.168.1.10:3080'
npm start
```

Substitua o IP pelo endereço real. O firewall deve permitir a porta 3080 apenas para a rede interna autorizada. HTTP não cifra as credenciais: para uso operacional na rede, configure HTTPS no IIS com proxy reverso ARR/URL Rewrite para `http://127.0.0.1:3080`, certificado válido e:

```powershell
$env:DRAGON_HOST = '127.0.0.1'
$env:DRAGON_ORIGIN = 'https://dragon.suaempresa.com.br'
$env:DRAGON_SECURE_COOKIE = '1'
npm start
```

A configuração do IIS, DNS e certificado depende do servidor e não é feita automaticamente por este projeto. Não publique a porta 3080 na internet. O acesso dos futuros coletores externos será definido na etapa da integração.

## Iniciar junto com o Windows

Para o piloto, crie uma tarefa no Agendador de Tarefas:

- Gatilho: ao iniciar o computador.
- Programa: caminho absoluto do `node.exe`, normalmente `C:\Program Files\nodejs\node.exe`.
- Argumentos: `C:\Dragon\server.mjs`.
- Iniciar em: `C:\Dragon`.
- Usar conta de serviço dedicada, com leitura dos arquivos e escrita apenas em `C:\Dragon\data`.
- Executar mesmo sem usuário conectado e reiniciar a tarefa em caso de falha.

Variáveis de configuração devem ser definidas para a conta da tarefa ou por um wrapper de inicialização. Não coloque a senha de configuração na tarefa. O projeto ainda não inclui um instalador de serviço do Windows.

## Banco, backup e atualização

O banco fica em `data\dragon.sqlite`, acompanhado de arquivos WAL/SHM enquanto a aplicação está aberta. Essa pasta não deve ir para o GitHub. Restrinja suas permissões à conta da aplicação e aos administradores.

Para um backup consistente nesta versão: pare a aplicação/tarefa, copie a pasta `data` inteira para um local protegido fora do servidor e reinicie. Para restaurar: pare a aplicação, guarde uma cópia do estado atual, restaure a pasta `data` e reinicie. Automatização de backup e restauração deve ser configurada no ambiente.

Antes de atualizar o código, faça backup e pare a aplicação. Preserve a pasta `data`. Não execute `configurar.ps1` novamente.

## Verificação

```powershell
npm test
```

Os testes usam um banco temporário isolado e verificam login, proteção contra pedidos de outra origem, cadastros, vínculo de impressoras e persistência após reinício. A instalação no Windows Server, IIS e impressoras reais ainda exige validação no seu ambiente. Redefinição de senha, permissões por usuário, auditoria e coletor são próximos desenvolvimentos.
