# Dragon — Plataforma local de gestão de impressão

Versão 0.2 funcional para instalação no Windows Server 2025, com visual inspirado na Servitec.

## Disponível

- Login com administrador e senha protegida por hash.
- Cadastro, busca, edição e exclusão de clientes e impressoras.
- Vínculo dos equipamentos aos clientes.
- Painel com quantidades reais do banco local.
- Banco SQLite persistente, sem servidor de banco separado.
- Agente Windows SNMP v2c com descoberta, fila offline e envio autenticado.
- Credenciais por coletor/cliente, aprovação de descobertas, suprimentos e histórico de contadores.

## Instalação no servidor

Instale o **Node.js 24 LTS**, baixe o projeto e abra o PowerShell na pasta:

```powershell
cd C:\Dragon
.\scripts\configurar.ps1
npm start
```

O configurador solicita e-mail e senha do administrador. Abra **http://127.0.0.1:3080** no servidor.

## Acesso em rede local

Para um teste na rede interna, substitua pelo IP LAN real do servidor:

```powershell
$env:DRAGON_HOST = '192.168.1.10'
$env:DRAGON_ORIGIN = 'http://192.168.1.10:3080'
npm start
```

Nos computadores da empresa, acesse **http://192.168.1.10:3080**. Configure o firewall para permitir a porta somente na rede interna. Para uso operacional, configure HTTPS com IIS conforme o guia. Sem essas variáveis, o padrão é aceitar somente acesso no próprio servidor.

**[Guia completo de instalação, HTTPS, inicialização e backup](docs/INSTALACAO-WINDOWS.md)**

## Testes

```powershell
npm test
```

Testes de integração cobrem autenticação, proteção de requisições, cadastros e persistência após reiniciar a aplicação. Executados com sucesso em Node.js 24 no ambiente de desenvolvimento; instalação Windows/IIS precisa de validação no servidor de destino.

## Escopo

Contratos, faturamento, gestão de usuários e instalador como serviço nativo Windows ainda não estão implementados. O agente usa uma tarefa agendada no Windows e requer validação nas impressoras de cada cliente. A versão funcional usa `server.mjs` e `public/`. O arquivo `dist/index.html` é apenas o protótipo visual anterior.

O banco fica em `data/`, ignorado pelo Git. Não envie dados de clientes ou senhas ao repositório. O código no GitHub é instalado e executado no servidor da empresa.

## Instalar o agente nos clientes

Consulte **[Agente Windows: configuração, instalação e validação](docs/AGENTE-WINDOWS.md)**. Cadastre um coletor na plataforma para obter uma credencial, configure as redes privadas autorizadas e instale a tarefa Windows. Não envie `config.json`, tokens ou comunidades SNMP ao GitHub. SNMP v3, USB e contadores separados por cor não estão implementados.
