# Resultados — revisão Spark sem Functions

## Executados nesta adaptação

- `npm run test:unit`: 6 testes de sincronização aprovados. Bloqueio durante leitura, offline, troca de conta, conta nova sem padrões, rejeição/recarregamento de versão antiga e configuração inválida.
- `npm run test:browser`: aprovado com três sessões móveis de Chromium, viewport 390 × 844. Executa `firestore-client.js` com SDK/transporte simulado; restaura config por UID, ignora cache antigo, unifica Conta/Painel, recusa salvamento antigo e exercita pedido/aceite/embarque/conclusão/histórico. Todos os serviços externos são interceptados. A configuração de GPS igual ao embarque gera trecho vazio de ida zero; estimativa final desse teste é R$ 37,00.
- `npm run test:emulator`: **44 testes aprovados**, código 0. Projeto `demo-mala-e-cuia`, 127.0.0.1, Firestore Emulator 1.19.8/Java 21. Usa o SDK cliente com as novas regras; NÃO usa Admin SDK/Cloud Functions para executar as operações de negócio.
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


## Casos adicionais da preparação Pages

14. Perfil antigo com tarifas extras permanece legível; salvamento explícito do novo formulário remove esses campos sem transferir tarifas para a configuração.
15. Formato antigo de disponibilidade pode alternar sem reserva.
16. Configuração UUID antiga mantém edição bloqueada e não é substituída por padrões.
17. Pedidos sem marcador de três variantes históricas permanecem somente consulta; cliente e regras negam atualização/promoção automática.
18. Histórico antigo permanece legível; reserva de uma corrida antiga ativa não pode ser liberada por esta nova interface.
19. Bloqueio de migração demonstrado: corrida antiga aceita sem reserva não impede uma nova reserva. Resolver o estado histórico antes de reutilizar a conta; o teste não declara essa situação segura.

`npm run test:pages`: aprovado com três sessões e arquivos gerados em `docs/`, servidos sob `/Mala-e-Cuia/`. Testa importações relativas, sessão e fluxo completo com SDK/serviços simulados. Não é publicação ou execução no domínio GitHub real.

Os fixtures históricos foram extraídos dos formatos do código Git, não do banco real. Nenhum push, troca de fonte do Pages ou aplicação de regras foi realizado nesta preparação.


## Atualização de cancelamento — execução atual

20. Passageiro cancela pendente; motorista não cancela pendente e deve usar Recusar.
21. Ambos os participantes cancelam após aceite, com reserva/disponibilidade liberadas na mesma transação.
22. Cancelar pedido pendente não libera a reserva de outra corrida.
23. Lotes incompletos, autoria/papel/horário falsos, troca de participantes/preço e cancelamento por estranho são negados.
24. Canceladas são terminais; auditoria não pode ser reatribuída ou reaberta.
25. Cancelamento após embarque/conclusão é negado no SDK e em lote malicioso.
26. Cancelamento enquanto o aceite calcula rotas impede a reserva pelo aceite atrasado.
27. Aceite/cancelamento concorrentes terminam com reserva coerente, inclusive no caso aceite seguido por cancelamento.
28. Embarque/cancelamento concorrentes têm exatamente um vencedor.
29. Dois cancelamentos preservam a primeira autoria e liberam uma vez.
30. Cliente Pages anterior continua criando/aceitando/embarcando/concluindo sob as regras novas; capacidade de cancelamento somente leitura.
31. Sondagem da interface nova retorna indisponível sob as regras antigas fornecidas.

Execução da entrega de cancelamento: 31 testes, 31 aprovados, Firestore Emulator 1.19.8/Java 21, dois projetos demo isolados para testar regras atuais/anteriores. Nenhuma operação contra Firebase real. Seis testes unitários de sincronização também aprovados.

`npm run test:pages` atual: fluxo principal com três sessões móveis mais uma sessão de compatibilidade com regras antigas. Verificou confirmação e desistência, cancelamento pendente/aceito pelo passageiro, aceito pelo motorista, ausência de Cancelar após embarque, destaque/ordenação, audit trail e histórico para ambos. Mensagens e transações do navegador usam mocks; a segurança das regras é validada separadamente no Emulator real.

A CLI confirmou ausência de usuário Firebase autenticado. Regras não foram aplicadas automaticamente; entregues integralmente com SHA-256 e instruções no console. Push da interface está autorizado e atualizará o Pages; as regras são uma operação separada. Sem alteração de plano, exclusão de dados ou merge na main.


## Correção de aceite e Maps

32. Progresso e callback de confirmação ocorrem após reconhecimento do commit pelo Firestore; documento Aceita é conferido.
33. Firestore `permission-denied` preserva Solicitada e não emite sucesso.
34. Falha de rota identifica o trecho e preserva solicitação sem reserva.
35. GPS expirado produz erro de verificação com orientação, sem aceite silencioso.

O teste Pages também atrasa o commit e silencia a consulta do motorista: não mostra Aceita nem abre Maps antes da confirmação; após reconhecimento troca os controles mesmo sem o listener. A leitura de revalidação é atrasada para provar a atualização imediata. Testa snapshot antigo, leitura que falha após commit, Maps automático e alternativa manual, e mantém o painel do passageiro nas etapas Solicitada/Aceita/Embarcado. Ver `DIAGNOSTICO-ACEITE.md`.

## Proteção do passageiro — protocolo 3 (17/11/2026)

- **44/44 no Firestore Emulator**, saída 0: inclui os casos anteriores de preço/aceite/cancelamento, nove casos novos de perfil/controle pareados, duas sessões SDK independentes concorrentes (só uma criação), escrita direta sem reserva, schema 2 novo negado, dois pedidos no lote, reserva apagada/resetada/substituída, papel alterado enquanto ocupado, acesso indevido, bloqueio nos estados solicitado/aceito/embarcado, liberação terminal pareada, conta antiga sem autoinicialização, duplicados preservados e compatibilidade da sondagem. Uma rejeição de corrida concorrente pode vir das regras como permission-denied; o cliente relê a reserva e informa active-ride sem apresentar sucesso.
- **6/6 testes unitários** de configuração continuam aprovados.
- **Navegador/Pages aprovado** com SDK e rede simulados: eventos repetidos no mesmo instante, commit atrasado mantendo Enviando, uma criação, espera sem botão, outro aparelho simulado, recarga, aceite/viagem, liberação por recusa/cancelamento/conclusão, falha de permissão, reconhecimento perdido após commit com releitura que mantém o bloqueio, cache vazio sem liberar envio e bloqueio sob regras antigas/conta sem revisão.
- O teste no caminho `/Mala-e-Cuia/` usa exatamente `docs/`, gerado pelo build e registrado no manifesto.
- Não houve teste físico, Auth de produção, leitura de dados reais, aplicação das regras ou inicialização de contas no Firebase real. Nenhum duplicado real foi excluído. Aplicar regras/inicializar perfis antigos e testar fisicamente continua pendente.
