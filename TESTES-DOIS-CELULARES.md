# Roteiro físico — dois celulares e duas contas

## Estado desta revisão

Não executado fisicamente. O push autorizado em teste-sem-blaze publica a interface do Pages. A aplicação das regras e as alterações de dados no Firebase são separadas e não foram executadas nesta revisão. Usar as regras correspondentes antes de testar.

Primeiro validar localmente:

```sh
npm ci
npm run test:unit
npm run test:pages
npm run test:emulator
```

## Preparação após autorização

- Celular A e celular B com internet, HTTPS, navegador atualizado e permissão de localização. Usar a mesma versão de `docs/` nos dois e recarregar completamente.
- **Duas contas novas de teste:** P (passageiro) e M (motorista). Isso não migra contas antigas. Se for reutilizar conta, aplicar antes o plano aprovado de `COMPATIBILIDADE-LEGADOS.md`; corrida antiga ativa sem reserva é bloqueio para o teste seguro.
- Confirmar E-mail/Senha no Auth, projeto/domínio e revisão das novas regras. Não usar as regras anteriores que bloqueiam escritas. No Pages, confirmar a fonte efetivamente autorizada; a fonte atual é teste-sem-blaze /docs; não alterar a main.
- Registrar aparelhos, SO, navegador, versão/manifesto, horários e resultados sem guardar senhas.

## Fluxo principal

| Passo | Celular A — conta P | Celular B — conta M | Resultado esperado |
|---|---|---|---|
| 1 | Entrar e salvar perfil Passageiro | Entrar e salvar perfil Motorista | Perfis isolados, sem erros de permissão |
| 2 | Aguardar | Esperar config do servidor; preencher tarifas/base, obter GPS e salvar | Campos bloqueados antes da leitura; conta nova sem padrões gravados; base privada |
| 3 | Aguardar UID | Marcar disponível e copiar UID | Status disponível salvo; nenhuma reserva |
| 4 | GPS, UF/cidade, buscar/selecionar destino, serviço compatível, UID e referências; enviar | Ver chamado | Mesmo pedido visível em ambos, `estimate` ainda nulo |
| 5 | Acompanhar status | Aceitar e aguardar resposta | Uma reserva, disponibilidade false, status Aceita e estimativa no cartão. Maps até embarque |
| 6 | Ver motorista a caminho | Voltar do Maps e confirmar embarque | Status Em viagem; Maps até destino |
| 7 | Ver conclusão/histórico | Voltar e finalizar | Concluída, reserva removida e disponível true na mesma transação |
| 8 | Recarregar e abrir Viagens | Recarregar e abrir Viagens | Histórico persistente, mesma corrida concluída |
| 9 | Enviar outro pedido | Recusar | Recusada, sem reserva e sem abertura de Maps |

A estimativa vem dos três trajetos calculados no celular do motorista. Regras conferem tarifas e fórmula, **não comprovam as distâncias ou GPS reais**. Não interpretar o valor como preço garantido ou cobrança.

## Sincronização com os MESMOS dois aparelhos/duas contas

1. Após finalizar todas as corridas, em A sair de P e entrar em M. B permanece em M.
2. A deve restaurar tarifas/base de M do servidor antes de permitir edição, mesmo se tiver valores locais antigos. Entrar não deve criar nova versão.
3. Em B alterar a tarifa na Conta: o Painel de B deve mostrar o mesmo rascunho. Salvar. A ainda guarda versão anterior.
4. Em A tentar salvar outra tarifa sem recarregar: deve recusar a versão antiga, restaurar a versão do servidor e pedir nova edição deliberada. Não sobrescrever a alteração de B.
5. Recarregar A e salvar explicitamente uma nova alteração; conferir em B após Recarregar configuração.
6. Sair de M em A e voltar a P. Nenhuma tarifa/base de M pode ser gravada na conta P.

## Concorrência também com dois aparelhos/duas contas

1. A em P: enviar dois pedidos distintos para M ANTES de qualquer aceite; guardar os IDs.
2. A sair de P e entrar em M; B continua em M. Cada aparelho abre um pedido diferente.
3. Aceitar quase simultaneamente. Só um deve ser aceito e reservar M. O outro recebe erro e continua solicitado.
4. Voltar A para P para conferir os dois status. Em B embarcar/finalizar a corrida aceita. Recusar o pedido remanescente para deixar o teste limpo.

## Falhas e critérios de aprovação

- GPS negado/desatualizado, rede/OSRM indisponível no aceite: mensagem clara, sem reserva ou etapa parcial. Não forçar gravações pelo console para contornar erro.
- Botões de embarque/conclusão só ficam acionáveis após resposta da operação anterior. Voltar do Maps não pode duplicar aceite ou etapa.
- Perfil/base/tarifas/disponibilidade não podem ser alterados durante corrida ativa. Terceiro, preço adulterado e lotes incompletos já são testados no Emulator; se forem retestados manualmente, usar somente dados de teste e meios autorizados.
- Ler registros antigos deve mostrá-los como somente consulta; não tentar operar corridas históricas para “liberar” reserva.
- Aprovação física exige persistência nos dois aparelhos, reserva única, liberação completa, sincronia sem perda e ausência de erros inesperados. Registrar esperado/obtido por passo.
- Cancelamento/recuperação administrativa, rastreamento contínuo, catálogo e despacho automático continuam ausentes. Corrida abandonada exige tratamento administrativo planejado e autorizado.

## Novo teste de cancelamento — antes do embarque

