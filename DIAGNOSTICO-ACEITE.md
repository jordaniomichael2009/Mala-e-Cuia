# Diagnóstico e confirmação do aceite

## Caso informado

A captura mostra a corrida cujo prefixo é `vPin18pd` ainda em Solicitada. Não houve acesso autenticado ao Firebase real para inspecionar esse documento ou seus logs; portanto não é possível afirmar qual erro específico ocorreu nessa conta/aparelho. A correção não altera o documento manualmente nem contorna regras.

No código anterior, o clique fazia leituras, validava GPS e calculava três rotas antes da transação; o erro era exibido no feedback geral após uma lista longa. Além disso, os botões dependiam da chegada do listener para mudar de etapa. A mensagem localizada e a confirmação explícita foram acrescentadas para distinguir essas situações.

## Fluxo atualizado

1. O cartão mostra a verificação de sessão/corrida/configuração/GPS.
2. Mostra rota 1/3, 2/3 e 3/3. GPS ausente/incompatível/antigo orienta usar Verificar meu GPS e depois Salvar configuração da conta e atualizar GPS.
3. Mostra Aguardando confirmação da gravação no Firestore, mantendo o estado anterior e os controles bloqueados durante a operação. Não abre Maps nesta etapa.
4. Somente após `runTransaction` resolver com confirmação do servidor, aplica a linha confirmada na interface sem esperar o listener: **Aceita**, Abrir rota até passageiro, Confirmar embarque e Cancelar corrida (este depende da compatibilidade das regras). Recusar desaparece.
5. Revalida o estado com `getDocFromServer` antes da navegação automática. Se a corrida foi cancelada/alterada em paralelo, mostra o estado atual e não abre uma rota obsoleta.
6. Solicita navegação Maps com `dir_action=navigate`. O link manual nativo em nova aba permanece no cartão para bloqueio/interrupção de navegação, retorno do Maps ou falha de leitura após a gravação.

Se a gravação foi confirmada mas a leitura seguinte falha, a mensagem distingue essa situação de uma gravação recusada. Não orienta repetir um aceite já confirmado. Snapshot com escrita local pendente não vira confirmação, e snapshot antigo de cache não regride imediatamente um aceite confirmado para Solicitada.

## Erros visíveis no cartão

O aviso inclui prefixo da corrida, etapa, código e mensagem original. Também permanece no feedback geral.

- `failed-precondition` na verificação: GPS/configuração/etapa indisponíveis; seguir a instrução específica.
- `routes/unavailable` ou `routes/timeout`: identifica qual dos três trajetos falhou. Nenhuma reserva é criada por falha de rota.
- `permission-denied` na gravação: Firestore recusou a operação. Conferir arquivo integral de regras realmente publicado, conta/perfil do motorista e disponibilidade. Não tornar regras públicas para contornar.
- `aborted`: configuração/etapa alterada por outra operação; atualizar a tela/configuração e conferir o estado antes de repetir.
- `unavailable` ou erro não reconhecido: conferir conexão e sincronização; a mensagem não afirma que nada foi gravado quando não houve confirmação.

O painel de status do passageiro, resumo ativo, cancelamento e histórico foram preservados. Autor e horário de cancelamento continuam protegidos.

## Regras

Não há mudança de permissões para esta correção. `firestore.rules` é semanticamente igual à versão de cancelamento publicada no commit `9d56a9d`; somente os comentários foram removidos para fornecer um arquivo ASCII seguro para copiar. A comparação e os testes foram executados.

Não é necessário atualizar regras se a versão correspondente já foi publicada corretamente. O estado real das regras não foi lido nesta sessão. Se aparecer `permission-denied`, conferir o conteúdo exato de `firestore.rules`/`REGRAS-COMPLETAS-FIRESTORE.md`, com tradução automática do navegador desativada. Nenhuma regra foi aplicada automaticamente.

## Testes desta correção

- Firestore Emulator: 35 testes aprovados, incluindo confirmação após commit, gravação negada sem sucesso falso, falha na segunda rota sem reserva e GPS expirado com diagnóstico.
- Navegador/Pages: leitura do cartão, GPS expirado, OSRM indisponível e gravação recusada; commit deliberadamente atrasado sem Maps/sucesso; listener do motorista silenciado e leitura seguinte atrasada, mas controles já trocados após a confirmação; snapshot antigo de cache ignorado; Maps automático e link manual; falha de leitura após commit mantém Aceita com aviso; painel do passageiro em Solicitada/Aceita/Embarcado e regressões de cancelamento/histórico.
- Navegador usa SDK/serviços simulados. Testes de regras/transações usam servidor Emulator real. Não houve teste físico ou replay da corrida real `vPin18pd`.
