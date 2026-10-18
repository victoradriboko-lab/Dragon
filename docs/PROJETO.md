# Dragon

Sistema em desenvolvimento para gestão de uma empresa de locação de impressoras, com implantação planejada em Windows Server 2025.

## Estado atual

Protótipo visual responsivo em português, com dados demonstrativos. Inclui painel, filtros por cliente, consulta de impressoras, detalhes e exportação demonstrativa de volume em CSV.

Ainda não há autenticação, banco de dados, coleta SNMP, faturamento ou instalador. As seções não implementadas estão identificadas na interface.

## Abrir o protótipo

Abra `dist/index.html` no navegador. Não é necessário instalar dependências.

## Arquitetura prevista

- Aplicação web e banco PostgreSQL no servidor local.
- Coletores Windows nas redes dos clientes.
- Consulta de impressoras via SNMP, com compatibilidade validada por modelo.
- Envio seguro das leituras e armazenamento temporário quando a conexão cair.
- Contratos, suprimentos, alertas e fechamentos mensais.

O GitHub armazena e versiona o código. A execução do sistema será no servidor local.
