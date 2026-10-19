# Plano de implementação — Dragon local

Base: [mapa de funções documentadas](MAPA-FUNCIONAL-PRINTWAYY.md), produzido em 19/10/2026. Este arquivo organiza o desenvolvimento; não declara os módulos concluídos. O escopo detalhado e os critérios de aceite estão em [requisitos.csv](referencia-printwayy/requisitos.csv).

## Restrições já definidas pelo usuário

- Uso pela própria empresa de locação, com clientes separados.
- Servidor local Windows Server 2025, porta padrão 3080.
- Visual inspirado na Servitec, com navegação por módulos.
- Código no repositório `victoradriboko-lab/Dragon`.
- Agente nos PCs/servidores Windows dos clientes para coleta automática.
- Credenciais vinculadas ao cliente e identidade individual de cada ponto de coleta.

## Situação inicial

O Dragon 0.2 possui login administrativo, cadastro básico de clientes/impressoras, agente SNMP v2c padrão, envio com token individual por coletor, fila local, aprovação de descobertas e consulta das últimas leituras. Há testes simulados e validação de navegação no Chromium. O servidor Windows e os equipamentos reais ainda precisam ser homologados no piloto.

Os itens classificados como parciais exigem trabalho adicional. O sistema atual não entrega um motor financeiro, estoque, chamados, permissões multiusuário ou relatórios de produção por período. A lista de menus não altera essa situação.

## F1 — Base operacional, clientes e acesso

Escopo: CLI, USR, EMP, LOC e base UX do inventário.

1. Acrescentar migrações versionadas e cópia recuperável do banco antes das mudanças.
2. Implementar locais, departamentos, centros de custo e configurações da empresa.
3. Implementar colaboradores, usuários clientes e autorização no servidor por ação e escopo.
4. Implementar convites e recuperação de senha com tokens temporários, após configurar o canal de entrega.
5. Separar chave de inscrição do cliente da credencial operacional de cada agente. A chave de inscrição autoriza o cadastro de um ponto; o token desse ponto continua individual e revogável.
6. Aplicar auditoria nas alterações de dados e de escopo.

Aceite de fase: dois clientes com locais e usuários próprios; tentativas de acesso cruzado pela interface e por chamadas diretas à API são negadas. Backup restaura o estado completo em uma instalação de teste. A atualização preserva os registros da versão 0.2.

## F2 — Parque, passagens e contadores confiáveis

Escopo: PAR, AGE e CNT. Depende de F1.

1. Separar o ativo físico das instalações do ativo nos clientes. Representar cada passagem por início/fim, local e modo de coleta.
2. Vincular cada leitura ao equipamento, à passagem e à origem. Tratar troca de IP, troca de série, reinício de contador e dispositivo substituído sem misturar históricos.
3. Ampliar coleta conforme testes reais de marca/modelo: P&B, cor e digitalizações, com unidade e significado explícitos.
4. Adicionar leituras manuais com validações de sequência e possibilidade controlada de correção.
5. Implementar produção por período e gráficos reconciliados com as leituras de fronteira.
6. Ampliar diagnóstico do agente, instruções de monitoramento por ponto, restauração de estado e atualização controlada.
7. Planejar USB e credenciais por equipamento como conectores independentes. Habilitar cada capacidade somente após homologação. Proxy é necessário quando o ambiente do cliente o exigir; transporte por e-mail permanece opcional.

Aceite de fase: acompanhar impressoras reais de marcas diferentes, instalar/retirar o mesmo equipamento entre clientes, simular reset, falta de internet e mudança de IP. A produção calculada deve reconciliar com os contadores impressos no equipamento e não pode atribuir páginas ao cliente errado.

## F3 — Contratos e fechamento mensal

Escopo: CON e FEC; DIS entra conforme os ativos de TI usados pela empresa. Depende de contadores confiáveis em F2.

1. Cadastrar contrato, vigência, ciclo, custos padrão, CPP, franquias, faixas e adicionais.
2. Implementar o cálculo como componente independente, com entradas e resultados reproduzíveis.
3. Modelar mensalidade mínima, compartilhamento, proporcionalidade, reajustes e exceções.
4. Registrar pendências e impedir congelamento automático quando houver inconsistência.
5. Congelar um snapshot completo de leituras, preços, período, ajustes e regras aplicadas. Alterar o contrato não modifica fechamento congelado.
6. Implementar descongelamento restrito e auditado, relatório e envio após congelamento.

