from fastapi import FastAPI

from app.reconcile import reconcile
from app.schemas import ReconcileRequest, ReconcileResponse

app = FastAPI(title="Conciliação — Engine", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/reconcile", response_model=ReconcileResponse)
def reconcile_endpoint(request: ReconcileRequest) -> ReconcileResponse:
    return reconcile(request.agrotis, request.sicredi, request.rules, request.balances)
