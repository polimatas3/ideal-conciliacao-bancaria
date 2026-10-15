from app.reconcile import reconcile
from app.schemas import Balances, Rules, Transaction


def tx(source, external_id, date, amount, type="credit", document_number=None):
    return Transaction(
        external_id=external_id,
        source=source,
        date=date,
        amount=amount,
        type=type,
        description=f"{source} {external_id}",
        document_number=document_number,
    )


def agrotis(*args, **kwargs):
    return tx("agrotis", *args, **kwargs)


def sicredi(*args, **kwargs):
    return tx("sicredi", *args, **kwargs)


def run(agrotis_list, sicredi_list, tolerance=2, balances=(0, 0)):
    return reconcile(
        agrotis_list,
        sicredi_list,
        Rules(date_tolerance_days=tolerance),
        Balances(agrotis=balances[0], sicredi=balances[1]),
    )


def pairs(result):
    return [(m.agrotis_external_id, m.sicredi_external_id) for m in result.matches]


def test_matches_same_amount_type_and_date():
    result = run([agrotis("a1", "2026-09-10", 15000)], [sicredi("s1", "2026-09-10", 15000)])
    assert pairs(result) == [("a1", "s1")]
    assert result.only_agrotis == []
    assert result.only_sicredi == []
    assert result.summary.matched == 1


def test_different_amount_does_not_match():
    result = run([agrotis("a1", "2026-09-10", 15000)], [sicredi("s1", "2026-09-10", 15001)])
    assert pairs(result) == []
    assert result.only_agrotis == ["a1"]
    assert result.only_sicredi == ["s1"]


def test_same_amount_different_type_does_not_match():
    result = run(
        [agrotis("a1", "2026-09-10", 15000, type="credit")],
        [sicredi("s1", "2026-09-10", 15000, type="debit")],
    )
    assert pairs(result) == []
    assert result.only_agrotis == ["a1"]
    assert result.only_sicredi == ["s1"]


def test_balance_difference_is_agrotis_minus_sicredi():
    result = run([], [], balances=(120000, 118500))
    assert result.balance_difference == 1500
    assert result.summary.matched == 0


def test_matches_within_tolerance_window():
    result = run([agrotis("a1", "2026-09-10", 15000)], [sicredi("s1", "2026-09-12", 15000)], tolerance=2)
    assert pairs(result) == [("a1", "s1")]


def test_does_not_match_outside_tolerance_window():
    result = run([agrotis("a1", "2026-09-10", 15000)], [sicredi("s1", "2026-09-13", 15000)], tolerance=2)
    assert pairs(result) == []
    assert result.only_agrotis == ["a1"]
    assert result.only_sicredi == ["s1"]


def test_tolerance_zero_only_matches_same_date():
    result = run([agrotis("a1", "2026-09-10", 15000)], [sicredi("s1", "2026-09-11", 15000)], tolerance=0)
    assert pairs(result) == []


def test_prefers_nearest_date():
    result = run(
        [agrotis("a1", "2026-09-10", 15000)],
        [sicredi("s1", "2026-09-12", 15000), sicredi("s2", "2026-09-11", 15000)],
    )
    assert pairs(result) == [("a1", "s2")]
    assert result.only_sicredi == ["s1"]


def test_exact_date_wins_over_tolerance_for_competing_transactions():
    result = run(
        [agrotis("a1", "2026-09-10", 15000), agrotis("a2", "2026-09-12", 15000)],
        [sicredi("s1", "2026-09-12", 15000), sicredi("s2", "2026-09-10", 15000)],
    )
    assert sorted(pairs(result)) == [("a1", "s2"), ("a2", "s1")]


def test_identical_same_day_transactions_pair_deterministically():
    result = run(
        [agrotis("a2", "2026-09-10", 15000), agrotis("a1", "2026-09-10", 15000)],
        [sicredi("s2", "2026-09-10", 15000), sicredi("s1", "2026-09-10", 15000)],
    )
    assert pairs(result) == [("a1", "s1"), ("a2", "s2")]


def test_leftovers_are_sorted_by_date_then_id():
    result = run(
        [agrotis("a2", "2026-09-11", 100), agrotis("a1", "2026-09-11", 200), agrotis("a0", "2026-09-12", 300)],
        [],
    )
    assert result.only_agrotis == ["a1", "a2", "a0"]


def test_document_number_breaks_ties_on_same_date():
    result = run(
        [agrotis("a1", "2026-09-10", 15000), agrotis("a2", "2026-09-10", 15000, document_number="100")],
        [sicredi("s1", "2026-09-10", 15000, document_number="100"), sicredi("s2", "2026-09-10", 15000)],
    )
    assert sorted(pairs(result)) == [("a1", "s2"), ("a2", "s1")]


def test_document_number_beats_nearer_date():
    result = run(
        [agrotis("a1", "2026-09-10", 15000, document_number="100")],
        [sicredi("s1", "2026-09-10", 15000, document_number="200"), sicredi("s2", "2026-09-12", 15000, document_number="100")],
    )
    assert pairs(result) == [("a1", "s2")]
    assert result.only_sicredi == ["s1"]


def test_document_number_still_respects_tolerance():
    result = run(
        [agrotis("a1", "2026-09-10", 15000, document_number="100")],
        [sicredi("s1", "2026-09-20", 15000, document_number="100")],
        tolerance=2,
    )
    assert pairs(result) == []


def test_mismatched_document_numbers_fall_back_to_date_pass():
    result = run(
        [agrotis("a1", "2026-09-10", 15000, document_number="100")],
        [sicredi("s1", "2026-09-10", 15000, document_number="999")],
    )
    assert pairs(result) == [("a1", "s1")]


def test_balance_difference_is_none_when_a_side_has_no_balance():
    result = reconcile([], [], Rules(date_tolerance_days=2), Balances(agrotis=1000, sicredi=None))
    assert result.balance_difference is None


def test_balance_difference_is_none_when_balances_are_absent():
    result = reconcile([], [], Rules(date_tolerance_days=2), None)
    assert result.balance_difference is None
