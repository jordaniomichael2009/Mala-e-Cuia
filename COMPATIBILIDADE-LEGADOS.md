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

## Marcador desta revisão

Novos pedidos têm `schemaVersion: 2`. Regras e cliente exigem esse marcador para atualizar etapas. Dados sem o marcador permanecem legíveis, mas não podem ser “promovidos” pelo cliente alterando o campo. A interface não mostra ações de motorista para registros antigos.

O marcador não migra nem resolve corridas antigas. O teste de bloqueio de migração demonstra deliberadamente que, se um operador reutilizar uma conta com corrida antiga aceita sem reserva, uma nova corrida pode ser aceita e coexistir com a antiga. Isso NÃO é uma garantia de segurança entre esquemas; é motivo para impedir a troca para contas antigas sem inventário e tratamento administrativo.

## Plano proposto, não executado

1. Guardar backup dos dados e das regras em uso. Inventariar por UID as corridas solicitadas, aceitas, embarcadas, concluídas e as reservas.
2. Separar um teste restrito com **duas contas novas**, ou tratar explicitamente o histórico das duas contas selecionadas antes de usá-las.
3. Decidir como encerrar/cancelar/arquivar corridas antigas ativas. Não existe cancelamento ou liberação administrativa implementados no app.
4. Planejar a transformação de configurações UUID e timestamps numéricos, preservando tarifas/base sem usar valores padrão. Não há script de migração autorizado/executado.
5. Revisar cliente/regras e obter autorização antes de qualquer alteração real. Não alternar para o novo Pages enquanto contas antigas incompatíveis forem usadas no teste.

## Evidência

`tests/emulator.test.cjs` contém seis casos adicionais de compatibilidade: perfil antigo, disponibilidade antiga, configuração UUID, pedidos antigos de três variantes, histórico/reserva antigos e o bloqueio de migração por corrida ativa sem reserva. Passaram no Emulator local. Não substituem um inventário do Firebase real.
