from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_reconcile_returns_matches_and_summary():
    payload = {
        "agrotis": [
            {"external_id": "a1", "source": "agrotis", "date": "2026-09-10", "amount": 15000, "type": "credit", "description": "Venda"},
            {"external_id": "a2", "source": "agrotis", "date": "2026-09-10", "amount": 9900, "type": "debit", "description": "Frete"},
        ],
        "sicredi": [
            {"external_id": "s1", "source": "sicredi", "date": "2026-09-11", "amount": 15000, "type": "credit", "description": "PIX REC"},
            {"external_id": "s2", "source": "sicredi", "date": "2026-09-10", "amount": 5000, "type": "debit", "description": "TARIFA"},
        ],
        "rules": {"date_tolerance_days": 2},
        "balances": {"agrotis": 100000, "sicredi": 95000},
    }
    response = client.post("/reconcile", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["matches"] == [{"agrotis_external_id": "a1", "sicredi_external_id": "s1"}]
    assert body["only_agrotis"] == ["a2"]
    assert body["only_sicredi"] == ["s2"]
    assert body["balance_difference"] == 5000
    assert body["summary"] == {"matched": 1, "only_agrotis": 1, "only_sicredi": 1}


def test_reconcile_rejects_invalid_payload():
    response = client.post("/reconcile", json={"agrotis": [], "sicredi": [{"external_id": "s1"}]})
    assert response.status_code == 422


def test_reconcile_rejects_a_missing_side():
    response = client.post("/reconcile", json={"agrotis": []})
    assert response.status_code == 422


def test_reconcile_accepts_a_missing_balance():
    payload = {
        "agrotis": [],
        "sicredi": [],
        "balances": {"agrotis": 1000, "sicredi": None},
    }
    response = client.post("/reconcile", json=payload)
    assert response.status_code == 200
    assert response.json()["balance_difference"] is None


def test_reconcile_accepts_no_balances_at_all():
    response = client.post("/reconcile", json={"agrotis": [], "sicredi": []})
    assert response.status_code == 200
    assert response.json()["balance_difference"] is None
