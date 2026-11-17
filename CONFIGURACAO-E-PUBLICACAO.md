# Configuração e publicação futura

**Publicação não autorizada nesta etapa. Os comandos de deploy abaixo são instruções para uso somente após confirmação. Nenhum foi executado.**

## Preparar a cópia local

1. Extrair o ZIP preservando as pastas. Instalar Node 22, npm e Java 21. A validação desta revisão utilizou Node 24.22.1 e Java 21; as funções têm Node 22 como alvo de deploy.
2. Na raiz, executar `npm ci`. Em `functions/`, executar `npm ci`. Ambos possuem lockfiles. Não incluir `node_modules` na publicação.
3. Para o navegador, usar Chromium do sistema (`/usr/bin/chromium`) ou executar `npx playwright install chromium` para instalar o navegador do Playwright.
4. Executar os testes de unidade, navegador e emulador conforme README. O emulador pode baixar seu JAR na primeira execução; exige acesso ao servidor de distribuição e Java. Usar o ID `demo-mala-e-cuia`, nunca o projeto real.
5. Se o ambiente bloquear o cache no diretório do usuário, apontar `npm --cache`, `FIREBASE_EMULATORS_PATH` e `XDG_CONFIG_HOME` para diretórios locais graváveis. Exemplo em Linux:

```sh
FIREBASE_EMULATORS_PATH="$PWD/.emulator-cache" XDG_CONFIG_HOME="$PWD/.firebase-cli-config" npm run test:emulator
```

Esses diretórios são temporários e não fazem parte do app.

## Modelo único da configuração

- Fonte oficial: `config_motoristas/{uid}`, com duas tarifas em centavos, base, tipo de veículo, versão e última posição.
- Os campos de tarifa da Conta e do Painel editam o mesmo rascunho. A Conta salva esse rascunho ao salvar o perfil; o botão do Painel salva e atualiza o GPS.
- O login usa `getDocFromServer`. Enquanto a leitura não terminar, tarifas, seleção da base e salvamento ficam bloqueados. Falha/offline/configuração inválida mantém o bloqueio. Não há restauração automática de tarifas/base do localStorage.
- Documento inexistente significa cadastro novo: os valores ficam vazios, sem preço ou base padrão gravados automaticamente.
- Cada gravação exige `expectedVersion`. Uma versão antiga é rejeitada na transação, e o cliente restaura os dados atuais; o usuário precisa conferir e reaplicar uma mudança deliberadamente.
- Atualizar tarifas/base sem atualizar o GPS preserva o horário da última posição. A regra dos 15 minutos continua valendo para solicitar corrida.

## Migração de dados antigos — preparar, não executar

O fluxo antigo gravava `tarifaVazio` e `tarifaOcupado` em `perfis`. Os campos canônicos agora ficam somente em `config_motoristas`. O novo formulário grava perfil com nome, tipo, veículo e timestamp; não grava tarifas duplicadas. Ao salvar um perfil antigo, a gravação substitui os campos antigos do documento.

Se já existir uma configuração válida por UID, ela é carregada como fonte oficial. Se só existirem tarifas no perfil antigo ou no navegador, NÃO são migradas automaticamente. O motorista deve preencher e confirmar explicitamente a configuração nova; qualquer migração em massa exige revisão e autorização. Uma configuração existente sem versão/formato válido mantém a tela bloqueada e exige migração administrativa deliberada. Nunca substituir por padrões.

Corridas antigas sem cotação/reserva do fluxo novo não podem ser aceitas neste fluxo. Planejar migração ou recriar pedidos de teste; não editar preços ou reservas manualmente para contornar validações.

## Revisão antes de publicação autorizada

- Comparar `firestore.rules` com as regras do projeto existente. O arquivo proposto nega outras coleções por padrão; não o substituir sem avaliar dependências.
- Conferir projeto configurado no HTML, região `southamerica-east1`, provedor Authentication E-mail/Senha e domínios autorizados. A região das funções e do cliente deve coincidir.
- Verificar permissões IAM e requisitos de faturamento/quotas para Cloud Functions. O serviço de rotas público OSRM tem disponibilidade limitada e não foi consultado pelos testes.
- Revisar a mudança simultânea de frontend, funções e regras; o frontend não utiliza escrita direta alternativa quando a função falha.
- Guardar as versões atuais de regras/código para rollback. Uma reversão de regras não pode reabrir escritas inseguras em corridas/reservas.

## Comandos somente para depois de confirmação

O pacote não contém `.firebaserc` vinculando automaticamente a um projeto real. Substituir `ID_CONFIRMADO` somente após confirmar o projeto e a publicação.

```sh
npm run build:web
npx firebase login
npx firebase deploy --project ID_CONFIRMADO --only functions,firestore:rules
npx firebase deploy --project ID_CONFIRMADO --only hosting
```

`build:web` gera `web-dist` contendo somente `index.html` e `driver-settings.js`; não hospeda backend, regras ou testes. A configuração `firebase.json` já usa essa pasta. Os comandos de deploy NÃO foram executados nesta tarefa. Após publicação autorizada, realizar o roteiro físico em duas contas e conferir rollback/recuperação de corridas abandonadas antes de uso ampliado.

## Escopo dos testes do Emulator

Os testes executados compilam/aplicam as regras apenas no Firestore Emulator e chamam o serviço de domínio com o SDK Admin apontando para esse emulador. Exercitam transações reais do emulador, não o adaptador em memória. O wrapper callable, autenticação real, rede OSRM e hospedagem de produção não são exercitados por essa suíte.
