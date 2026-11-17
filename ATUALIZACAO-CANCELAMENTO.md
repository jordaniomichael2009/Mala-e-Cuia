# Atualização compatível — cancelamento antes do embarque

> Documento da entrega anterior. Para o estado atual, prevalece `ATUALIZACAO-PASSAGEIRO.md`: novas regras obrigatórias, criações schema 3, compatibilidade limitada a operações schema 2 existentes e revisão de contas antigas. As contagens abaixo são históricas; resultados atuais em `RESULTADOS-DOS-TESTES.md`.

Projeto: `mobilidademalaecuia`. Branch da interface: `teste-sem-blaze`; Pages já configurado em `/docs`. Push nesta branch publica a interface. Não alterar a main, a fonte do Pages ou o plano Spark/Blaze.

## Contrato da operação

- Passageiro: cancela `solicitada` ou `aceita`, antes de `embarcado`.
- Motorista: antes do aceite usa **Recusar**; depois do aceite pode cancelar até antes do embarque.
- Interface exige confirmação. Cancelamento é terminal e não exclui a corrida.
- Grava `status: cancelada`, `updatedAt` e `cancellation: {by: UID, role: passageiro|motorista, at: timestamp do servidor}`.
- Regras verificam autoria, horário e imutabilidade de participantes/estimativa. Não permitem cancelar depois do embarque ou da conclusão.
- Cancelar uma solicitação pendente não mexe na reserva de outra corrida. Cancelar uma corrida aceita exclui somente sua reserva e restaura disponibilidade na MESMA transação.
- Cancelamento preserva estimativa e entra no histórico dos dois participantes. Não há taxa, reatribuição automática ou pagamento.

## Sequência ideal: regras primeiro, interface depois

1. Guardar uma cópia do texto de regras REALMENTE em uso no console. Os fixtures em `tests/fixtures` são versões históricas para testes, não backup do projeto real.
2. Revisar e aplicar integralmente o `firestore.rules` desta entrega no projeto indicado, sem mudar plano, coleções ou dados. O texto completo idêntico também está em `REGRAS-COMPLETAS-FIRESTORE.md`.
3. As regras novas continuam aceitando o cliente Pages anterior com `schemaVersion: 2`: pedido, aceite, embarque e conclusão passaram em teste de compatibilidade. Registros sem marcador continuam somente consulta.
4. Publicar a interface por commit/push somente para `teste-sem-blaze`, após testes. Nesta tarefa o push foi autorizado. Não é necessário alterar a fonte do Pages.
5. Recarregar os dois celulares. Confirmar cancelamento habilitado e executar o roteiro físico.

## Quando as regras não puderem ser aplicadas automaticamente

Nesta sessão não há usuário Firebase CLI autenticado, credencial Google configurada ou plugin Firebase conectado. Nenhuma regra foi aplicada automaticamente. Não pedir ou compartilhar senha/token.

O push da interface pode ocorrer com segurança em relação à compatibilidade conhecida: antes de habilitar **Cancelar**, o cliente faz um `getDocFromServer` de `system_capabilities/cancellation-v1`. As regras antigas fornecidas negam essa leitura; as novas permitem apenas esse `get` autenticado. O documento NÃO precisa existir e NÃO deve ser criado. Sem permissão ou sem rede, Cancelar fica desabilitado. Os outros fluxos e o destaque continuam disponíveis. Após aplicar as novas regras, recarregar a página habilita o recurso.

A sondagem é uma verificação de compatibilidade da rota, não uma auditoria de todas as regras reais. Regras antigas excessivamente permissivas podem também permitir a leitura; por isso é obrigatório comparar/aplicar o arquivo completo desta entrega, não confiar só no botão habilitado.

### Passos exatos pelo console

1. Abrir `https://console.firebase.google.com/`, selecionar **mobilidademalaecuia** e conferir o ID do projeto no cabeçalho/configurações.
2. Abrir **Firestore Database → Regras** no banco padrão utilizado pelo app.
3. Copiar o texto atual para backup local. Não editar documentos ou índices, não apagar coleções e não ativar Blaze.
4. Copiar TODO o arquivo `firestore.rules` deste commit (ou o bloco completo de `REGRAS-COMPLETAS-FIRESTORE.md`) para o editor. Não usar `tests/fixtures/before-cancellation.rules`.
5. Conferir os blocos `validCancellation`, `pairedCancel`, `cancelUpdate`, a permissão pareada de disponibilidade/reserva e a rota `system_capabilities/cancellation-v1`. Publicar somente as regras aprovadas.
6. Recarregar o Pages nos dois aparelhos autenticados. O aviso deve indicar cancelamento disponível; confirmar que a UI não mostra Cancelar após embarque.
7. Executar um pedido de teste antes do aceite e outro após o aceite, conferindo histórico e reserva. Não usar contas com corridas legadas ativas sem o tratamento descrito em `COMPATIBILIDADE-LEGADOS.md`.

## Disputas e resultados esperados

- Aceitar/cancelar: se o cancelamento ocorre primeiro, o aceite atrasado falha; se o aceite ocorre primeiro, o passageiro pode cancelar e liberar em seguida. As duas operações podem ter sucesso sequencialmente, mas não pode restar reserva para corrida cancelada.
- Embarcar/cancelar: somente uma operação pode vencer. Embarque vencedor mantém a reserva e impede cancelamento; cancelamento vencedor libera e impede embarque.
- Dois cancelamentos: primeiro commit preserva autoria/horário; o segundo recebe erro e não sobrescreve o histórico.
- Qualquer falha de regras/rede ou lote incompleto deixa o estado anterior consistente, sem liberação parcial.

## Validação desta entrega

31 testes no Firestore Emulator, 6 testes unitários de configuração e fluxo mobile no caminho `/Mala-e-Cuia/` aprovados. O navegador usa SDK/transporte simulado; as disputas e regras usam o Emulator real com SDK cliente. Não houve teste físico ou aplicação das regras no Firebase real.
