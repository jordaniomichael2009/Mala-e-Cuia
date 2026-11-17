# Resultados da revisão local

## Unidade e navegador

- `npm run test:unit`: 15 testes, 15 aprovados. Nove de backend com banco/rotas simulados; seis do controlador de configuração (bloqueio antes da leitura, offline, troca de conta, conta nova sem padrões, conflito entre dispositivos e configuração inválida).
- `npm run test:browser`: três sessões isoladas de Chromium (passageiro + dois aparelhos simulados do mesmo motorista), viewport 390 × 844. Aprovado: Conta/Painel unificados, restauração ignorando localStorage antigo, rejeição de salvamento antigo, recarregamento da versão atual, envio, aceite, embarque, conclusão e histórico. Sem acesso a Firebase real ou outros serviços; todas as requisições externas interceptadas.

## Firestore Emulator — execução realizada

Comando executado:

```
FIREBASE_EMULATORS_PATH=/workspace/work/firebase-emulators XDG_CONFIG_HOME=/workspace/work/firebase-config npm run test:emulator
```

Firebase CLI 14, Firestore Emulator JAR 1.19.8, Java 21, projeto **demo-mala-e-cuia**, host 127.0.0.1. Resultado: **5 testes, 5 aprovados**; processo terminou com código 0 e emulador foi encerrado.

1. Regras: perfil e configuração privados; terceiros e não autenticados não acessam nem alteram conta alheia.
2. Regras: participantes leem a corrida e consultas filtradas; terceiros não leem/listam corridas.
3. Regras: mesmo os participantes não alteram preço, participantes ou etapas diretamente; não criam/apagam corridas/configuração/reservas pelo SDK cliente.
4. Transações no Firestore Emulator: dois aceites concorrentes sobre pedidos diferentes resultam em uma única reserva; alteração de disponibilidade/perfil durante corrida é negada; salto de etapa e usuário indevido são recusados; falha injetada na conclusão mantém corrida/reserva/disponibilidade; sucesso conclui e libera na mesma transação.
5. Transações no Firestore Emulator: gravações concorrentes de configuração com a mesma versão permitem apenas uma; a outra é rejeitada com `aborted` e não substitui os dados confirmados.

## Limites

Emulador não equivale a Firebase de produção. Não houve teste físico, autenticação real, wrapper callable pela rede, serviço OSRM real, Google Maps nativo, IAM ou deploy. O teste usa rotas determinísticas injetadas no serviço. A posição do motorista continua pontual, válida por até quinze minutos. Não há cancelamento/recuperação administrativa de corridas abandonadas nem despacho automático.

O primeiro comando de instalação npm falhou por cache não gravável; a instalação foi concluída com cache na pasta de trabalho. Não há bloqueio remanescente na execução dos testes do Emulator.
