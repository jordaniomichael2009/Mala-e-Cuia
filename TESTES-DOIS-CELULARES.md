# Roteiro de testes

## Execução local sem acessar Firebase real

```sh
npm ci
npm run test:unit
npm run test:browser
npm run test:emulator
```

O teste de unidade usa memória/rotas determinísticas. O de navegador abre três sessões móveis e intercepta todo tráfego externo. O de Emulator usa regras e transações do Firestore Emulator em `demo-mala-e-cuia`, com guardas contra execução fora de localhost. Não é preciso login Firebase para o Emulator.

`RESULTADOS-DOS-TESTES.md` descreve a execução aprovada. Para cache e instalação dos navegadores, consultar `CONFIGURACAO-E-PUBLICACAO.md`.

## Antes do teste físico

Não publicar/deployar sem nova confirmação. Revisar regras existentes, dependências e projeto/região. O HTML precisa das funções correspondentes; o novo frontend não faz escrita direta alternativa se o backend falhar. Não abrir manualmente o HTML como teste isolado supondo que usa Emulator: o projeto original continua configurado no HTML. Os testes automatizados bloqueiam acesso ao Firebase real.

## Sincronização entre aparelhos

1. A é o passageiro; B e C representam a mesma conta de motorista em aparelhos diferentes. Usar somente contas/dados de teste.
2. No primeiro login do motorista, aguardar a leitura da configuração. Durante essa espera, tarifas, base e salvamento devem estar bloqueados. Falha de leitura deve mantê-los bloqueados; usar Recarregar configuração da conta para tentar novamente.
3. Se não existir configuração, as tarifas/base devem começar vazias. Nenhum valor antigo do navegador pode ser salvo automaticamente.
4. B: Conta → salvar perfil Motorista. Painel Motorista → definir duas tarifas, obter GPS e definir base. Salvar configuração da conta e atualizar GPS.
5. C: entrar na mesma conta. Conferir restauração de tarifas e base de B, mesmo que C já tenha valores antigos em localStorage. Entrar não pode criar nova versão nem gravar padrões.
6. C: alterar tarifa na Conta. O mesmo valor deve aparecer no Painel. Salvar perfil/configuração. Em B, tentar salvar uma alteração sem recarregar: deve falhar por versão antiga, carregar valores de C e exigir nova edição deliberada. Não pode restaurar os valores antigos de B no servidor.
7. Após recarregar a versão atual em B, editar e salvar deve funcionar. Alterar base também deve respeitar a mesma versão. Uma mudança só de tarifas/base não deve renovar artificialmente o horário do GPS existente.

## Fluxo de corrida após implantação autorizada

1. A: salvar perfil Passageiro. B: salvar perfil Motorista, obter GPS, base e tarifas, confirmar configuração no servidor e marcar disponível.
2. A: obter GPS, selecionar UF/cidade e destino pela busca. No painel integrado, informar UID de B e referências. Selecionar serviço compatível e enviar pedido.
3. Conferir a cotação devolvida pelo servidor: `(motorista → embarque + destino → base) × tarifa vazia + (embarque → destino) × tarifa ocupada`. As distâncias manuais da simulação não definem o preço da corrida.
4. B: aceitar. A deve ver motorista a caminho; B deve ficar reservado/indisponível e Maps deve abrir até o embarque. Voltar ao navegador.
5. B: confirmar embarque. A vê Em viagem; Maps abre destino. Voltar ao navegador e finalizar.
6. A e B: corrida concluída, histórico atualizado; B disponível e sem reserva. Recarregar para conferir persistência.
7. Em novo pedido, recusar: status Recusada, sem reserva e sem abrir Maps.

## Segurança e concorrência

- Antes de aceitar, criar dois pedidos para B. Aceitar quase simultaneamente em B e C: somente um deve ficar aceito e uma reserva deve existir. O outro deve receber erro sem avançar etapa.
- Durante corrida ativa, cliente não pode mudar perfil/disponibilidade nem apagar reserva. Finalizar deve liberar tudo na mesma transação.
- Tentar escrita direta em corridas/config/reservas, incluindo preço, participantes e status: deve negar. Terceiros não podem ler a corrida ou configuração privada.
- Chamar função de etapa com outra conta ou saltar etapa deve falhar. Cotação após dez minutos e GPS após quinze minutos exigem atualização/nova solicitação conforme o caso.
- Enviar preço/tarifa/distância adulterados pelo passageiro: backend deve ignorar e calcular de sua configuração/rotas. Exemplo simulado: três trechos de 10 km, R$ 1,20 vazio, R$ 2,50 ocupado → R$ 49,00.
- Testar GPS negado, rede indisponível e erro de rota: sem avanço silencioso ou alternativa de escrita insegura.
- Registrar aparelhos, navegadores, versão, etapa e códigos de erro; não registrar senhas. Corrida abandonada/cancelamento ainda não possuem recuperação administrativa neste protótipo.
