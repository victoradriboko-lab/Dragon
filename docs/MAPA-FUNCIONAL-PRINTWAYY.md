# Mapa funcional de referência — Dragon local

Levantamento em **19/10/2026**, com leitura dos **52 artigos publicados**, da página de perguntas frequentes e do índice da [central de ajuda PrintWayy](https://help.printwayy.com/). O endpoint público WordPress informou 52 artigos em uma página; a lista completa de fontes está no final e em `referencia-printwayy/fontes.json`.

Este é um levantamento de funções públicas para implementar de forma independente no Dragon. Não é código da PrintWayy, reprodução dos tutoriais, promessa de paridade integral ou comprovação de funções privadas. Conteúdo apenas visual, vídeos e documentos externos não expostos em texto podem conter detalhes adicionais. Regras e periodicidades precisam ser confirmadas no desenho de cada módulo. Consultado o Dragon 0.2 atual para classificar o que já existe.

## Resultado

**184 itens de escopo**, incluindo requisitos próprios do ambiente local e exclusões comerciais. Distribuição:

| Situação | Quantidade |
|---|---:|
| existente | 7 |
| parcial | 15 |
| pendente | 155 |
| opcional | 3 |
| fora_escopo | 4 |

`existente` significa comportamento presente no código, com validação de desenvolvimento; não significa homologação no servidor Windows e em todos os modelos. `parcial` identifica uma base existente com lacunas. Uma tela de módulo previsto não conta como funcionalidade implementada. `opcional` não bloqueia a operação inicial. `fora_escopo` trata da cobrança/serviços da própria PrintWayy, sem relação com o uso local contratado pelo usuário.

O detalhe estruturado, critérios de aceite, observações e fontes de cada item está em [CSV para Excel](referencia-printwayy/requisitos.csv) e [JSON](referencia-printwayy/requisitos.json).

## Inventário por módulo

### Interface e relatórios comuns

| ID | Função | Situação | Etapa |
|---|---|---|---|
| UX-001 | Menu lateral e grupos de navegação | existente | F1 |
| UX-002 | Busca nas listas | parcial | F1 |
| UX-003 | Seleção, ordenação e paginação de tabelas | pendente | F1 |
| UX-004 | Preferências de colunas por usuário | pendente | F1 |
| UX-005 | Exportação Excel conforme filtros | pendente | F1 |
| UX-006 | Ocultar e consultar registros inativos | pendente | F1 |
| UX-007 | Atalhos entre cliente, equipamento e contrato | pendente | F1 |
| UX-008 | Ajuda contextual e acessibilidade | pendente | F1 |
| UX-009 | Gráficos com séries selecionáveis | pendente | F1 |
| UX-010 | Preferências de títulos e colunas dos relatórios | pendente | F1 |

### Clientes e locais

| ID | Função | Situação | Etapa |
|---|---|---|---|
| CLI-001 | Cadastro básico de clientes | existente | F1 |
| CLI-002 | Código externo para integração | pendente | F1 |
| CLI-003 | Razão social, nome comercial e documento | pendente | F1 |
| CLI-004 | Matriz e filiais com endereços | pendente | F1 |
| CLI-005 | Departamentos por local | pendente | F1 |
| CLI-006 | Centros de custo | pendente | F1 |
| CLI-007 | Configurações de módulos por cliente | pendente | F1 |
| CLI-008 | Horários úteis e SLA do cliente | pendente | F1 |
| CLI-009 | Chave de instalação vinculada ao cliente | parcial | F1 |

### Usuários e permissões

| ID | Função | Situação | Etapa |
|---|---|---|---|
| USR-001 | Login administrativo | existente | F1 |
| USR-002 | Cadastro de colaboradores | pendente | F1 |
| USR-003 | Contas de clientes | pendente | F1 |
| USR-004 | Permissões por módulo e operação | pendente | F1 |
| USR-005 | Escopo por cliente, local e unidade da empresa | pendente | F1 |
| USR-006 | Convite e definição inicial de senha | pendente | F1 |
| USR-007 | Recuperação e alteração de senha | pendente | F1 |
| USR-008 | Preferências pessoais de notificações | pendente | F1 |

### Empresa e preferências

| ID | Função | Situação | Etapa |
|---|---|---|---|
| EMP-001 | Cadastro da empresa e contatos | pendente | F1 |
| EMP-002 | Logotipo na plataforma e relatórios | pendente | F1 |
| EMP-003 | Unidades e documentos da prestadora | pendente | F1 |
| EMP-004 | Departamentos internos e localização do parque | pendente | F1 |
| EMP-005 | Calendário e horários úteis da empresa | pendente | F1 |
| EMP-006 | Módulos padrão para novos clientes | pendente | F1 |
| EMP-007 | Regras gerais de desvinculação contratual | pendente | F1 |

### Parque de impressoras

| ID | Função | Situação | Etapa |
|---|---|---|---|
| PAR-001 | Cadastro de impressoras e vínculo ao cliente | parcial | F2 |
| PAR-002 | Consulta por cliente | existente | F2 |
| PAR-003 | Proprietário e situação patrimonial | pendente | F2 |
| PAR-004 | Estoque de equipamentos na própria empresa | pendente | F2 |
| PAR-005 | Instalação, retirada e movimentação datadas | pendente | F2 |
| PAR-006 | Reativação como nova passagem ou continuação | pendente | F2 |
| PAR-007 | Histórico de ações e alterações | pendente | F2 |
| PAR-008 | Local, departamento, centro de custo e observações | pendente | F2 |
| PAR-009 | Comentários no equipamento | pendente | F2 |
| PAR-010 | Descobertas aguardando aprovação | parcial | F2 |
| PAR-011 | Ignorar descoberta em varreduras futuras | pendente | F2 |
| PAR-012 | Identificação de monitoramentos duplicados | parcial | F2 |
| PAR-013 | Modo backup ou reserva | pendente | F2 |
| PAR-014 | Preferências individuais de alerta e trocas | pendente | F2 |
| PAR-015 | SLA específico da impressora | pendente | F2 |
| PAR-016 | Linha do tempo de suprimentos e peças | pendente | F2 |

### Agente e conectividade

| ID | Função | Situação | Etapa |
|---|---|---|---|
| AGE-001 | Identificação SNMP em IPv4 privado | parcial | F2 |
| AGE-002 | Busca por IP e faixas configuradas | existente | F2 |
| AGE-003 | Detecção automática da sub-rede e broadcast | pendente | F2 |
| AGE-004 | Seleção do que monitorar por ponto | pendente | F2 |
| AGE-005 | Vínculo autenticado por cliente e coletor | existente | F2 |
| AGE-006 | Pré-cadastro remoto de impressora e IP | pendente | F2 |
| AGE-007 | Monitoramento USB no Windows | pendente | F2 |
| AGE-008 | Perfis de credenciais SNMP e HTTP por equipamento | pendente | F2 |
| AGE-009 | Instalação e remoção do agente | parcial | F2 |
| AGE-010 | Fila persistente e reenvio autenticado | existente | F2 |
| AGE-011 | Configuração e teste de proxy | pendente | F2 |
| AGE-012 | Transporte por e-mail para ambiente restrito | opcional | F2 |
| AGE-013 | Diagnóstico do ponto e dos equipamentos | parcial | F2 |
| AGE-014 | Persistência e restauração do estado do agente | pendente | F2 |
| AGE-015 | Atualização controlada e supervisão do agente | pendente | F2 |
| AGE-016 | Compatibilidade homologada por modelo e conexão | pendente | F2 |

### Contadores e histórico

| ID | Função | Situação | Etapa |
|---|---|---|---|
| CNT-001 | Contador total e data da leitura | parcial | F2 |
| CNT-002 | Contadores P&B, cor, cópia e digitalização | pendente | F2 |
| CNT-003 | Lançamento manual datado | pendente | F2 |
| CNT-004 | Edição e exclusão de leituras manuais | pendente | F2 |
| CNT-005 | Tratamento de reset e troca de placa | pendente | F2 |
| CNT-006 | Produção diária, mensal e por período | pendente | F2 |
| CNT-007 | Limites de período e leitura ausente | pendente | F2 |
| CNT-008 | Separação de passagem e cliente no histórico | pendente | F2 |
| CNT-009 | Interpretação de A3 e contadores por cor | pendente | F2 |

### Dispositivos de TI

| ID | Função | Situação | Etapa |
|---|---|---|---|
| DIS-001 | Cadastro de ativos além de impressoras | pendente | F3 |
| DIS-002 | Catálogo de tipos, fabricantes e modelos | pendente | F3 |
| DIS-003 | IP, MAC, localização e manutenção | pendente | F3 |
| DIS-004 | Movimentação, comentários e histórico | pendente | F3 |
| DIS-005 | Vinculação de dispositivos aos contratos | pendente | F3 |
| DIS-006 | Listagem customizável e exportação | pendente | F3 |

### Contratos e preços

| ID | Função | Situação | Etapa |
|---|---|---|---|
| CON-001 | Contrato, vigência e ciclo de faturamento | pendente | F3 |
| CON-002 | Contrato padrão do cliente | pendente | F3 |
| CON-003 | CPP por tipo de produção | pendente | F3 |
| CON-004 | Franquia individual ou compartilhada com excedente | pendente | F3 |
| CON-005 | Faixas de produção, valor fixo e excedentes | pendente | F3 |
| CON-006 | Custos padrão, fixos e adicionais | pendente | F3 |
| CON-007 | Mensalidade mínima | pendente | F3 |
| CON-008 | Vínculos de impressoras e dispositivos | pendente | F3 |
| CON-009 | Configuração de congelamento e tolerância de comunicação | pendente | F3 |
| CON-010 | Reajuste imediato ou programado | pendente | F3 |
| CON-011 | Histórico do reajuste e impacto em períodos abertos | pendente | F3 |

### Fechamentos mensais

| ID | Função | Situação | Etapa |
|---|---|---|---|
| FEC-001 | Listagem mensal e totais filtrados | pendente | F3 |
| FEC-002 | Estados em andamento, processado e congelado | pendente | F3 |
| FEC-003 | Detalhamento de produção e custos | pendente | F3 |
| FEC-004 | Validação de pendências antes de congelar | pendente | F3 |
| FEC-005 | Cobrança proporcional de passagem parcial | pendente | F3 |
| FEC-006 | Acréscimos, descontos e observações | pendente | F3 |
| FEC-007 | Congelamento manual e automático | pendente | F3 |
| FEC-008 | Descongelamento controlado | pendente | F3 |
| FEC-009 | Encerramento antecipado e saldo de dias | pendente | F3 |
| FEC-010 | Número do documento e relatório personalizável | pendente | F3 |
| FEC-011 | Envio do fechamento ao congelar | pendente | F3 |

### Estoque e materiais

| ID | Função | Situação | Etapa |
|---|---|---|---|
| EST-001 | Cadastro de itens, códigos, cor e vida útil | pendente | F5 |
| EST-002 | Compatibilidade por modelo e rendimento específico | pendente | F5 |
| EST-003 | Tipos, marcas e fornecedores | pendente | F5 |
| EST-004 | Preço de venda usado no atendimento | pendente | F5 |
| EST-005 | Entrada individual ou múltipla com documento e fornecedor | pendente | F5 |
| EST-006 | Saldos por empresa, técnico, cliente e local | pendente | F5 |
| EST-007 | Transferência entre detentores | pendente | F5 |
| EST-008 | Devolução ao estoque da empresa | pendente | F5 |
| EST-009 | Vínculo da retirada à troca ou chamado | pendente | F5 |

### Suprimentos e reposição

| ID | Função | Situação | Etapa |
|---|---|---|---|
| SUP-001 | Níveis reportados e desconhecidos | parcial | F5 |
| SUP-002 | Consultas avançadas salvas e temporárias | pendente | F5 |
| SUP-003 | Tipos de suprimentos monitorados por equipamento | pendente | F5 |
| SUP-004 | Sugestão de troca por alteração de nível, capacidade ou série | pendente | F5 |
| SUP-005 | Troca manual e confirmação pendente | pendente | F5 |
| SUP-006 | Trocas confirmadas, descartadas e exclusão | pendente | F5 |
| SUP-007 | Confirmação automática por estoque compatível | pendente | F5 |
| SUP-008 | Linha do tempo e exclusão de dados das médias | pendente | F5 |
| SUP-009 | Trocas prematuras e janelas de análise | pendente | F5 |
| SUP-010 | Médias de rendimento, eficiência e cobertura | pendente | F5 |
| SUP-011 | Estimativa de nível e data de substituição | pendente | F5 |
| SUP-012 | Reposição por período e estoque de segurança | pendente | F5 |
| SUP-013 | Programação, envio e recebimento da reposição | pendente | F5 |
| SUP-014 | Recebimento pelo usuário do cliente | pendente | F5 |
| SUP-015 | Validação de dados anômalos nas trocas | pendente | F5 |

### Alertas e manutenção

| ID | Função | Situação | Etapa |
|---|---|---|---|
| ALE-001 | Falha de comunicação de impressora e agente | pendente | F4 |
| ALE-002 | Tolerância em horas corridas ou úteis | pendente | F4 |
| ALE-003 | Eventos emitidos pelo equipamento | pendente | F4 |
| ALE-004 | Manutenção por dias, páginas ou suprimento | pendente | F4 |
| ALE-005 | Escopo por cliente, fabricante, modelo e exceção | pendente | F4 |
| ALE-006 | Criticidade e habilitação por tipo | pendente | F4 |
| ALE-007 | Estados ativos, ignorados, encerrados e em chamado | pendente | F4 |
| ALE-008 | Estabilidade antes de encerrar falha | pendente | F4 |
| ALE-009 | Encerramento com data da manutenção | pendente | F4 |
| ALE-010 | Abrir chamado a partir de alerta | pendente | F4 |

### Chamados e assistência

| ID | Função | Situação | Etapa |
|---|---|---|---|
| CHA-001 | Abertura por colaborador e cliente | pendente | F4 |
| CHA-002 | Chamado interno, impressora ou dispositivo | pendente | F4 |
| CHA-003 | Triagem sem responsável e distribuição | pendente | F4 |
| CHA-004 | Quadro pendente, em execução e finalizado | pendente | F4 |
| CHA-005 | Comentários internos e públicos | pendente | F4 |
| CHA-006 | Serviços, peças e custos adicionais | pendente | F4 |
| CHA-007 | Associação de alertas ao atendimento | pendente | F4 |
| CHA-008 | Desconto, pagamento e encerramento | pendente | F4 |
| CHA-009 | Histórico e impressão do atendimento | pendente | F4 |
| CHA-010 | Cadastro de tipos e serviços | pendente | F4 |
| CHA-011 | SLA por cliente, filial e equipamento | pendente | F4 |
| CHA-012 | Relatórios customizados salvos | pendente | F4 |

### Relatórios e notificações

| ID | Função | Situação | Etapa |
|---|---|---|---|
| REL-001 | Impressões e cópias por equipamento e período | parcial | F6 |
| REL-002 | Digitalizações por equipamento | pendente | F6 |
| REL-003 | Totais por cliente e contrato | pendente | F6 |
| REL-004 | Agrupamento por local, departamento e centro de custo | pendente | F6 |
| REL-005 | Gráficos de produção diária e mensal | pendente | F6 |
| REL-006 | Agendamento mensal de relatórios por e-mail | pendente | F6 |
| REL-007 | Resumo diário de fechamentos | pendente | F6 |
| REL-008 | Gatilhos de eventos e destinatários | pendente | F6 |
| REL-009 | Notificações por nível, estoque ou previsão | pendente | F6 |
| REL-010 | Destinatários e preferências por usuário | pendente | F6 |

### Integrações

| ID | Função | Situação | Etapa |
|---|---|---|---|
| API-001 | Token de integração separado do agente | pendente | F6 |
| API-002 | API de clientes, impressoras e alertas | pendente | F6 |
| API-003 | API de chamados, suprimentos e estoque | pendente | F6 |
| API-004 | API financeira | pendente | F6 |
| API-005 | Inclusão e atualização de clientes e estoque | pendente | F6 |
| API-006 | Paginação e filtros de integração | pendente | F6 |
| API-007 | Documentação para ERP e BI | pendente | F6 |

### Utilitários e suporte

| ID | Função | Situação | Etapa |
|---|---|---|---|
| AUX-001 | Download e atualização do instalador | pendente | F6 |
| AUX-002 | Matriz própria de compatibilidade | pendente | F6 |
| AUX-003 | Histórico de versões e alterações | pendente | F6 |
| AUX-004 | Ajuda e diagnóstico operacional | pendente | F6 |
| AUX-005 | Sugestões e votação de melhorias | opcional | F6 |
| AUX-006 | Contatos de suporte da própria empresa | opcional | F6 |

### Comercial do fornecedor

| ID | Função | Situação | Etapa |
|---|---|---|---|
| SAA-001 | Mensalidade do provedor por módulos | fora_escopo | EXCLUIDO |
| SAA-002 | Central de boletos da assinatura PrintWayy | fora_escopo | EXCLUIDO |
| SAA-003 | Bloqueio da plataforma por assinatura do fornecedor | fora_escopo | EXCLUIDO |
| SAA-004 | PIX, segunda via e baixa da assinatura PrintWayy | fora_escopo | EXCLUIDO |

### Requisitos próprios do Dragon

| ID | Função | Situação | Etapa |
|---|---|---|---|
| LOC-001 | Compatibilidade com Windows Server 2025 e porta 3080 | parcial | F1 |
| LOC-002 | Backup, restauração e migração versionada | pendente | F1 |
| LOC-003 | Teste de isolamento entre clientes | pendente | F1 |
| LOC-004 | Logs, monitoramento e proteção de credenciais | parcial | F1 |
| LOC-005 | TLS, implantação local e VPN dos clientes | parcial | F1 |
| LOC-006 | Política de retenção e dados pessoais | pendente | F1 |
| LOC-007 | Rotina de homologação de contadores reais | pendente | F1 |
| LOC-008 | Segregação entre chave do cliente e token operacional | parcial | F1 |

## Limites e decisões para o Dragon

- O usuário possui uma única empresa de locação. Preservar os clientes como escopos operacionais, com dados, passagens, usuários e credenciais corretamente vinculados.
- A referência documenta uma chave de inscrição por cliente. Hoje o Dragon gera token operacional por coletor vinculado ao cliente. Essas credenciais não são equivalentes: implementar uma chave de inscrição do cliente, se adotada, sem remover a identidade e revogação individuais de cada agente.
- A referência descreve duplicidades entre clientes. Hoje nosso detector compara séries entre pontos/IPs dentro do mesmo cliente. Movimentação entre clientes exige passagens datadas e preservação do histórico; não basta liberar a unicidade da série.
- A documentação cita intervalos diferentes de processamento e coleta (30 minutos, 60 minutos e rotinas de 6 horas em artigos distintos). O Dragon precisa de intervalos explícitos e configuráveis; não tratar qualquer uma dessas frequências como garantia geral do concorrente.
- O agente Dragon 0.2 usa SNMP v2c padrão em redes privadas explicitamente configuradas. USB, SNMP v3 e adaptações específicas de fabricantes exigem desenvolvimento e homologação próprios.
- Não utilizar a lista de homologação da PrintWayy como prova de compatibilidade do nosso agente. Registrar testes por modelo, conexão, contador e unidade.
- O contador total atual não identifica automaticamente P&B, cor, cópias e digitalizações. Não usar essa leitura para faturar categorias separadas.
- O histórico atual fornece as últimas 100 leituras por descoberta; não entrega produção por intervalo, resets tratados ou histórico de passagens completo.
- A fonte de indicadores menciona IA para validar trocas, sem divulgar o método. Não alegar reprodução desse algoritmo. Começar com validações explicáveis e dados suficientes, sem apresentar estimativa como leitura real.
- Relatórios públicos da referência não equivalem a emissão de nota fiscal ou liquidação bancária. Não anunciar NFS-e, boleto ou PIX da locadora sem integração própria e validação.
- Alguns tutoriais citam sistemas Windows antigos e configurações de e-mail legadas. Eles não alteram nosso alvo Windows Server 2025/Node.js 24, nem justificam reduzir segurança de conta ou certificado.
- Para o Dragon, toda implementação precisa incluir persistência, API, autorização, interface e teste do fluxo. Adicionar somente o menu não conclui um requisito.

## Fontes consultadas

- PW-4852: [Central de Faturas do PrintWayy](https://help.printwayy.com/central-de-faturas-do-printwayy/)
- PW-4807: [Aplicando um reajuste no contrato](https://help.printwayy.com/aplicando-um-reajuste-no-contrato/)
- PW-4721: [Configurações de dispositivos](https://help.printwayy.com/configuracoes-de-dispositivos/)
- PW-4697: [Cadastrando um dispositivo](https://help.printwayy.com/cadastrando-um-dispositivo/)
- PW-3273: [Últimas atualizações](https://help.printwayy.com/ultimas-atualizacoes/)
- PW-4635: [Sugira à PrintWayy](https://help.printwayy.com/sugira-a-printwayy/)
- PW-3390: [Cadastrar um cliente](https://help.printwayy.com/cadastrar-um-cliente/)
- PW-3249: [Cadastrar usuários](https://help.printwayy.com/cadastrar-usuarios/)
- PW-3291: [Visão geral do PrintWayy Dragon](https://help.printwayy.com/visao-geral/)
- PW-4526: [Receber eventos do sistema por e-mail](https://help.printwayy.com/notificar-eventos/)
- PW-4524: [Receber relatórios por e-mail](https://help.printwayy.com/relatorio-email/)
- PW-4256: [Habilitar ou desabilitar módulos do sistema](https://help.printwayy.com/habilitar-desabilitar-modulos/)
- PW-3259: [Configurações da sua empresa](https://help.printwayy.com/configuracoes-empresa/)
- PW-3199: [Configurações de relatórios](https://help.printwayy.com/configuracoes-relatorios/)
- PW-4555: [Entendendo sua fatura PrintWayy](https://help.printwayy.com/cobranca-printwayy/)
- PW-4375: [Instalação do PrintWayy Client](https://help.printwayy.com/instalacao-client/)
- PW-4387: [Monitorando impressoras com o PrintWayy Client](https://help.printwayy.com/monitorando-impressoras/)
- PW-4396: [Monitorando impressoras de forma remota](https://help.printwayy.com/monitorando-remotamente/)
- PW-3186: [Impressora com lançamento manual de contadores](https://help.printwayy.com/adicionando-contadores/)
- PW-4403: [Visualizando suas impressoras](https://help.printwayy.com/visualizando-impressoras/)
- PW-4448: [Visualizando contadores](https://help.printwayy.com/visualizando-contadores/)
- PW-4439: [Movimentando impressoras entre clientes](https://help.printwayy.com/movimentando-impressoras/)
- PW-3189: [Novas impressoras](https://help.printwayy.com/novas-impressoras/)
- PW-3693: [Monitoramentos duplicados](https://help.printwayy.com/monitoramentos-duplicados/)
- PW-3233: [Estoque de suprimentos](https://help.printwayy.com/estoque-suprimentos/)
- PW-4430: [Configurações de impressora](https://help.printwayy.com/configuracoes-impressora/)
- PW-4275: [Movimentando itens de estoque](https://help.printwayy.com/movimentando-estoque/)
- PW-3215: [Níveis dos suprimentos](https://help.printwayy.com/niveis-suprimentos/)
- PW-3261: [Mantendo as impressoras comunicando](https://help.printwayy.com/monitoramento-conexoes/)
- PW-4324: [Trocas de suprimento](https://help.printwayy.com/trocas-suprimento/)
- PW-3229: [Reposição inteligente de suprimentos](https://help.printwayy.com/reposicao-suprimentos/)
- PW-3255: [Configurações de suprimentos, estoque e trocas](https://help.printwayy.com/configuracoes-suprimentos-estoque-trocas/)
- PW-3227: [Indicadores de uso](https://help.printwayy.com/indicadores-suprimentos/)
- PW-4052: [Configurando proxy no PrintWayy Client](https://help.printwayy.com/proxy/)
- PW-3336: [Configurando comunicação Printwayy Client via e-mail](https://help.printwayy.com/printwayy-client-via-email/)
- PW-3193: [Adicionando um contrato](https://help.printwayy.com/adicionando-contrato/)
- PW-3197: [Fechamentos mensais](https://help.printwayy.com/fechamentos-mensais/)
- PW-4235: [Configuração de relatório de fechamento](https://help.printwayy.com/configuracao-relatorio-fechamento/)
- PW-3299: [Alertas](https://help.printwayy.com/alertas/)
- PW-3253: [Configurações de alertas](https://help.printwayy.com/configuracoes-alertas/)
- PW-4122: [Como abrir um chamado](https://help.printwayy.com/como-abrir-um-chamado/)
- PW-4136: [Atendendo chamados](https://help.printwayy.com/atendendo-chamados/)
- PW-3843: [Relatório de Chamados](https://help.printwayy.com/relatorio-chamados/)
- PW-3257: [Configurações de Chamados](https://help.printwayy.com/configuracoes-de-chamados/)
- PW-2823: [1ª Etapa: Cadastrando um cliente e gerando chave de instalação](https://help.printwayy.com/etapa-1-cadastro-cliente-gerando-chave/)
- PW-2841: [2ª Etapa: Instalando o PrintWayy Client e monitorando impressoras](https://help.printwayy.com/etapa-2-instalando-client-monitorando-impressoras/)
- PW-2850: [3ª Etapa: Visualizando os contadores capturados](https://help.printwayy.com/etapa-3-visualizando-contadores/)
- PW-4097: [Próximos passos](https://help.printwayy.com/proximos-passos/)
- PW-3263: [Downloads](https://help.printwayy.com/downloads/)
- PW-4012: [Dispositivos homologados](https://help.printwayy.com/dispositivos-homologados/)
- PW-3921: [Contato](https://help.printwayy.com/contato/)
- PW-3269: [Integração](https://help.printwayy.com/integracao/)
- PW-4455: [Dúvidas frequentes](https://help.printwayy.com/duvidas-frequentes/)
- PW-HOME: [Central de Ajuda](https://help.printwayy.com/)
