from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas import ReconcileRequest, Transaction


def test_transaction_parses_iso_date():
    transaction = Transaction(
        external_id="a1",
        source="agrotis",
        date="2026-09-10",
        amount=15000,
        type="credit",
        description="Venda",
    )
    assert transaction.date == date(2026, 9, 10)
    assert transaction.document_number is None


def test_transaction_rejects_negative_amount():
    with pytest.raises(ValidationError):
        Transaction(
            external_id="a1",
            source="agrotis",
            date="2026-09-10",
            amount=-1,
            type="credit",
            description="Venda",
        )


def test_transaction_rejects_unknown_type():
    with pytest.raises(ValidationError):
        Transaction(
            external_id="a1",
            source="agrotis",
            date="2026-09-10",
            amount=1,
            type="transfer",
            description="Venda",
        )


def test_request_defaults_tolerance_to_two_days():
    request = ReconcileRequest(
        agrotis=[],
        sicredi=[],
        balances={"agrotis": 0, "sicredi": 0},
    )
    assert request.rules.date_tolerance_days == 2
