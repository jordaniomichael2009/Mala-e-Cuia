# Resultados — revisão Spark sem Functions

## Executados nesta adaptação

- `npm run test:unit`: 6 testes de sincronização aprovados. Bloqueio durante leitura, offline, troca de conta, conta nova sem padrões, rejeição/recarregamento de versão antiga e configuração inválida.
- `npm run test:browser`: aprovado com três sessões móveis de Chromium, viewport 390 × 844. Executa `firestore-client.js` com SDK/transporte simulado; restaura config por UID, ignora cache antigo, unifica Conta/Painel, recusa salvamento antigo e exercita pedido/aceite/embarque/conclusão/histórico. Todos os serviços externos são interceptados. A configuração de GPS igual ao embarque gera trecho vazio de ida zero; estimativa final desse teste é R$ 37,00.
- `npm run test:emulator`: **13 testes aprovados**, código 0. Projeto `demo-mala-e-cuia`, 127.0.0.1, Firestore Emulator 1.19.8/Java 21. Usa o SDK cliente com as novas regras; NÃO usa Admin SDK/Cloud Functions para executar as operações de negócio.
- Build estático e sintaxe JS/JSON verificados; CSS original preservado.

## O que o Emulator confirmou

1. Fluxo legítimo: pedido sem estimativa e base privada; aceite calcula os três pares corretos. Com 3/8/10 km e R$ 1,20/R$ 2,50, total de R$ 35,60.
2. Anônimo/terceiro não leem dados privados; passageiro não forja participantes/status/estimativa na criação; consultas filtradas permitidas.
3. Troca de motorista, passageiro, serviço, coordenadas ou timestamp original é negada mesmo num lote de aceite completo.
4. Fórmula, tarifas, versão, tipos, limites ou origem da estimativa adulterados são negados; lote inteiro fica sem reserva parcial.
5. **Limitação deliberada comprovada:** distâncias falsas/zero com fórmula consistente passam como estimativa do cliente. Não são verificadas por servidor.
6. Aceite isolado, reserva isolada ou aceite sem disponibilidade pareada são negados.
7. Dois aceites concorrentes com transações cliente permitem apenas uma corrida ativa.
8. Um lote malicioso com duas corridas aceitas e uma reserva é negado integralmente.
9. Reserva ativa não pode ser substituída/apagada; disponibilidade não pode ser reativada e perfil/configuração não podem mudar enquanto ocupados.
10. Etapas/estimativa/participantes imutáveis; conclusão incompleta é negada. A conclusão válida libera motorista e conclui na mesma transação.
11. Recusa é terminal e não libera uma reserva de outra corrida ativa.
12. Configurações concorrentes respeitam versão inteira; dados antigos/fora dos limites ou alteração por terceiro são recusados.
13. Fórmula respeita arredondamento final ao centavo: resultado fracionário que arredonda para 1 centavo não aceita truncamento para zero.

## Distinções importantes

O Emulator é um servidor local real com regras compiladas/transações, mas não é Firebase de produção. O teste de navegador usa mocks; as garantias das regras vêm da suíte separada de Emulator. Não houve Auth real, OSRM real, Google Maps nativo ou dois celulares físicos.

A publicação do código desta adaptação é restrita à branch de revisão `teste-sem-blaze`. Nenhum merge, deploy ou alteração no Firebase real. As regras fornecidas são propostas para revisão; não foram aplicadas a nenhum projeto real. O pacote anterior com Functions e seu commit continuam preservados fora da variante ativa.
