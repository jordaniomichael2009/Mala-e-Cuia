# Situação — variante sem Functions

Todos os itens permanecem parciais como entrega operacional, pois não houve teste físico ou aplicação no Firebase real. O quadro distingue implementação local e pendências de funcionalidade.

| Nº | Requisito | Implementado e testado localmente | Pendente |
|---|---|---|---|
| 1 | Cadastro/login | Auth E-mail/Senha e perfis existentes, sessão simulada | Auth real e aparelhos físicos |
| 2 | Veículos/tarifas/base | Config única por UID, restauração e versões; testes de unidade/navegador/Emulator | Cadastro detalhado do veículo e teste físico |
| 3 | Endereços/cidade/estado | Busca de local, autocomplete de cidades, seletor UF | Autocomplete UF e serviços reais |
| 4 | GPS | Captura pontual e posição privada sincronizada | GPS físico/contínuo; posição real não é atestada |
| 5 | Solicitações em tempo real | Escrita direta Firestore e listeners; regras/cliente no Emulator | Firebase real e dois celulares físicos |
| 6 | Manual/automático | Pedido manual por UID | Catálogo público e despacho automático |
| 7 | Aceitar/recusar | SDK cliente + regras reservam motorista; concorrência e lotes maliciosos testados | Validação física/produção |
| 8 | Maps até embarque | Link só após sucesso da transação | Maps nativo em aparelho |
| 9 | Embarque/Maps destino | Etapa nas regras e link | Maps nativo em aparelho |
| 10 | Conclusão/liberação | Transação pareada, exclusão de reserva e disponibilidade; testes de tentativa incompleta | Físicos; recuperação administrativa de legados |
| 11 | Histórico | Lista básica de concluídas/recusadas | Filtros/paginação/ganhos e teste físico |
| 12 | Duas tarifas/três trajetos | **Estimativa do cliente**, tarifas/fórmula/versão validadas nas regras no aceite | Distâncias/GPS verificados por servidor **não implementados**; aprovação do preço pelo passageiro/pagamento não implementados |

Não existe validação independente de distância nem cotação garantida no backend. Sem Functions, esta revisão prioriza a segurança de participantes, reservas e etapas; o preço é explicitamente estimativa. A estimativa surge no aceite, para preservar a base privada do motorista.

Nenhuma regra antiga foi aplicada. Esta adaptação é destinada somente à branch de revisão `teste-sem-blaze`, sem alterar a `main` ou o Firebase. O commit anterior segue preservado como referência histórica da variante com Functions.


Preparação Pages local: pacote mínimo em `docs/`, manifesto e regras completas para revisão. Há seis testes novos de compatibilidade. Atualizações de corridas exigem `schemaVersion: 2`; pedidos antigos não são migrados. A garantia de reserva única vale para o fluxo novo, não substitui inventário/tratamento de corridas antigas ativas sem reserva. Não reutilizar contas nessas condições. Teste físico com duas contas novas continua pendente.


Cancelamento antes do embarque agora está implementado para os dois participantes com confirmação, auditoria e liberação transacional. Canceladas entram no histórico. Destaque de corrida ativa implementado. Testes incluem aceitar/cancelar, embarcar/cancelar e dois cancelamentos. O cancelamento de legados sem schemaVersion continua bloqueado; recuperação administrativa, cancelamento após embarque e teste físico permanecem pendentes. Regras não aplicadas automaticamente nesta sessão, por ausência de autenticação Firebase.
