# Conciliação bancária — Agrotis × Sicredi

Monorepo com três serviços:

- `engine/` — Python/FastAPI. Motor de conciliação puro (`POST /reconcile`). Sem banco.
- `backend/` — Node/Express 5 (ESM JS). API REST, integrações Sicredi/Agrotis, Postgres (Sequelize + umzug), job diário (node-cron).
- `apps/web/` — React 19 + Vite + TS + Tailwind 4 + shadcn (radix-nova). Painel interno.

Contrato compartilhado: lançamento canônico (`externalId`, `source`, `date`, `amount` em centavos inteiros, `type`, `description`, `documentNumber?`). No engine os campos são `snake_case`.

## Comandos

- Tudo em Docker: `docker compose up -d --build` → web `:8080`, backend `:3000`, engine `:8000`, Postgres `:5432`.
- Engine local: `cd engine && source .venv/bin/activate && pytest` / `uvicorn app.main:app --reload --port 8000`
- Backend local (precisa de `docker compose up -d postgres engine`): `npm run dev:backend`
  - `npm test --workspace=backend` (unitários) / `npm run test:integration --workspace=backend` (Postgres `conciliacao_test`)
  - `npm run migrate --workspace=backend` / `npm run seed:demo --workspace=backend` (conta + execução de exemplo)
  - `npm run check:sicredi --workspace=backend -- --ref SICREDI_IDEAL_ARMAZEM` — diagnóstico da integração: valida o par certificado/chave, obtém o token e consulta extrato e saldo reais. Aceita `--from`/`--to` (padrão: ontem).
- Web local: `npm run dev:web` (`:5173`) / `npm run build:web`

## Integrações

Credenciais ficam em env vars do backend em JSON: `bank_accounts.credentials_ref` guarda o **nome** da variável do Sicredi (ex.: `SICREDI_CONTA_PRINCIPAL`); a do Agrotis usa o mesmo nome com prefixo `AGROTIS_`.

```json
{ "clientId": "…", "clientSecret": "…", "certPath": "/app/secrets/x.crt", "keyPath": "/app/secrets/x.key" }
```

Certificados ficam em `secrets/` (fora do git, montado como somente-leitura em `/app/secrets`).

### Sicredi — duas APIs distintas

A credencial escolhe qual API usar, pelo campo `api` (`"contacorrente"`, o padrão, ou `"pix"`), e `sandbox: true` aponta para homologação. Ambas exigem **mTLS**: sem certificado a conexão é recusada.

| | Conta Corrente | Pix |
|---|---|---|
| Base | `mtls-api-parceiro.sicredi.com.br` (sandbox `+/sb`) | `api-pix.sicredi.com.br` (sandbox `api-pix-h.…`) |
| Token | `POST /thirdparty/auth/token`, credenciais **no corpo** | `POST /oauth/token`, credenciais em **Basic auth** |
| Validade do token | 60 min | 5 min |
| Escopos | `contacorrente.extratos.consultar contacorrente.saldo.consultar` | `pix.read` (e os de cobrança, se contratados) |
| Lançamentos | `GET /contacorrente/v1/extratos?dataInicio=&dataFim=&page=&size=` — paginação **0-based**, `externalId` = `idMovimento` | `GET /api/v2/pix?inicio=&fim=&paginacao.paginaAtual=&paginacao.itensPorPagina=` — `externalId` = `endToEndId` |
| Período | datas `YYYY-MM-DD` | instantes **UTC**; o app converte o dia de São Paulo via `saoPauloDayRangeToUtc` |
| Saldo | `GET /contacorrente/v1/saldos` (saldo **atual**); o saldo de fechamento é derivado do extrato (`saldoAnterior + Σ movimentos`) | **não existe** — a run fica sem comparação de saldo (`balanceDifference` nulo) |
| Cobertura | todos os lançamentos da conta | somente Pix recebidos (+ devoluções, como débito) |

Para conciliação bancária completa, **Conta Corrente é a API correta**; a Pix só enxerga recebimentos Pix.

A conta é resolvida pela credencial; `branch`/`accountNumber` são informativos.

**Estado:** o transporte mTLS está validado contra as duas APIs de produção (com certificado o servidor responde `invalid_client` / `Authorization ou certificado inválido`; sem certificado, 403 ou conexão recusada). Falta `clientId`/`clientSecret` e, para a conta Ideal Armazém, o `.crt` emitido — ver `secrets/README.md`.

**Armadilhas documentadas pelo Sicredi** (mapeadas em `sicrediErrors.js` e explicadas pelo diagnóstico): 403 significa falha de mTLS; "thumbprint incorreto" significa que as credenciais foram geradas para outro certificado; "Full authentication is required" e `invalid_client` apontam clientId/secret errados; "Escopo vazio/negado" exige liberação da modalidade pela cooperativa.

### Agrotis — ainda assumido

Endpoints e payloads em `backend/src/integrations/agrotis/` são **suposições** (OAuth2 + JSON paginado) até a documentação chegar; os testes usam fixtures nesse formato.

## Regras

- Valores monetários sempre em centavos inteiros.
- Enums declarados uma vez em `backend/src/config/enums.js`.
- Sem comentários em JS/TS.
- Todo elemento clicável com `cursor-pointer`.
