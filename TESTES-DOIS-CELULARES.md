# Roteiro físico — dois celulares e duas contas

## Estado desta revisão

Não executado fisicamente. Nenhum push, publicação, troca do Pages ou aplicação de regras foi feito. O roteiro só pode ser executado contra Firebase real após aprovação da publicação e das regras correspondentes.

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
- Confirmar E-mail/Senha no Auth, projeto/domínio e revisão das novas regras. Não usar as regras anteriores que bloqueiam escritas. No Pages, confirmar a fonte efetivamente autorizada; o endereço atual pode ainda estar servindo a main.
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

Pré-requisito: conferir `ATUALIZACAO-CANCELAMENTO.md` e aplicar as regras novas pelo console quando autorizado. Sem as regras, Cancelar aparece desabilitado; recarregar após a atualização. A corrida deve ter schemaVersion 2.

1. A (P) envia um pedido. No topo deve aparecer Solicitação em andamento. Em B (M), antes do aceite há Recusar e não Cancelar.
2. A toca Cancelar e desiste na confirmação: nada deve mudar. Toca novamente e confirma: status Cancelada nos dois aparelhos, com papel, UID e horário. Sem reserva criada. Histórico deve registrar o cancelamento.
3. Novo pedido: B aceita. Resumo Corrida ativa no topo e cartão destacado antes do histórico. A confirma Cancelar: corrida cancelada, reserva removida e B disponível. Verificar registro no histórico dos dois.
4. Novo pedido aceito: B confirma Cancelar antes de embarcar. Mesmo resultado, com autoria motorista. Não apagar o documento da corrida.
5. Novo pedido aceito: B confirma embarque. Cancelar deve sumir nos dois. Tentativas diretas de cancelar essa etapa já são negadas no Emulator; finalizar normalmente.
6. Disputa aceitar/cancelar: repetir em A e B quase simultaneamente. Um aceite pode acontecer antes do cancelamento; o estado final precisa estar coerente. Cancelada não pode manter reserva. Aceita/embarcada precisa manter a reserva correspondente.
7. Disputa embarcar/cancelar: depois do aceite, B toca Embarque enquanto A confirma Cancelar. Só uma operação pode vencer. Se embarcou, cancelamento falha e reserva permanece; se cancelou, embarque falha e reserva desaparece.
8. Os botões ficam bloqueados enquanto uma operação aguarda resposta. Conferir que recarregar não repete cancelamento ou muda o autor. Cancelar novamente, reabrir concluída ou alterar corrida alheia deve falhar.

Nenhum dos passos físicos foi executado nesta sessão. Os testes de regras e disputas foram executados apenas no Emulator; os de confirmação/destaque/histórico usaram navegador com mocks.
