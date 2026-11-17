# Auditoria da configuração e das garantias

Todos os resultados se referem à cópia local. Não houve publicação ou alteração em Firebase real.

| Garantia | Implementação | Testes e limites |
|---|---|---|
| Tarifas únicas na Conta e no Painel | `driver-settings.js` controla um único rascunho; os quatro campos em `index.html` editam os mesmos dois valores. O perfil não grava mais tarifas duplicadas. | `tests/settings.test.cjs` e `tests/local-flow.cjs`: três sessões, alteração na Conta refletida no Painel, persistência por UID. |
| Restaurar conta antes de permitir alterações | `index.html` usa `getDocFromServer` para `config_motoristas/{uid}`. `driver-settings.js.load` bloqueia edição até a resposta; offline, documento inválido ou troca de conta não deixam dados antigos desbloqueados. | Testes de unidade: leitura adiada, offline, troca de conta, documento inexistente/inválido. Navegador: segundo aparelho com tarifas/base antigas em localStorage restaura valores do servidor. |
| Não sobrescrever com versão antiga | `functions/service.cjs.configureDriver` exige `expectedVersion` e compara com o documento dentro da transação. O controlador recarrega após conflito. Não há gravação automática no login. | Unidade, navegador e `tests/emulator.test.cjs`: dois salvamentos com a mesma versão permitem só um; outro recebe `aborted`. |
| Preço calculado no backend | `requestRide` lê config por UID, consulta os três pares de coordenadas e calcula em centavos. Não usa preço, distâncias ou tarifas fornecidos pelo passageiro. | `tests/backend.test.cjs`: preço adulterado, rota exata, config alterada durante consulta. Rotas simuladas; OSRM real pendente. Posição sincronizada válida por até 15 min, sem GPS contínuo. |
| Uma corrida ativa por motorista | `rideStep` lê/cria reserva `motoristas_ativos/{uid}` e muda disponibilidade na mesma transação do aceite. | Teste em memória e Firestore Emulator: dois aceites concorrentes produzem somente uma corrida aceita e uma reserva. Produção/físicos pendentes. |
| Finalização e liberação atômicas | `rideStep` remove reserva, restaura disponibilidade e conclui corrida na mesma transação. | Em memória e Emulator: falha injetada não libera nem conclui pela metade; sucesso libera e conclui. |
| Regras impedem adulteração | `firestore.rules` proíbe cliente de escrever corridas/config/reservas. Regras restringem leitura aos titulares/participantes e mudanças em perfil/disponibilidade durante corrida ativa. Funções Admin verificam usuário, versão e ordem de etapas. | Regras compiladas/executadas no Firestore Emulator: acesso indevido e alteração de preço, participantes, etapas e reservas foram negados. Regras existentes de produção não foram lidas nem modificadas. |

## Resultados executados

`tests/backend.test.cjs` + `tests/settings.test.cjs`: 15 testes aprovados.

`tests/local-flow.cjs`: fluxo de três sessões de navegador aprovado, sem acesso externo.

`tests/emulator.test.cjs`: 5 testes aprovados no Firestore Emulator, projeto local `demo-mala-e-cuia`; usa SDK Admin real no emulador para transações e SDK cliente com regras para os acessos.

## Pendências reais

Não foi testado o wrapper callable pela rede/Authentication Emulator, nem Firebase de produção, IAM, Auth real, OSRM real, Maps nativo ou aparelhos físicos. A configuração foi testada em sessões isoladas de navegador e com banco persistente do Emulator, não em celulares físicos.

Não há despacho automático, catálogo público de motoristas, cadastro detalhado de veículo, cancelamento ou recuperação administrativa de reservas abandonadas. Motorista é perfil autodeclarado para teste. Tarifas e base antigas sem versão válida exigem confirmação/migração explícita: não são importadas automaticamente.
