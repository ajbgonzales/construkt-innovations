from datetime import datetime

import httpx
import pandas as pd

PROJECT = "Test Project"
# A Monday-to-Friday work week.
WEEK_START = datetime(2026, 9, 7)
WEEK_END = datetime(2026, 9, 11)


def employee_payload(
    employee_id: str = "1001",
    full_name: str = "Alice Active",
    email_address: str | None = "alice@example.test",
    is_active: bool | None = None,
    **overrides,
) -> dict:
    payload = {
        "fullName": full_name,
        "emailAddress": email_address,
        "contactNumber": "",
        "employeeId": employee_id,
        "project": PROJECT,
        "position": "Laborer",
        "rate": 600,
        "allowance": 50,
        "sss": 100,
        "hdmf": 50,
        "phic": 75,
        "others": 20,
        **overrides,
    }
    if is_active is not None:
        payload["isActive"] = is_active
    return payload


async def create_employee(client: httpx.AsyncClient, **kwargs) -> dict:
    response = await client.post("/api/employees", json=employee_payload(**kwargs))
    assert response.status_code == 201, response.text
    return response.json()


async def set_employee_active(
    client: httpx.AsyncClient, employee: dict, is_active: bool
) -> dict:
    payload = employee_payload(
        employee_id=employee["employeeId"],
        full_name=employee["fullName"],
        email_address=employee["emailAddress"],
        is_active=is_active,
    )
    response = await client.put(f"/api/employees/{employee['id']}", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def attendance_df(people: list[tuple[str, str]]) -> pd.DataFrame:
    """Builds the minimal attendance-sheet shape _get_employee_records reads.

    Each employee is a "User ID:" row carrying their name, department and ID,
    followed by two time-log rows. Tests stub out the time-log parsing, so
    those rows are left empty.
    """
    rows = []
    for employee_id, full_name in people:
        rows.append(
            [
                "Department:",
                "Laborer",
                None,
                "User ID:",
                employee_id,
                "Name:",
                full_name,
            ]
        )
        rows.append([None] * 7)
        rows.append([None] * 7)
    # _get_employee_records never looks at the last row.
    rows.append([None] * 7)
    return pd.DataFrame(rows, columns=[f"col_{i}" for i in range(1, 8)])
