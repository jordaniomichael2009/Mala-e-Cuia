# Mala e Cuia 3.0 — pacote local

Nenhuma publicação ou alteração no Firebase real foi realizada. Tudo neste pacote é código local para revisão e testes.

## Conteúdo

- `index.html` e `driver-settings.js`: interface existente e configuração da conta unificada.
- `functions/`: backend callable, reserva transacional e preço dos três trajetos.
- `firestore.rules`: proposta de regras com escritas de corridas/configuração/reservas restritas ao backend.
- `tests/`: testes de serviço em memória, sincronização, navegador e Firestore Emulator.
- `CONFIGURACAO-E-PUBLICACAO.md`: instalação e futura publicação, sem comandos executados contra produção.
- `TESTES-DOIS-CELULARES.md`, `RESULTADOS-DOS-TESTES.md`, `AUDITORIA-GARANTIAS.md`, `STATUS-E-LIMITES.md`.

## Comandos locais

Node 22 (alvo das funções), npm e Java 21 para o emulador. Dependências fixadas em `package-lock.json` e `functions/package-lock.json`.

```sh
npm ci
npm run test:unit
npm run test:browser
npm run test:emulator
npm run build:web
```

O teste de navegador usa `/usr/bin/chromium` se existir; em outro sistema utiliza Chromium instalado com `npx playwright install chromium`.

O teste de emulador usa somente `demo-mala-e-cuia` e localhost. Não precisa de login Firebase. Não executar testes com ID de produção. O teste de navegador intercepta todas as requisições e não abre o Firebase real. Abrir o HTML manualmente sem mocks usa a configuração original do projeto, portanto não é o método de teste local seguro deste pacote.