Pré-requisito: conferir `ATUALIZACAO-CANCELAMENTO.md` e aplicar as regras novas pelo console quando autorizado. Sem as regras, Cancelar aparece desabilitado; recarregar após a atualização. Novas corridas devem ter schemaVersion 3; schema 2 existente mantém operações permitidas.

1. A (P) envia um pedido. No topo deve aparecer Solicitação em andamento. Em B (M), antes do aceite há Recusar e não Cancelar.
2. A toca Cancelar e desiste na confirmação: nada deve mudar. Toca novamente e confirma: status Cancelada nos dois aparelhos, com papel, UID e horário. Sem reserva criada. Histórico deve registrar o cancelamento.
3. Novo pedido: B aceita. Resumo Corrida ativa no topo e cartão destacado antes do histórico. A confirma Cancelar: corrida cancelada, reserva removida e B disponível. Verificar registro no histórico dos dois.
4. Novo pedido aceito: B confirma Cancelar antes de embarcar. Mesmo resultado, com autoria motorista. Não apagar o documento da corrida.
5. Novo pedido aceito: B confirma embarque. Cancelar deve sumir nos dois. Tentativas diretas de cancelar essa etapa já são negadas no Emulator; finalizar normalmente.
6. Disputa aceitar/cancelar: repetir em A e B quase simultaneamente. Um aceite pode acontecer antes do cancelamento; o estado final precisa estar coerente. Cancelada não pode manter reserva. Aceita/embarcada precisa manter a reserva correspondente.
7. Disputa embarcar/cancelar: depois do aceite, B toca Embarque enquanto A confirma Cancelar. Só uma operação pode vencer. Se embarcou, cancelamento falha e reserva permanece; se cancelou, embarque falha e reserva desaparece.
8. Os botões ficam bloqueados enquanto uma operação aguarda resposta. Conferir que recarregar não repete cancelamento ou muda o autor. Cancelar novamente, reabrir concluída ou alterar corrida alheia deve falhar.

Nenhum dos passos físicos foi executado nesta sessão. Os testes de regras e disputas foram executados apenas no Emulator; os de confirmação/destaque/histórico usaram navegador com mocks.


## Aceite: diagnóstico e Maps

No cartão do motorista, acompanhar verificação, rotas 1/3 a 3/3 e confirmação do Firestore. Antes da confirmação, deve continuar Solicitada e não abrir Maps. Após confirmação, deve aparecer Aceita com Abrir rota até passageiro, Confirmar embarque e Cancelar; Recusar desaparece. Testar o link manual após voltar do Maps. Em falha, registrar o código/etapa mostrados no próprio cartão, sem forçar alteração da corrida pelo console. Conferir o painel do passageiro em cada etapa. Nenhuma reprodução real da corrida vPin18pd foi executada nesta sessão.

## Envio único do passageiro — protocolo 3

Pré-requisitos: ler `ATUALIZACAO-PASSAGEIRO.md`, revisar/aplicar as regras completas após autorização e usar contas com controle correto. Para perfil antigo, inventariar e resolver todos os ativos antes da inicialização manual. Não apagar pedidos duplicados. A execução abaixo ainda está pendente em aparelhos reais.

1. No aparelho A, entrar com P e preparar UID de M, GPS e destino. Tocar várias vezes rapidamente em Enviar. Desde o primeiro toque deve aparecer **Enviando solicitação…**, com botão bloqueado. Após confirmação: **Aguardando resposta do motorista**, sem botão clicável. Conferir um único novo documento e `passageiros_ativos/P.rideId` igual ao ID.
2. Repetir com rede lenta (limitação de rede do aparelho, sem interromper uma corrida em viagem). Antes da confirmação não pode dizer que enviou com sucesso. Cortar a rede durante envio, recarregar e reconectar: deve verificar o servidor antes de oferecer outra tentativa. Se a gravação já ocorreu, recuperar a espera em vez de criar pedido extra. Registrar qualquer erro/código.
3. Abrir P no aparelho B ou em uma segunda sessão independente enquanto o pedido aguarda. Deve mostrar espera e impedir envio. Recarregar ambos: bloqueio permanece. Depois retornar B à conta M para continuar.
4. Para concorrência real, deixar duas sessões de P prontas ANTES de qualquer pedido e tocar em ambas simultaneamente. Apenas uma nova corrida pode existir; a outra deve acompanhar a corrida existente/mostrar o conflito. Usar uma terceira sessão de M ou alternar conta depois para resolver. Não resetar reservas manualmente para repetir.
5. M aceita: P vê **Motorista aceitou a corrida e está a caminho**. P não envia outro pedido em nenhum aparelho. Embarcar: bloqueio continua em viagem; cancelar fica indisponível. Concluir: ambas as reservas são liberadas atomicamente e P pode solicitar novamente.
6. Repetir com recusa e com cancelamento antes do embarque (por cada participante na etapa permitida). Novo pedido só aparece após confirmação do estado final e da reserva livre. Conferir histórico/autoria/horário.
7. Conta com duplicados antigos: confirmar que todos continuam registrados, a tela informa os ativos e nenhum novo pedido é permitido. Não esperar tratamento/exclusão automática. Registros sem schema exigem revisão administrativa separada.
8. Registrar IDs completos, UIDs, horários, aparelhos/navegadores, mensagem e número de documentos novos em cada tentativa. Não registrar senhas. Comparar contagem antes/depois sem apagar o histórico.

Tentativas maliciosas de trocar participantes, apagar reserva, liberar sem finalizar ou criar dois pedidos já são cobertas pelo Emulator. Não executar adulterações no Firebase real como parte do teste físico.
