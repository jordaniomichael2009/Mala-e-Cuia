# GitHub Pages — referência do pacote e atualização autorizada

## Fonte proposta

Branch: `teste-sem-blaze`. Pasta de publicação: **`/docs`**. A `main` não deve receber commits, merge ou arquivos desta revisão. Nenhuma configuração do Pages foi alterada.

A configuração foi conferida nesta tarefa: `teste-sem-blaze /docs`. O push autorizado nesta branch atualiza o site público existente. Não mudar a fonte, não habilitar outro workflow e não alterar a main. A aplicação das regras é separada e está descrita em `ATUALIZACAO-CANCELAMENTO.md`.

Endereço esperado após eventual aprovação: `https://jordaniomichael2009.github.io/Mala-e-Cuia/`. Esse endereço já representa a branch de teste; não é uma prévia independente da publicação atual.

## Lista EXATA do conteúdo estático necessário

| Arquivo no repositório | Arquivo servido na raiz do site | Função |
|---|---|---|
| `docs/index.html` | `index.html` | Interface, CSS embutido, login, GPS e listeners |
| `docs/driver-settings.js` | `driver-settings.js` | Configuração única da conta e controle de versão |
| `docs/firestore-client.js` | `firestore-client.js` | Transações cliente e estimativa |
| `docs/.nojekyll` | marcador do Pages, vazio | Desabilita processamento Jekyll |

Não publicar na pasta `docs`: regras, `firebase.json`, testes, dependências, manifestos de revisão ou documentos administrativos. As três fontes do app também continuam na raiz para desenvolvimento; **não usar a raiz como fonte do Pages** para esta proposta.

`PAGES-MANIFEST.json` contém tamanho e SHA-256 dos quatro arquivos. Não é parte do site. `firestore.rules` precisa ser revisado separadamente no Firebase; colocar esse arquivo no Pages não o aplica e não habilita o app.

Dependências de rede: SDK Firebase em gstatic, Authentication/Firestore do projeto configurado, IBGE, Nominatim, OSRM e links do Google Maps. Não há Functions, build de servidor ou dependência de Blaze para este fluxo dentro das cotas Spark.

## Gerar e verificar sem publicar

```sh
npm ci
npm run prepare:pages
npm run test:pages
npm run test:emulator
```

`prepare:pages` só copia arquivos locais e gera o manifesto. Não chama GitHub/Firebase nem executa push/deploy. `test:pages` verifica o mesmo pacote em `/Mala-e-Cuia/` com requisições externas interceptadas; não abre o projeto Firebase real.

As importações `./driver-settings.js` e `./firestore-client.js` são relativas e funcionam no subdiretório do projeto. CSS original preservado. Sem service worker/cache offline; conferir recarregamento completo nos aparelhos.

## Condições antes de autorizar publicação/regras

1. Ler `COMPATIBILIDADE-LEGADOS.md` e resolver qualquer corrida antiga ativa/reserva órfã nas contas que serão usadas. Duas contas novas de teste evitam reutilizar estado antigo, mas não migram outras contas do projeto.
2. Ler integralmente `firestore.rules` ou `REGRAS-COMPLETAS-FIRESTORE.md`. O arquivo é a proposta correspondente a estes quatro arquivos. Não usar as regras da variante Functions, que negam todas as gravações diretas.
3. Comparar com as regras reais e outras coleções do projeto. Esta proposta nega coleções não descritas. Nenhuma leitura ou alteração do banco real foi feita nesta revisão; o inventário continua pendente.
4. Conferir Authentication E-mail/Senha, projeto do HTML e domínio `jordaniomichael2009.github.io` nos domínios autorizados quando necessário. Não colocar esquema ou `/Mala-e-Cuia/` no campo de domínio.
5. Planejar a aplicação coordenada de cliente/regras, backup e rollback compatível. A antiga interface da main não é compatível para gravar corridas sob estas regras.
6. Somente com confirmação: enviar os arquivos da revisão à branch de teste, aplicar as regras aprovadas separadamente e trocar a fonte Pages para `teste-sem-blaze /docs`. Não executar agora.

## Teste físico e preço

Seguir `TESTES-DOIS-CELULARES.md`, com dois aparelhos e duas contas novas. A estimativa surge no aceite; o motorista consulta as três rotas. Tarifas e fórmula são validadas nas regras, mas as distâncias/GPS do cliente não são verificados por servidor. Não é cotação garantida ou pagamento.


Atualização de cancelamento: publicar a UI foi autorizado após os testes. A ordem ideal é regras novas primeiro e interface depois; sem autenticação Firebase disponível, a interface usa a sondagem de compatibilidade e mantém Cancelar desabilitado sob as regras antigas. Não criar documento de capacidade nem alterar dados para habilitar o recurso.
