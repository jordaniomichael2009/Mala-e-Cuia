# Configurar e revisar a variante sem Blaze/Cloud Functions

## Estado atual

Código preparado para revisão na branch `teste-sem-blaze`, sem merge, deploy, publicação no Pages ou alteração do Firebase real. A branch `teste-mala-cuia-3`, commit `7f60b97`, preserva a versão anterior com Functions.

## Configuração local

1. Instalar Node 22+ e Java 21. Na raiz, executar `npm ci`.
2. Se não houver Chromium de sistema, executar `npx playwright install chromium`.
3. Executar `npm run test:unit`, `npm run test:browser`, `npm run test:emulator` e `npm run build:web`.
4. O Emulator usa somente `demo-mala-e-cuia` e `127.0.0.1`, com proteção contra execução da suíte em projeto real. Pode baixar o JAR na primeira execução. Não precisa de login Firebase, Functions ou Blaze.
5. Em ambiente com cache restrito, apontar caches para diretórios graváveis:

```sh
FIREBASE_EMULATORS_PATH="$PWD/.emulator-cache" XDG_CONFIG_HOME="$PWD/.firebase-cli-config" npm run test:emulator
```

O teste de navegador usa mocks para todo tráfego externo. O de Emulator usa transações reais do SDK cliente e regras reais no emulador. Não abrir o HTML diretamente supondo que está conectado ao Emulator: o HTML mantém a configuração original do Firebase; a abertura manual não está configurada automaticamente para emuladores.

## Esquema proposto

- `perfis/{uid}`: nome, tipo autodeclarado, veículo e timestamp.
- `config_motoristas/{uid}`: base, posição, horário da posição, tarifas em centavos, veículo, versão inteira e timestamp. Leitura/escrita só pelo titular, sem corrida ativa.
- `disponibilidades/{uid}`: disponível e timestamp. Alteração durante aceite/conclusão exige os documentos pareados.
- `corridas_teste/{id}`: participantes imutáveis, dados de embarque/destino, etapas e estimativa. Nasce sem estimativa; é calculada no celular do motorista no aceite.
- `motoristas_ativos/{uid}`: reserva única por motorista. Só pode ser criada junto de um aceite e apagada junto da conclusão; não pode ser atualizada.

A versão anterior de config usava UUID; esta usa versão inteira começando em 1. Dados antigos incompatíveis precisam de plano de migração explícito, ainda não executado. Não sobrescrever contas existentes com valores padrão. Documento antigo sem formato esperado mantém a tela bloqueada. Corridas antigas com `quote` ou status/reserva inconsistentes não foram migradas.

## Revisão obrigatória antes de propor aplicação

Comparar `firestore.rules` desta revisão com as regras existentes e testar em projeto de teste. **Não usar as regras anteriores com `allow write: if false` para corridas/config/reservas**: elas impedem este cliente de funcionar. Não aplicar nenhuma das versões agora.

A nova regra padrão nega outras coleções; avaliar dependências existentes antes de qualquer substituição. Revisar as três operações de aceite/conclusão e os testes adversariais. Conferir cotas do Spark, provedor Auth E-mail/Senha e domínios autorizados. Não é necessário migrar para Blaze para o fluxo proposto dentro das cotas gratuitas.

## Preparação atual: GitHub Pages, sem publicar

Consultar `PUBLICACAO-PAGES-REVISAO.md`. A fonte proposta é `teste-sem-blaze /docs`, sem merge na main. Gerar com `npm run prepare:pages` e testar com `npm run test:pages`. As regras completas estão em `firestore.rules` e `REGRAS-COMPLETAS-FIRESTORE.md` e exigem revisão separada; não são parte do site estático.

Nenhuma configuração do Pages ou regra foi alterada. Não executar push, trocar a fonte do Pages ou aplicar regras sem confirmação. A troca futura da fonte afetaria o site público existente; não é um ambiente paralelo. Também é necessário resolver `COMPATIBILIDADE-LEGADOS.md` antes de reutilizar contas antigas.

## Limite do preço

O celular do motorista calcula `GPS → embarque`, `embarque → destino` e `destino → base`. As regras validam tarifas, fórmula e limites numéricos, **não a veracidade das distâncias ou GPS**. Estimativa aparece ao passageiro após o aceite; não há aprovação prévia do valor pelo passageiro, pagamento ou cobrança. Não usar como preço garantido.


## Atualização de cancelamento

O Pages já usa `teste-sem-blaze /docs`; push nessa branch publica a UI. Não alterar a fonte ou a main. O cancelamento acrescenta regras compatíveis com o cliente anterior. Ver `ATUALIZACAO-CANCELAMENTO.md`: ordem preferencial regras primeiro; sem autenticação Firebase, entregar o arquivo exato para aplicação manual e publicar UI com sondagem de compatibilidade. Nenhum documento de capacidade precisa ser criado. Não mudar plano, excluir registros ou usar Functions.
