# Uma corrida ativa por passageiro — protocolo 3

## Comportamento e arquivos

`index.html` bloqueia o envio no primeiro evento, antes de qualquer await, com **Enviando solicitação…**. Só após a confirmação da transação mostra **Aguardando resposta do motorista** em texto sem ação de clique. Depois do aceite confirmado: **Motorista aceitou a corrida e está a caminho**. Em viagem, o bloqueio continua. Recusa, cancelamento ou conclusão confirmados liberam o pedido.

A conta é verificada no servidor na abertura/recarregamento, com listeners da consulta de corridas do passageiro e de `passageiros_ativos/{uid}`. Nenhum cache do navegador habilita envio antes da leitura do servidor. Sem rede/permissão, permanece bloqueado. Erros de envio mostram código e mensagem, sem fingir sucesso; após falha ambígua, a interface relê o servidor antes de permitir outra tentativa.

`firestore-client.js` cria `schemaVersion: 3` e reserva o passageiro **na mesma transação**. Antes, consulta as corridas do UID para detectar registros históricos; essa consulta é defesa de compatibilidade, não a garantia de exclusividade.

`firestore.rules` exige que o controle persistente passe de `rideId: null` para o ID da nova corrida, pareado com sua criação. Não permite outra criação com o controle ocupado, nem trocar/apagar/resetar o controle isoladamente. Um lote com dois pedidos e uma reserva falha inteiro. Aceite e embarque preservam a reserva. Os estados terminais devem liberar o passageiro na mesma operação atômica; se houver reserva do motorista, ela também é liberada no cancelamento/conclusão. Participantes não podem ser trocados.

## Contas existentes: conferência obrigatória, sem apagar duplicados

As regras não conseguem consultar uma coleção inteira para provar a ausência de corridas antigas sem reserva. Por isso, **um perfil que já existe e não possui `passageiros_ativos/{uid}` não pode inicializar esse controle pelo cliente**. Salvar novamente o perfil não contorna o bloqueio. Trocar navegador/aparelho também não. A tela explica a necessidade de revisão. Não existe migração ou exclusão automática.

Procedimento manual, somente por operador autorizado no console, após backup:

1. Conferir TODAS as corridas `corridas_teste` com `passengerId` igual ao UID. Não confiar apenas nos cartões visíveis ou no prefixo do ID. Verificar também a reserva do motorista e os dois participantes.
2. Resolver os pedidos duplicados preservando os documentos e o histórico, com decisão explícita dos participantes/operador. Registros `schemaVersion: 2` podem ser recusados ou cancelados antes do embarque pela interface atual. Corridas aceitas/embarcadas seguem as etapas permitidas. Registros sem marcador ou reservas inconsistentes exigem procedimento administrativo separado, aprovado; esta entrega não os modifica.
3. **Só quando não houver NENHUMA corrida solicitada, aceita ou embarcada do passageiro**, criar `passageiros_ativos/{UID_EXATO}` com exatamente dois campos: `rideId` do tipo **null** (não texto "null") e `updatedAt` do tipo **timestamp**, no horário da revisão. Não marcar como livre uma conta que ainda tenha corrida ativa. Não substituir controle já existente.
4. Recarregar a conta nos aparelhos e verificar que novo envio aparece apenas se não existir corrida ativa. Arquivar a evidência da revisão.

Esse cadastro manual é uma ação de dados no Firebase e **não foi executado**. Não enviar senhas/tokens. É possível testar o protocolo com dois perfis novos criados após as regras novas, pois perfil e controle livre nascem na mesma transação.

A garantia forte cobre pedidos do protocolo 3 e contas revisadas corretamente. Não afirmar exclusividade retroativa para duplicados antigos ainda não tratados, nem habilitar essas contas arbitrariamente.

## Atualização compatível e regras completas

1. Guardar backup das regras realmente em uso. Conferir coleções/dados do projeto e `COMPATIBILIDADE-LEGADOS.md`.
2. Revisar o arquivo completo `firestore.rules` ou copiar o bloco integral de `REGRAS-COMPLETAS-FIRESTORE.md`, com tradução automática DESATIVADA. Firebase Console → mobilidademalaecuia → Firestore Database → Regras. Substituir o texto completo, conferir `service cloud.firestore` e publicar **somente após autorização**. Não usar fixtures antigos nem juntar trechos de versões.
3. As regras novas **negam novas solicitações schema 2 do cliente anterior**. Ele ainda pode operar registros schema 2 existentes. Não há janela segura para continuar criando pedidos pelo cliente anterior: recarregar todos os aparelhos para a UI atual. Preferir regras primeiro, depois UI; neste envio o Pages é atualizado, mas o Firebase não é alterado.
4. Sob as regras anteriores fornecidas, a UI nova não envia novos pedidos: a sondagem autenticada `system_capabilities/passenger-single-v1` é negada. Sob as novas, a leitura é permitida; o documento NÃO precisa existir e não deve ser criado. A sondagem não audita regras excessivamente permissivas: comparar o arquivo integral é indispensável.
5. Revisar/inicializar contas antigas conforme o procedimento acima, ou usar perfis novos. Recarregar e executar os testes físicos. Não restaurar regras antigas enquanto houver corridas schema 3: elas não liberam a reserva do passageiro. Um rollback exige preservar o protocolo 3 nas regras.

O push autorizado em `teste-sem-blaze` atualiza somente os quatro arquivos do site em `/docs`, com módulos versionados; não aplica regras, não inicializa contas, não muda a main, não ativa Blaze e não exclui registros.

## Evidência e limites dos testes

`tests/emulator.test.cjs`: concorrência real de duas sessões SDK, criações diretas maliciosas, lote com dois pedidos, exclusão/substituição/reset do controle, alteração de papel, liberação incompleta, acesso por terceiro, bloqueio nos três estados ativos e revisão de duplicados preservados. Simula a inicialização administrativa exclusivamente no Emulator após encerrar os legados; nada é executado no Firebase real.

`tests/local-flow.cjs`, também executado por `npm run test:pages`: eventos rápidos, gravação atrasada, uma única criação, confirmação/perda do reconhecimento, recarga, outra sessão da mesma conta, estados de espera/aceite/viagem e liberação terminal. SDK e serviços externos são simulados nesse teste de navegador. A disputa real entre transações e as permissões são verificadas separadamente no Emulator.

Não houve teste físico com dois celulares, Authentication de produção nem leitura/aplicação das regras reais. Distâncias/GPS continuam fornecidos pelo cliente e não verificados por servidor; o preço continua estimativa com tarifas/fórmula verificadas pelas regras.
