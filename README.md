# Mala e Cuia 3.0 — revisão Spark, sem Cloud Functions

Interface mantida na branch `teste-sem-blaze`, que alimenta o Pages por `/docs`. O push autorizado publica apenas a interface; a main permanece separada. As regras do Firestore precisam de aplicação independente. Sem Cloud Functions ou ativação de Blaze.

Usa Firebase Authentication (E-mail/Senha), Firestore com transações do SDK cliente e regras de segurança. Não requer Cloud Functions ou Blaze para este fluxo de teste dentro das cotas do plano Spark. CSS original preservado.

## Arquivos principais

- `index.html`: interface existente e listeners em tempo real, sem importação de Functions.
- `firestore-client.js`: criação de solicitações, sincronização da conta, aceite/reserva, embarque e conclusão/liberação.
- `driver-settings.js`: tarifas/base da conta, carregamento obrigatório do servidor e proteção contra salvamento antigo.
- `firestore.rules`: **NOVAS regras propostas desta adaptação**. As anteriores, que proibiam todas as escritas do cliente, não servem para esta versão. Nenhuma regra foi aplicada ao projeto real.
- `tests/emulator.test.cjs`: SDK cliente real contra Firestore Emulator, incluindo tentativas de burlar operações.
- Documentos: `AUDITORIA-GARANTIAS.md`, `RESULTADOS-DOS-TESTES.md`, `STATUS-E-LIMITES.md`, `TESTES-DOIS-CELULARES.md` e `CONFIGURACAO-E-PUBLICACAO.md`.

## Preço é somente estimativa

A solicitação nasce sem estimativa. O celular do motorista calcula os três trajetos **no aceite** usando sua própria configuração privada. O passageiro vê o total/distâncias após o aceite, sem acesso à base ou ao GPS privado do motorista.

As regras validam as tarifas da conta, os limites/tipos das distâncias, o arredondamento e a fórmula. **As distâncias calculadas pelo cliente não são verificadas por servidor.** Distâncias falsas com fórmula consistente podem passar; há um teste explícito desse limite. Não é cotação garantida nem cobrança.

## Executar localmente

Node 22+ e Java 21 para o Emulator. `package-lock.json` fixa as dependências de desenvolvimento.

```sh
npm ci
npm run test:unit
npm run test:browser
npm run test:emulator
npm run build:web
```

O navegador usa Chromium do sistema ou o instalado com `npx playwright install chromium`. O teste de navegador intercepta toda a rede. O de regras usa somente o projeto local `demo-mala-e-cuia`; não exige login Firebase. Abrir o HTML manualmente usa a configuração original do Firebase: não o faça para teste isolado sem os mocks ou sem autorização para o ambiente correspondente.

`build:web` gera somente os três arquivos públicos em `web-dist`, sem backend. Não há configuração `functions` em `firebase.json`.


## Preparação atual do Pages

Ler `PUBLICACAO-PAGES-REVISAO.md`, `COMPATIBILIDADE-LEGADOS.md` e `REGRAS-COMPLETAS-FIRESTORE.md`. `npm run prepare:pages` gera somente quatro arquivos em `docs/` e um manifesto na raiz. Fonte atual do Pages: `teste-sem-blaze /docs`; a configuração não será alterada. `npm run test:pages` testa esse pacote no subdiretório `/Mala-e-Cuia/` com a rede simulada. Corridas novas têm `schemaVersion: 3`; registros schema 2 mantêm suas etapas e registros sem marcador são somente consulta. A migração de contas com corridas antigas ativas é bloqueio antes de reutilizá-las.


## Corrida ativa e cancelamento

A corrida ativa aparece em destaque e antes do histórico. Passageiro cancela esperando ou após aceite; motorista cancela após aceite, sempre antes do embarque e com confirmação. Autoria e horário ficam no documento e no histórico; uma reserva existente é liberada na mesma transação. Ver `ATUALIZACAO-CANCELAMENTO.md` para aplicação das regras pelo console e sequência compatível de atualização. Sem as regras correspondentes, a interface mantém Cancelar desabilitado; não precisa criar documento de configuração.


## Aceite e Maps

Ver `DIAGNOSTICO-ACEITE.md`: progresso e erros no cartão, troca de controles somente após confirmação do Firestore, revalidação antes de abrir rota e link manual. Não foi necessária mudança nas permissões das regras.

## Proteção contra envio duplicado

Leia `ATUALIZACAO-PASSAGEIRO.md`. Bloqueio imediato no envio, texto sem clique após confirmação e reserva transacional persistente do passageiro. Regras completas novas são obrigatórias; a interface bloqueia novos pedidos sob as regras anteriores. Contas já existentes sem controle `passageiros_ativos` precisam de revisão manual antes de habilitar novos pedidos. Nenhum duplicado é apagado automaticamente.

## Interface sem demonstrações isoladas

Removidos os painéis “Simulação da tarifa por percurso” e “Navegação do motorista — demonstração”, seus campos, botões, estilos e scripts exclusivos. O exemplo de tarifa do painel do motorista também dependia das distâncias simuladas e foi removido. A seleção da base por GPS foi preservada no módulo da conta; tarifas/base continuam sincronizadas, e a estimativa integrada continua sendo calculada no aceite. Os controles de Maps e etapas da corrida permanecem no painel integrado. Essa limpeza não exige mudança nas regras nem modifica o Firebase.
