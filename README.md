# Conciliação bancária — Ideal × Sicredi

Concilia os lançamentos do ERP contra o extrato do Sicredi, conta a conta: busca os dois
lados por período, bate automaticamente o que corresponde e deixa as sobras disponíveis
para conciliação manual.

## Arquitetura

Três serviços, cada um com uma responsabilidade:

| Serviço | Stack | Papel |
|---|---|---|
| `engine/` | Python · FastAPI | Motor de conciliação puro (`POST /reconcile`). Sem banco, sem conhecer os bancos/ERPs. |
| `backend/` | Node · Express 5 | API REST, integrações, Postgres (Sequelize + umzug), job diário. |
| `apps/web/` | React 19 · Vite · Tailwind 4 · shadcn | Painel interno. |

O contrato entre eles é um lançamento canônico: `externalId`, `source`, `date`,
`amount` (centavos inteiros), `type`, `description`, `documentNumber?`.

```
[job diário | botão na UI]
        ↓
backend ── Sicredi (mTLS) ──┐
        └─ ERP ─────────────┤→ engine /reconcile → batidos | só ERP | só banco | saldo
        ↓                   │
      Postgres ←────────────┘
        ↓
       web
```

## Como rodar

```bash
docker compose up -d --build
```

web `:8080` · backend `:3000` · engine `:8000` · Postgres `:5432`

Para desenvolvimento local, migrações, testes e o diagnóstico da integração Sicredi,
veja [CLAUDE.md](CLAUDE.md).

## Regra de conciliação

Dois lançamentos batem quando têm **o mesmo valor** (em centavos) e **o mesmo tipo**
(crédito/débito), com a data dentro de uma janela de tolerância (padrão: 2 dias, para
cobrir a compensação bancária). O motor roda duas passadas: primeiro pareia por número
de documento, depois pela data mais próxima. Cada execução é um snapshot imutável —
reprocessar um período cria uma nova execução e reaplica os vínculos manuais anteriores.

## Credenciais

Nenhum segredo vive neste repositório. As credenciais ficam em variáveis de ambiente e
os certificados em `secrets/`, fora do controle de versão. Veja `backend/.env.example`.

## Testes

```bash
cd engine && source .venv/bin/activate && pytest   # motor
npm test --workspace=backend                       # unitários
npm run test:integration --workspace=backend       # com Postgres
npm run build:web                                  # front
```
