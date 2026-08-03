import io
import json
import uuid

import pandas as pd
from db import get_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from models.attendance import FilePayload
from models.employee import (
    EmployeeCreate,
    EmployeeImportRowError,
    EmployeeImportSummary,
    EmployeeRead,
)
from models.project import ProjectCreate, ProjectRead
from orm.employee import Employee
from orm.project import Project
from pydantic import ValidationError
from services.spreadsheet_processor import (
    clean_attendance_spreadsheet,
    compile_spreadsheets,
)
from sqlalchemy import select, tuple_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

EMPLOYEE_IMPORT_REQUIRED_COLUMNS = {
    "full_name",
    "employee_id",
    "project",
    "position",
    "rate",
    "allowance",
    "sss",
    "hdmf",
    "phic",
}
EMPLOYEE_IMPORT_NUMERIC_COLUMNS = ["rate", "allowance", "sss", "hdmf", "phic"]
EMPLOYEE_IMPORT_STRING_COLUMNS = [
    "full_name",
    "email_address",
    "contact_number",
    "employee_id",
    "project",
    "position",
]


async def get_or_create_project(name: str, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.name == name))
    project = result.scalar_one_or_none()
    if project is None:
        project = Project(name=name)
        db.add(project)
        await db.flush()
    return project


async def get_or_create_projects(
    names: set[str], db: AsyncSession
) -> dict[str, uuid.UUID]:
    if not names:
        return {}
    result = await db.execute(select(Project).where(Project.name.in_(names)))
    name_to_id = {project.name: project.id for project in result.scalars().all()}
    missing_names = names - name_to_id.keys()
    if new_projects := [Project(name=name) for name in missing_names]:
        db.add_all(new_projects)
        await db.flush()
        for project in new_projects:
            name_to_id[project.name] = project.id
    return name_to_id


@router.get("/projects", response_model=list[ProjectRead])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.name))
    return result.scalars().all()


@router.post("/projects", response_model=ProjectRead, status_code=201)
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Project).where(Project.name == payload.name))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="A project with this name already exists"
        )
    project = Project(name=payload.name)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/employees/{id}", response_model=EmployeeRead)
async def get_employee(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    employee = await db.get(Employee, id)

    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return employee


@router.put("/employees/{id}", response_model=EmployeeRead)
async def update_employee(
    id: uuid.UUID, payload: EmployeeCreate, db: AsyncSession = Depends(get_db)
):
    employee = await db.get(Employee, id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found.")

    project = await get_or_create_project(payload.project, db)
    for field, value in payload.model_dump(exclude={"project"}).items():
        setattr(employee, field, value)
    employee.project_id = project.id

    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An employee with this Employee ID already exists for this project",
        ) from e
    await db.refresh(employee)
    return employee


@router.delete("/employees/{id}", status_code=204)
async def delete_employee(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    employee = await db.get(Employee, id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found.")

    await db.delete(employee)
    await db.commit()


@router.get("/employees", response_model=list[EmployeeRead])
async def list_employees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).order_by(Employee.created_at.desc()))
    return result.scalars().all()


@router.post("/employees", response_model=EmployeeRead, status_code=201)
async def create_employee(payload: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    project = await get_or_create_project(payload.project, db)
    employee = Employee(
        **payload.model_dump(exclude={"project"}), project_id=project.id
    )
    db.add(employee)
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An employee with this Employee ID already exists for this project",
        ) from e
    await db.refresh(employee)
    return employee


@router.post("/employees/import", response_model=EmployeeImportSummary)
async def import_employees(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db)
):
    contents = await file.read()
    filename = (file.filename or "").lower()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=400, detail="Could not read file as CSV or Excel"
        ) from e

    df.columns = [str(column).strip() for column in df.columns]
    missing_columns = EMPLOYEE_IMPORT_REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required column(s): {', '.join(sorted(missing_columns))}",
        )

    for column in EMPLOYEE_IMPORT_NUMERIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    def clean_row(record: dict) -> dict:
        cleaned = {}
        for key, value in record.items():
            if pd.isna(value):
                cleaned[key] = None
            elif key in EMPLOYEE_IMPORT_STRING_COLUMNS:
                cleaned[key] = str(value).strip()
            else:
                cleaned[key] = value
        return cleaned

    failed: list[EmployeeImportRowError] = []
    valid_rows: list[tuple[int, EmployeeCreate]] = []
    seen_keys: set[tuple[str, str]] = set()

    for index, raw_row in enumerate(df.to_dict("records")):
        row = clean_row(raw_row)
        spreadsheet_row = index + 2  # +1 for 0-index, +1 for the header row
        try:
            payload = EmployeeCreate(**row)
        except ValidationError as e:
            first_error = e.errors()[0]
            field = ".".join(str(part) for part in first_error["loc"])
            failed.append(
                EmployeeImportRowError(
                    row=spreadsheet_row, reason=f"{field}: {first_error['msg']}"
                )
            )
            continue

        key = (payload.employee_id, payload.project)
        if key in seen_keys:
            failed.append(
                EmployeeImportRowError(
                    row=spreadsheet_row,
                    reason="Duplicate Employee ID + Project within the file",
                )
            )
            continue
        seen_keys.add(key)
        valid_rows.append((spreadsheet_row, payload))

    project_name_to_id = await get_or_create_projects(
        {payload.project for _, payload in valid_rows}, db
    )

    existing_keys: set[tuple[str, uuid.UUID]] = set()
    if valid_rows:
        result = await db.execute(
            select(Employee.employee_id, Employee.project_id).where(
                tuple_(Employee.employee_id, Employee.project_id).in_(
                    [
                        (payload.employee_id, project_name_to_id[payload.project])
                        for _, payload in valid_rows
                    ]
                )
            )
        )
        existing_keys = {tuple(row) for row in result.all()}

    to_insert = []
    for spreadsheet_row, payload in valid_rows:
        project_id = project_name_to_id[payload.project]
        key = (payload.employee_id, project_id)
        if key in existing_keys:
            failed.append(
                EmployeeImportRowError(
                    row=spreadsheet_row,
                    reason="An employee with this Employee ID already exists for this project",
                )
            )
            continue
        to_insert.append(
            Employee(**payload.model_dump(exclude={"project"}), project_id=project_id)
        )

    db.add_all(to_insert)
    await db.commit()

    return EmployeeImportSummary(created=len(to_insert), failed=failed)


@router.post("/process_attendance_records")
async def process_attendance_records(
    files: list[UploadFile] = File(...),
    projects_metadata: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    metadata = json.loads(projects_metadata)
    parsed_projects_metadata = {
        key: FilePayload(**value).model_dump() for key, value in metadata.items()
    }

    for file in files:
        df = pd.read_excel(file.file)
        df = df.dropna(how="all").dropna(axis=1, how="all")
        await clean_attendance_spreadsheet(
            df, parsed_projects_metadata[file.filename], db
        )

    file_paths = []
    file_paths.extend(
        f"app/records/{value['project_name']}.xlsx"
        for value in parsed_projects_metadata.values()
    )

    buffer = io.BytesIO()
    filename = compile_spreadsheets(file_paths, buffer)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
