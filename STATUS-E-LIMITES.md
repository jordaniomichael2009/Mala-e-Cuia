# Situação dos 12 requisitos

“Parcial” nesta tabela é a entrega operacional, considerando Firebase real e aparelhos físicos ainda não validados. A coluna de implementação/testes distingue o que foi efetivamente concluído localmente.

| Nº | Requisito | Situação | Implementação e evidência local |
|---|---|---|---|
| 1 | Cadastro e login | Parcial | Auth E-mail/Senha, recuperação, logout e perfis implementados; sessão simulada. Auth real pendente. |
| 2 | Veículos, tarifas e base | Parcial | Tarifas/base unificadas por UID, restauração antes da edição e rejeição de versões antigas implementadas/testadas em unidade, navegador e Emulator. Veículo tem apenas tipo, sem cadastro detalhado. |
| 3 | Endereços/cidade/estado | Parcial | Nominatim sob demanda, autocomplete de cidades IBGE e seletor de UF; sem autocomplete de UF. Serviços simulados no navegador. |
| 4 | GPS passageiro/motorista | Parcial | Captura pontual implementada e simulada; sem rastreamento contínuo. Físicos pendentes. |
| 5 | Solicitação Firestore em tempo real | Parcial | Criação segura via backend e listeners implementados; fluxo no navegador simulado e dados/regras no Firestore Emulator testados. Rede callable/produção pendentes. |
| 6 | Escolha manual ou automática | Parcial | Envio manual por UID implementado; catálogo público e despacho automático pendentes. |
| 7 | Aceitar e recusar | Parcial | Implementados; reserva exclusiva e etapas testadas em transações concorrentes no Firestore Emulator. Físicos/produção pendentes. |
| 8 | Maps até passageiro no aceite | Parcial | Link após sucesso do backend implementado. Navegação interceptada no teste; Maps nativo pendente. |
| 9 | Embarque e Maps ao destino | Parcial | Etapa no backend e link implementados. Maps nativo pendente. |
| 10 | Finalizar/liberar motorista | Parcial | Transação única implementada e testada no Emulator, inclusive rollback após falha. Físicos/produção pendentes. |
| 11 | Histórico | Parcial | Histórico básico de concluídas/recusadas implementado e testado no navegador; sem filtros/paginação. |
| 12 | Duas tarifas, três trajetos | Parcial | Cálculo backend com configuração única da conta e fórmula implementados. Preço adulterado ignorado em testes; regras bloqueiam preço adulterado no Emulator. OSRM real/físicos pendentes. |

A pendência anterior de unificação/restauração de tarifas e base foi resolvida no código e nos testes locais. A pendência anterior de execução das regras e transações no Emulator também foi resolvida. Isso não significa publicação ou comprovação no Firebase real.

Posição do motorista é a última sincronizada, válida por até quinze minutos. Não há comprovação contra falsificação de GPS pelo dispositivo. As regras fornecidas negam outras coleções por padrão e precisam ser comparadas às regras existentes antes de qualquer implantação autorizada.

Ver `AUDITORIA-GARANTIAS.md`, `RESULTADOS-DOS-TESTES.md` e `CONFIGURACAO-E-PUBLICACAO.md`.
