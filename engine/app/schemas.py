from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

Source = Literal["agrotis", "sicredi"]
TransactionType = Literal["credit", "debit"]


class Transaction(BaseModel):
    external_id: str
    source: Source
    date: date
    amount: int = Field(ge=0)
    type: TransactionType
    description: str = ""
    document_number: str | None = None


class Rules(BaseModel):
    date_tolerance_days: int = Field(default=2, ge=0)


class Balances(BaseModel):
    agrotis: int | None = None
    sicredi: int | None = None


class ReconcileRequest(BaseModel):
    agrotis: list[Transaction]
    sicredi: list[Transaction]
    rules: Rules = Field(default_factory=Rules)
    balances: Balances = Field(default_factory=Balances)


class MatchPair(BaseModel):
    agrotis_external_id: str
    sicredi_external_id: str


class Summary(BaseModel):
    matched: int
    only_agrotis: int
    only_sicredi: int


class ReconcileResponse(BaseModel):
    matches: list[MatchPair]
    only_agrotis: list[str]
    only_sicredi: list[str]
    balance_difference: int | None
    summary: Summary
