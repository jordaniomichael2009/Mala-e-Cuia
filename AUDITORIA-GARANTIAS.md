# Auditoria — adaptação sem Functions

Esta revisão muda o modelo de segurança: o SDK cliente grava diretamente, e as regras validam cada operação. **Não aplicar as regras anteriores nem publicar esta adaptação sem confirmação.**

| Garantia | Código e regra | Teste |
|---|---|---|
| Participantes imutáveis | `firestore.rules`, `corridas_teste`: passageiro autenticado cria para si; atualizações só podem mudar status, timestamp e estimativa no aceite. Motorista designado é o único que avança/recusa. | Tentativas de trocar passageiro, motorista, serviço, coordenadas e data original são negadas até em um lote de aceite válido. |
| Reserva única | `firestore-client.js.rideStep`: transação lê reserva/disponibilidade; aceite cria reserva e marca indisponível. Regras usam `getAfter` para exigir corrida/reserva/disponibilidade consistentes. Reserva ativa não pode ser atualizada/substituída. | Dois aceites concorrentes permitem só um; lote malicioso aceitando duas corridas com uma reserva é negado. |
| Etapas consistentes | Regras: solicitada → aceita → embarcado → concluida; solicitada → recusada. Recusa é terminal. | Salto de etapa, reabertura, usuário indevido e aceite sem lote completo negados. Recusa não libera outra corrida ativa. |
| Conclusão/liberação atômicas | Corrida concluída, exclusão da reserva e disponibilidade true precisam existir no mesmo estado pós-transação. | Conclusão isolada ou sem disponibilidade é negada, preservando reserva e etapa. Conclusão pelo cliente libera na mesma transação. |
| Tarifas/base sincronizadas | Fonte única `config_motoristas/{uid}` privada. `getDocFromServer`, campos bloqueados antes do carregamento, versão inteira incrementada por transação. | Unidade e três sessões móveis: ignora localStorage antigo, Conta/Painel iguais, versão antiga rejeitada e recarregada. Emulator testa gravações concorrentes e limites de tarifas/versões. |
| Fórmula da estimativa | Regras ligam tarifas/versão ao documento do motorista; distâncias inteiras em metros entre 0 e 10.000.000 por trecho; total em centavos = arredondamento final da fórmula. Estimativa imutável após aceite. | Tarifas, versão, total, origem e tipos adulterados negados; caso de arredondamento de centavo aprovado. |
| Distâncias reais | **Não implementado por servidor**: motorista consulta OSRM no próprio navegador. Regras só verificam tipos, limites e fórmula. | Teste documenta que distâncias falsas/zero com fórmula correta passam como `client-estimate`. Não é um cálculo confiável de preço no backend. |
| Privacidade da base | Passageiro cria solicitação sem consultar config do motorista; motorista calcula estimativa ao aceitar. Regras permitem ler config/base só ao titular. | Leitura da config pelo passageiro/terceiro negada; o passageiro recebe a estimativa na corrida. |

## Fórmula

`((idaVaziaMetros + retornoMetros) × tarifaVaziaCentavos + ocupadoMetros × tarifaOcupadaCentavos + 500) / 1000`, truncado para inteiro positivo. Equivale ao arredondamento ao centavo mais próximo ao final, para os valores não negativos permitidos.

As tarifas vêm da conta no aceite e são congeladas na estimativa da corrida. Atualizações de perfil/configuração durante reserva ativa são negadas. A posição é a última sincronizada, válida por até quinze minutos; não é rastreamento contínuo nem prova contra GPS falso.

## Dependências e implantação

`functions/` e os testes de Admin backend anteriores foram removidos da variante ativa; versões anteriores permanecem recuperáveis pelo commit Git existente. O cliente não importa Functions, e `firebase.json` não configura Functions. Testes de regras usam o SDK Firebase cliente; somente as APIs de administração **do Emulator** fazem limpeza e carregamento de regras na inicialização da suíte.

Esta revisão é destinada à branch `teste-sem-blaze`, separada da `main`. O commit anterior `7f60b97` continua preservado em `teste-mala-cuia-3` e descreve a variante antiga com Functions; não representa esta nova versão. Regras/cliente novos precisam ser revisados e, só após autorização, publicados em conjunto. Não alterar o plano do projeto.


## Revisão de preparação Pages e registros antigos

Pedidos novos recebem `schemaVersion: 2`, exigido no cliente e nas atualizações das regras. Registros sem marcador ficam somente para consulta, inclusive pedidos do commit Spark anterior. Isso evita uma promoção implícita do esquema, mas não resolve corridas antigas ativas: as regras não podem consultar toda a coleção para descobrir uma corrida histórica sem reserva. Essa situação é um bloqueio de migração, confirmado em fixture do Emulator; não reutilizar essas contas antes de resolução administrativa autorizada.

Foram adicionados seis testes de compatibilidade (19 no total do Emulator). O pacote mínimo do Pages tem quatro arquivos em `docs/`; cenário de três sessões passou também com caminho `/Mala-e-Cuia/`. Ver documentos específicos de compatibilidade/publicação. Nenhum banco real foi inspecionado.


## Cancelamento e destaque

`firestore-client.js.cancelRide` lê a corrida novamente na transação, verifica participante e etapa e registra `cancellation.by/role/at`. Uma solicitação pendente só pode ser cancelada pelo passageiro; motorista deve recusar. Em `aceita`, qualquer participante pode cancelar. Em `embarcado`, `concluida`, `recusada` ou `cancelada`, não pode cancelar. Somente schemaVersion 2.

A liberação em `aceita` usa o driverId imutável da corrida, não o UID de quem cancelou. O passageiro não precisa ler a configuração/reserva privada do motorista; as regras conferem a reserva exata, sua remoção e disponibilidade após a transação. Cancelamento pendente nunca libera a reserva de outra corrida. Histórico não é excluído.

`firestore.rules`: helpers validCancellation/pairedCancel/cancelUpdate, liberação pareada e rota de capacidade somente leitura. Tentativas de trocar autoria, papel, horário, preço ou participantes falham. O cliente antigo do Pages continua funcionando sob as novas regras; a UI nova bloqueia Cancelar sob as regras antigas fornecidas. Sondagem não substitui revisão do conteúdo integral das regras.

A interface coloca corrida aceita/embarcada antes de solicitações/histórico e mostra um resumo no topo. Cancelar abre confirmação; desistir não grava nada. Canceladas mostram papel, UID e horário para ambos. O mapa só é aberto após revalidar o status atual; isso reduz abertura de rota após cancelamento concorrente, sem prometer atomicidade entre Firestore e um aplicativo externo.