Antes de concluir o cálculo, documentar a política da locadora para casas decimais do CPP, arredondamento, base de proporcionalidade, fuso horário, meses curtos e datas de reajuste. A referência não define todos esses detalhes. Usar representação decimal exata ou inteiros escalados; não depender de ponto flutuante para totais monetários.

Casos mínimos: mês de fevereiro e ano bissexto; início no fim do mês; troca de tarifa; franquia compartilhada; produção zero; leitura atrasada; reset; passagem parcial; dispositivo em manutenção; desconto; congelamento e nova tentativa de envio. Cada cenário deve mostrar as entradas e o valor esperado.

Aceite de fase: a empresa consegue fechar um mês de um cliente piloto, revisar a origem de cada valor, congelar e gerar documento sem alteração silenciosa por novas coletas.

## F4 — Alertas, manutenção e chamados

Escopo: ALE e CHA. Depende de F1/F2. Itens de materiais dos chamados só ficam completos após o estoque de F5.

1. Regras de falta de comunicação distinguindo agente e impressora, com calendário e modo backup.
2. Eventos dos equipamentos e regras preventivas por dias, páginas ou suprimentos.
3. Ciclo do alerta, recorrência, encerramento e histórico.
4. Chamados internos e de clientes, quadro de atendimento, responsáveis, prioridade e SLA.
5. Comentários públicos/internos, serviços, impressão e notificações essenciais.
6. Vinculação do alerta ao atendimento e fechamento consistente dos dois registros.

Aceite de fase: simular perda e retomada de comunicação sem avalanche de alertas, abrir chamado a partir de alerta e verificar SLA em horas úteis. Usuário cliente não visualiza comentários internos ou dados de outro cliente.

## F5 — Estoque, trocas e reposição

Escopo: EST e SUP. Depende de F1/F2 e permissões de F1. Integra os itens de materiais de F4.

1. Catálogo com compatibilidade e razão de estoque por detentor/local.
2. Entradas, transferências, devoluções e consumo em transações atômicas.
3. Trocas sugeridas e confirmação manual antes de automatizar baixas.
4. Exceções, trocas prematuras, linha do tempo e indicadores com dados auditáveis.
5. Confirmação automática somente quando estoque, item e compatibilidade forem inequívocos.
6. Estimativas e reposição após histórico suficiente: mostrar amostra, incerteza e data de cálculo.
7. Envio e recebimento com atualização de estoque na etapa correta.

Aceite de fase: conciliar entradas e saídas entre empresa, técnico e cliente; rejeitar saldo insuficiente; reenviar a mesma operação sem duplicar baixa. Uma variação de leitura não pode ser apresentada como troca física confirmada.

## F6 — Relatórios completos, automações e integrações

Escopo: REL, API e AUX. Depende dos módulos cujos dados serão disponibilizados.

1. Relatórios por período, contrato, local, departamento e centro de custo.
2. Preferências de colunas, exportação e visualizações salvas.
3. SMTP/entrega de e-mail, agendamento e eventos com reenvio idempotente.
4. API externa versionada e paginada, com token de integração independente das sessões e dos coletores.
5. Integrações com ERP/BI mediante testes do contrato de dados; não anunciar parceiros como compatíveis sem validação.
6. Atualizações distribuídas com versão, compatibilidade e possibilidade de recuperação.

Aceite de fase: relatório, exportação e API retornam totais consistentes sob os mesmos filtros. Não há vazamento de escopo nem duplicação de notificações em reinícios e novas tentativas.

## Tratamento dos itens comerciais da referência

SAA cobre cobrança da assinatura da própria PrintWayy. Não implantar bloqueio da plataforma local, tarifação do uso do software ou cobrança da assinatura do concorrente. Isso não exclui contratos e cobranças dos clientes da locadora, que estão em CON/FEC. Emissão fiscal, boleto e PIX da locadora exigem um desenho separado com o provedor escolhido; não estão comprovados como funções operacionais equivalentes pelo material estudado.

## Regra de conclusão de cada entrega

Cada requisito só muda de pendente/parcial para implementado quando possuir armazenamento e migração, API, autorização, interface, regras de negócio, teste de um fluxo relevante e instrução de atualização. Validação em Windows e equipamento real deve ser registrada separadamente da validação simulada. Não marcar concluído por criar menu ou formulário sem persistência.

Manter os IDs dos requisitos nos commits e nas entregas. Antes de cada atualização operacional: backup, validação em ambiente piloto, preservação das credenciais locais e da fila do agente, e plano de recuperação. Sem estimativa de prazo nesta etapa: hardware, regras contratuais e volume real ainda precisam ser medidos.
