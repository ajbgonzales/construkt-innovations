from io import BytesIO

import pandas as pd
import pytest
from orm import PayrollRecord
from services.payroll import persist_payroll_records
from services.spreadsheet_processor import (
    _create_cleaned_spreadsheet,
    _get_employee_records,
    compile_spreadsheets,
)
from sqlalchemy import select

from tests.helpers import PROJECT, WEEK_END, WEEK_START, attendance_df, create_employee

pytestmark = pytest.mark.usefixtures("stub_full_day_hours")

WORK_DAYS = 5


async def _process(db, people):
    return await _get_employee_records(
        attendance_df(people),
        PROJECT,
        WEEK_START,
        WEEK_END,
        "08:00",
        "17:00",
        False,
        "12:00",
        False,
        False,
        db,
    )


def _rows_for(records, employee_id: str):
    return [r for r in records if r.employee_id == int(employee_id)]


@pytest.fixture
async def employees(client):
    alice = await create_employee(client, employee_id="1001", full_name="Alice Active")
    cara = await create_employee(
        client, employee_id="1003", full_name="Cara Inactive", is_active=False
    )
    return alice, cara


async def test_inactive_employee_is_flagged_not_skipped(db, employees):
    records = await _process(db, [("1003", "Cara Inactive")])

    rows = _rows_for(records, "1003")
    assert len(rows) == WORK_DAYS
    for row in rows:
        assert row.is_flagged == "Yes"
        assert row.notes == "Employee is inactive."
        assert row.work_hours == 0
        assert row.overtime_hours == 0


async def test_inactive_employee_has_no_pay_or_deductions(db, employees):
    records = await _process(db, [("1003", "Cara Inactive")])

    for row in _rows_for(records, "1003"):
        assert (row.rate, row.allowance, row.sss, row.hdmf, row.phic, row.others) == (
            0,
            0,
            0,
            0,
            0,
            0,
        )
        assert row.employee_uuid is None


async def test_unknown_employee_is_flagged_as_not_found(db, employees):
    records = await _process(db, [("9999", "Nobody Known")])

    rows = _rows_for(records, "9999")
    assert len(rows) == WORK_DAYS
    assert all(r.notes == "Employee profile not found." for r in rows)


async def test_active_employee_is_unaffected(db, employees):
    records = await _process(db, [("1001", "Alice Active")])

    rows = _rows_for(records, "1001")
    assert len(rows) == WORK_DAYS
    for row in rows:
        assert row.is_flagged == "No"
        assert row.work_hours == 8.0
        assert row.rate == 600
        assert row.employee_uuid is not None


async def test_no_payroll_record_is_persisted_for_inactive_employee(db, employees):
    alice, cara = employees
    records = await _process(db, [("1001", "Alice Active"), ("1003", "Cara Inactive")])

    period = await persist_payroll_records(records, db)
    await db.commit()

    result = await db.execute(
        select(PayrollRecord.employee_id).where(
            PayrollRecord.payroll_period_id == period.id
        )
    )
    persisted = {str(employee_id) for employee_id in result.scalars()}
    assert persisted == {alice["id"]}
    assert cara["id"] not in persisted


async def test_cleaned_spreadsheet_lists_inactive_employee_with_note(db, employees):
    records = await _process(db, [("1001", "Alice Active"), ("1003", "Cara Inactive")])

    cleaned = pd.read_excel(_create_cleaned_spreadsheet(records, PROJECT))

    as_text = cleaned.astype(str)
    cara_rows = cleaned[
        as_text.apply(lambda c: c.str.contains("Cara Inactive")).any(axis=1)
    ]
    assert len(cara_rows) == 1
    assert (
        cara_rows.astype(str)
        .apply(lambda c: c.str.contains("Employee is inactive.", regex=False))
        .any(axis=None)
    )


async def test_cleaned_spreadsheet_uses_other_loans_column(db, employees):
    records = await _process(db, [("1001", "Alice Active")])

    cleaned = pd.read_excel(_create_cleaned_spreadsheet(records, PROJECT))

    assert "Other Loans" in cleaned.columns
    assert "Others" not in cleaned.columns


async def test_cleaned_spreadsheets_compile(db, employees):
    records = await _process(db, [("1001", "Alice Active"), ("1003", "Cara Inactive")])
    buffer = BytesIO()

    filename = compile_spreadsheets(
        [_create_cleaned_spreadsheet(records, PROJECT)], buffer
    )

    assert filename
    assert buffer.getbuffer().nbytes > 0
