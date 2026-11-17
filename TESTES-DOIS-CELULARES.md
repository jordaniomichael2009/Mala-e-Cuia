# Roteiro de revisão e testes — Spark

## Primeiro, somente testes locais

```sh
npm ci
npm run test:unit
npm run test:browser
npm run test:emulator
npm run build:web
```

Não executar deploy nem push. Revisar `firestore-client.js`, `driver-settings.js` e as **novas** `firestore.rules`. As regras da versão anterior não permitem este fluxo e não devem ser aplicadas.

## Cenário físico futuro, após autorização

1. Usar HTTPS, Authentication E-mail/Senha e Firestore de um projeto de teste, sem Functions. Confirmar que cliente/regras propostos foram revisados e autorizados juntos.
2. A: perfil Passageiro. B: outra conta com perfil Motorista e veículo. Aguardar restauração da configuração de B antes de editar. Sem dados no servidor, preencher tarifas e base explicitamente.
3. B: obter GPS, definir base, salvar configuração da conta e marcar disponível. Copiar UID.
4. A: obter GPS e destino. Selecionar serviço compatível, inserir UID de B e referências. Enviar pedido. A solicitação deve aparecer em B com estimativa ainda ausente.
5. B: aceitar. O navegador consulta três rotas e tenta uma transação que cria a reserva, marca indisponível e salva a estimativa. A deve ver motorista a caminho e o valor marcado como estimativa de distâncias do cliente. Maps abre até o embarque.
6. B: voltar ao navegador, confirmar embarque, abrir Maps até destino e finalizar. Conclusão precisa remover a reserva e restaurar disponibilidade na mesma transação. Histórico aparece nos dois papéis.
7. Novo pedido: recusar; não pode reservar motorista nem liberar outra corrida ativa.

## Sincronização em terceiro aparelho

Entrar com a mesma conta do motorista em C, mesmo com valores antigos no navegador. Antes de carregar o servidor, os campos devem estar bloqueados. Tarifas e base devem vir da conta. Alterar tarifa na Conta deve refletir no Painel. B com versão antiga não pode substituir os valores salvos por C; deve recarregar e exigir nova confirmação.

## Tentativas de burlar

- Aceitar dois pedidos simultaneamente em B e C: uma única reserva e uma única corrida aceita.
- Enviar lote com duas corridas aceitas e só uma reserva: negar tudo.
- Aceite sem reserva/disponibilidade, reserva isolada, conclusão sem liberar ou liberação sem concluir: negar tudo.
- Trocar motorista/passageiro, coordenadas, serviço, preço ou etapa indevida: negar. Terceiro não lê nem altera corrida/configuração privada.
- Alterar tarifas/base, perfil ou reativar disponibilidade durante corrida ativa: negar.
- Alterar tarifas da estimativa ou total sem obedecer à fórmula/versão: negar.
- **Limite esperado:** distâncias falsas mas numericamente válidas com a fórmula correta podem ser aceitas. Não existe servidor verificando rotas nesta variante. Isso não pode ser apresentado como preço garantido.
- Falha de rede/rotas ou GPS desatualizado no aceite deve manter solicitação sem reserva parcial.

Registrar aparelho, navegador, versão, etapa e código do erro sem registrar senha. Não usar este protótipo para transporte comercial; faltam cancelamento/recuperação e validação física.
