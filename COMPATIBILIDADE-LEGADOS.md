# Compatibilidade verificada pelos formatos históricos

Esta análise usa código Git e fixtures no Firestore Emulator, **não dados reais do projeto**. Referências: main `c3e7901`, variante Functions `7f60b97` e primeira variante Spark `58d222d`. Nenhuma migração ou exclusão foi executada.

| Registro antigo | Leitura com a proposta atual | Gravação/uso no fluxo novo | Ação antes de reutilizar |
|---|---|---|---|
| Conta do Firebase Authentication | Mesmo projeto/UID; código continua com E-mail/Senha | Não exige recriar Auth por formato do perfil | Conferir login/domínio em teste físico; não testado no serviço real |
| `perfis/{uid}` com `tarifaVazio`/`tarifaOcupado` | Permitida ao titular; nome, papel e tipo de veículo aparecem | Salvar explicitamente o formulário substitui o perfil por nome/tipo/veículo/timestamp e REMOVE tarifas/campos extras antigos | Guardar os valores antes de salvar. Não há importação automática para configuração nova |
| Tarifas/base somente em localStorage | Ignoradas como fonte oficial | Não são gravadas automaticamente no login | Preencher/confirmar explicitamente a conta; nunca importar padrões antigos |
| Disponibilidade antiga com bool + timestamp | Permitida ao titular | Pode alternar sem reserva ativa | Verificar antes se existe corrida antiga ativa sem reserva |
| Config Functions com versão UUID e `positionAt` em milissegundos | Permitida ao titular | Controlador mantém edição bloqueada; regras não convertem string para versão inteira | Migração administrativa planejada ou conta nova. Não apagar/recriar automaticamente |
| Config Spark válida com versão inteira | Restaurada do servidor | Atualização exige versão atual e incremento de 1 | Continuar usando após confirmar formato/ausência de reserva antiga |
| Corrida da main sem `estimate` | Legível só pelos participantes | Somente consulta; não aceita, recusa, embarca ou conclui nesta revisão | Arquivar/recriar novo pedido após decisão explícita; não converter implicitamente |
| Corrida Functions com `quote` | Legível só pelos participantes | Somente consulta; preço `quote` não é convertido para `estimate` | Preservar registro original e planejar migração; nova tela não interpreta o antigo quote como estimativa atual |
| Corrida Spark do commit `58d222d`, sem `schemaVersion` | Legível só pelos participantes | Também é considerada antiga nesta revisão | Recriar pedidos de teste. O marcador novo não é inserido automaticamente |
| Corrida concluída antiga | Histórico básico continua consultável pelos participantes | Sem alterações; identificada como registro antigo | Preservar histórico; campos financeiros antigos não foram migrados |
| Corrida ativa antiga com reserva | Consultável, mas etapas antigas ficam bloqueadas | Reserva não pode ser apagada/liberada pelo cliente novo | Resolver por processo administrativo aprovado, preservando histórico; não ignorar a reserva |
| Corrida ativa antiga SEM reserva | Consultável | **BLOQUEIO DE MIGRAÇÃO:** regras de reserva não conseguem descobrir outras corridas na coleção por consulta | Inventariar/resolver antes de habilitar o motorista; não afirmar exclusividade entre registros antigos e novos |

## Marcador desta revisão e passageiro único

Novos pedidos têm `schemaVersion: 3` e controle persistente em `passageiros_ativos/{uid}`. Criar exige controle previamente livre, depois reservado ao ID exato. Regras negam novas criações schema 2, inclusive por clientes antigos. Registros schema 2 existentes mantêm aceite/recusa/embarque/conclusão/cancelamento antes do embarque; não ganham automaticamente controle do passageiro. Sem marcador, continuam somente consulta.

Perfil antigo sem controle não pode inicializá-lo pelo SDK, mesmo sem corridas visíveis ou ao salvar novamente o perfil. Inventariar e resolver TODOS os registros ativos antes de inicialização manual autorizada. Não alterar nem excluir duplicados automaticamente. Ver o procedimento exato e a sequência de atualização em `ATUALIZACAO-PASSAGEIRO.md`.

As regras não conseguem descobrir por consulta uma corrida histórica sem reserva. A garantia do protocolo novo não corrige retroativamente duplicados antigos; controles não devem ser inicializados livres por conveniência. A consulta inicial do aplicativo é defesa adicional, não prova de segurança dos dados legados.

## Evidência

Os testes de compatibilidade e de passageiro em `tests/emulator.test.cjs` preservam documentos antigos/duplicados, bloqueiam novas criações e a autoinicialização, permitem resolver registros schema 2 válidos e só liberam nova criação após revisão administrativa simulada no Emulator. Não houve inventário/migração no projeto real. Configurações antigas UUID/timestamps numéricos continuam exigindo migração planejada sem sobrescrever tarifas/base.
