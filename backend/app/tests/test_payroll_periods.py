import uuid

import pytest
from orm import Payslip
from services.payroll import persist_payroll_records
from services.spreadsheet_processor import _get_employee_records
from sqlalchemy import select

from tests.helpers import (
    PROJECT,
    WEEK_END,
    WEEK_START,
    attendance_df,
    create_employee,
    set_employee_active,
)

pytestmark = pytest.mark.usefixtures("stub_full_day_hours")


@pytest.fixture
async def alice(client):
    return await create_employee(
        client,
        employee_id="1001",
        full_name="Alice Active",
        email_address="alice@example.test",
    )


@pytest.fixture
async def bob(client):
    return await create_employee(
        client,
        employee_id="1002",
        full_name="Bob Active",
        email_address="bob@example.test",
    )


@pytest.fixture
async def period_id(db, alice, bob) -> str:
    records = await _get_employee_records(
        attendance_df([("1001", "Alice Active"), ("1002", "Bob Active")]),
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
    period = await persist_payroll_records(records, db)
    await db.commit()
    return str(period.id)


async def _generate(client, period_id) -> list[dict]:
    response = await client.post(f"/api/payroll-periods/{period_id}/payslips")
    assert response.status_code == 200, response.text
    return response.json()


async def _listed_payslip_names(client, period_id) -> list[str]:
    response = await client.get(f"/api/payroll-periods/{period_id}/payslips")
    assert response.status_code == 200, response.text
    return sorted(p["employeeFullName"] for p in response.json())


async def _payslip_id_for(db, employee) -> str:
    result = await db.execute(
        select(Payslip.id).where(Payslip.employee_id == uuid.UUID(employee["id"]))
    )
    return str(result.scalar_one())


async def test_period_detail_lists_records_with_employee_names(client, period_id):
    response = await client.get(f"/api/payroll-periods/{period_id}")

    assert response.status_code == 200, response.text
    detail = response.json()
    assert detail["id"] == period_id
    assert detail["startDate"] == "2026-09-07"
    assert detail["endDate"] == "2026-09-11"
    assert sorted(r["employeeFullName"] for r in detail["payrollRecords"]) == [
        "Alice Active",
        "Bob Active",
    ]


async def test_period_detail_hides_inactive_employees(client, period_id, bob):
    await set_employee_active(client, bob, False)

    response = await client.get(f"/api/payroll-periods/{period_id}")

    names = [r["employeeFullName"] for r in response.json()["payrollRecords"]]
    assert names == ["Alice Active"]


async def test_period_detail_returns_404_for_unknown_period(client):
    response = await client.get(f"/api/payroll-periods/{uuid.uuid4()}")

    assert response.status_code == 404


async def test_generate_payslips_skips_inactive_employees(client, period_id, bob):
    await set_employee_active(client, bob, False)

    payslips = await _generate(client, period_id)

    assert [p["employeeFullName"] for p in payslips] == ["Alice Active"]


async def test_payslip_list_hides_inactive_employees(client, period_id, bob):
    await _generate(client, period_id)
    assert await _listed_payslip_names(client, period_id) == [
        "Alice Active",
        "Bob Active",
    ]

    await set_employee_active(client, bob, False)
    assert await _listed_payslip_names(client, period_id) == ["Alice Active"]

    await set_employee_active(client, bob, True)
    assert await _listed_payslip_names(client, period_id) == [
        "Alice Active",
        "Bob Active",
    ]


async def test_send_single_payslip_refuses_inactive_employee(
    client, db, period_id, bob, sent_emails
):
    await _generate(client, period_id)
    await set_employee_active(client, bob, False)
    payslip_id = await _payslip_id_for(db, bob)

    response = await client.post(
        f"/api/payroll-periods/{period_id}/payslips/{payslip_id}/send"
    )

    assert response.status_code == 400
    assert "inactive" in response.json()["detail"]
    assert sent_emails == []


async def test_send_single_payslip_emails_active_employee(
    client, db, period_id, alice, sent_emails
):
    await _generate(client, period_id)
    payslip_id = await _payslip_id_for(db, alice)

    response = await client.post(
        f"/api/payroll-periods/{period_id}/payslips/{payslip_id}/send"
    )

    assert response.status_code == 200, response.text
    assert response.json()["sentAt"] is not None
    assert sent_emails == ["alice@example.test"]


async def test_send_all_payslips_skips_inactive_employees(
    client, period_id, bob, sent_emails
):
    await _generate(client, period_id)
    await set_employee_active(client, bob, False)

    response = await client.post(f"/api/payroll-periods/{period_id}/payslips/send")

    assert response.status_code == 200, response.text
    assert response.json() == {"sent": ["Alice Active"], "skipped": [], "failed": []}
    assert sent_emails == ["alice@example.test"]
