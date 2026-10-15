from collections import defaultdict

from app.schemas import Balances, MatchPair, ReconcileResponse, Rules, Summary, Transaction


def reconcile(
    agrotis: list[Transaction],
    sicredi: list[Transaction],
    rules: Rules,
    balances: Balances | None,
) -> ReconcileResponse:
    matches: list[MatchPair] = []
    unmatched_agrotis: list[Transaction] = []
    unmatched_sicredi: list[Transaction] = []

    agrotis_groups = _group_by_amount_and_type(agrotis)
    sicredi_groups = _group_by_amount_and_type(sicredi)

    for key in sorted(agrotis_groups.keys() | sicredi_groups.keys()):
        group_matches, rest_agrotis, rest_sicredi = _match_group(
            agrotis_groups.get(key, []),
            sicredi_groups.get(key, []),
            rules.date_tolerance_days,
        )
        matches.extend(group_matches)
        unmatched_agrotis.extend(rest_agrotis)
        unmatched_sicredi.extend(rest_sicredi)

    return ReconcileResponse(
        matches=matches,
        only_agrotis=[t.external_id for t in _sorted(unmatched_agrotis)],
        only_sicredi=[t.external_id for t in _sorted(unmatched_sicredi)],
        balance_difference=_balance_difference(balances),
        summary=Summary(
            matched=len(matches),
            only_agrotis=len(unmatched_agrotis),
            only_sicredi=len(unmatched_sicredi),
        ),
    )


def _group_by_amount_and_type(transactions: list[Transaction]) -> dict[tuple[int, str], list[Transaction]]:
    groups: dict[tuple[int, str], list[Transaction]] = defaultdict(list)
    for transaction in transactions:
        groups[(transaction.amount, transaction.type)].append(transaction)
    return groups


def _sorted(transactions: list[Transaction]) -> list[Transaction]:
    return sorted(transactions, key=lambda t: (t.date, t.external_id))


def _match_group(
    agrotis_group: list[Transaction],
    sicredi_group: list[Transaction],
    tolerance_days: int,
) -> tuple[list[MatchPair], list[Transaction], list[Transaction]]:
    by_document = _match_nearest(agrotis_group, sicredi_group, tolerance_days, _same_document)
    rest_agrotis, rest_sicredi = _remove_matched(agrotis_group, sicredi_group, by_document)

    by_date = _match_nearest(rest_agrotis, rest_sicredi, tolerance_days, _any_pair)
    rest_agrotis, rest_sicredi = _remove_matched(rest_agrotis, rest_sicredi, by_date)

    return by_document + by_date, rest_agrotis, rest_sicredi


def _same_document(agrotis_tx: Transaction, sicredi_tx: Transaction) -> bool:
    return bool(agrotis_tx.document_number) and agrotis_tx.document_number == sicredi_tx.document_number


def _any_pair(agrotis_tx: Transaction, sicredi_tx: Transaction) -> bool:
    return True


def _match_nearest(
    agrotis_list: list[Transaction],
    sicredi_list: list[Transaction],
    tolerance_days: int,
    accept,
) -> list[MatchPair]:
    candidates = sorted(
        (
            (abs((agrotis_tx.date - sicredi_tx.date).days), agrotis_tx, sicredi_tx)
            for agrotis_tx in agrotis_list
            for sicredi_tx in sicredi_list
            if accept(agrotis_tx, sicredi_tx)
        ),
        key=lambda c: (c[0], c[1].date, c[1].external_id, c[2].external_id),
    )
    used_agrotis: set[str] = set()
    used_sicredi: set[str] = set()
    matches: list[MatchPair] = []
    for distance, agrotis_tx, sicredi_tx in candidates:
        if distance > tolerance_days:
            break
        if agrotis_tx.external_id in used_agrotis or sicredi_tx.external_id in used_sicredi:
            continue
        used_agrotis.add(agrotis_tx.external_id)
        used_sicredi.add(sicredi_tx.external_id)
        matches.append(MatchPair(agrotis_external_id=agrotis_tx.external_id, sicredi_external_id=sicredi_tx.external_id))
    return matches


def _remove_matched(
    agrotis_list: list[Transaction],
    sicredi_list: list[Transaction],
    matches: list[MatchPair],
) -> tuple[list[Transaction], list[Transaction]]:
    matched_agrotis = {m.agrotis_external_id for m in matches}
    matched_sicredi = {m.sicredi_external_id for m in matches}
    return (
        [t for t in agrotis_list if t.external_id not in matched_agrotis],
        [t for t in sicredi_list if t.external_id not in matched_sicredi],
    )


def _balance_difference(balances: Balances | None) -> int | None:
    if balances is None or balances.agrotis is None or balances.sicredi is None:
        return None
    return balances.agrotis - balances.sicredi
