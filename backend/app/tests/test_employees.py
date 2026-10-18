from tests.helpers import PROJECT, create_employee, set_employee_active

IMPORT_HEADER = (
    "full_name,employee_id,project,position,rate,allowance,sss,hdmf,phic,others"
)


async def _import_csv(client, csv: str):
    return await client.post(
        "/api/employees/import", files={"file": ("employees.csv", csv, "text/csv")}
    )


async def _employees_by_id(client) -> dict[str, dict]:
    response = await client.get("/api/employees")
    return {e["employeeId"]: e for e in response.json()}


async def test_create_employee_defaults_to_active(client):
    employee = await create_employee(client)

    assert employee["isActive"] is True


async def test_create_employee_can_start_inactive(client):
    employee = await create_employee(client, is_active=False)

    assert employee["isActive"] is False
    response = await client.get(f"/api/employees/{employee['id']}")
    assert response.json()["isActive"] is False


async def test_update_employee_toggles_active(client):
    employee = await create_employee(client)

    assert (await set_employee_active(client, employee, False))["isActive"] is False
    assert (await set_employee_active(client, employee, True))["isActive"] is True


async def test_import_without_is_active_column_creates_active_employees(client):
    csv = f"{IMPORT_HEADER}\nDan Import,2001,{PROJECT},Laborer,500,0,0,0,0,0\n"

    response = await _import_csv(client, csv)

    assert response.status_code == 200, response.text
    assert response.json() == {"created": 1, "failed": []}
    assert (await _employees_by_id(client))["2001"]["isActive"] is True


async def test_import_ignores_is_active_columns(client):
    csv = (
        f"{IMPORT_HEADER},is_active,isActive\n"
        f"Eve Import,2002,{PROJECT},Laborer,500,0,0,0,0,0,,\n"
        f"Fay Import,2003,{PROJECT},Laborer,500,0,0,0,0,0,False,False\n"
    )

    response = await _import_csv(client, csv)

    assert response.status_code == 200, response.text
    assert response.json() == {"created": 2, "failed": []}
    employees = await _employees_by_id(client)
    assert employees["2002"]["isActive"] is True
    assert employees["2003"]["isActive"] is True
