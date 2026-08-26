import io
import json
import os
import uuid
from datetime import datetime, timezone

import pandas as pd
from db import get_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse
from models.attendance import FilePayload
from models.employee import (
    EmployeeCreate,
    EmployeeImportRowError,
    EmployeeImportSummary,
    EmployeeRead,
)
from models.holiday import HolidayCreate, HolidayRead
from models.overtime_request import OvertimeRequestCreate, OvertimeRequestRead
from models.payroll import (
    PayrollPeriodDetailRead,
    PayrollPeriodRead,
    PayslipRead,
    SendPayslipsResult,
)
from models.project import ProjectCreate, ProjectRead
from orm.employee import Employee
from orm.holiday import Holiday
from orm.overtime_request import OvertimeRequest
from orm.payroll_period import PayrollPeriod
from orm.payslip import Payslip
from orm.project import Project
from pydantic import ValidationError
from services.payroll import (
    delete_payroll_records_outside_projects,
    generate_payslips_for_period,
)
from services.payslip_email import send_payslip_email
from services.payslip_pdf import render_payslip_pdf
from services.spreadsheet_processor import (
    clean_attendance_spreadsheet,
    compile_spreadsheets,
    get_attendance_date_range,
)
from sqlalchemy import func, select, text, tuple_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    "others",
}
EMPLOYEE_IMPORT_NUMERIC_COLUMNS = ["rate", "allowance", "sss", "hdmf", "phic", "others"]
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


@router.get("/overtime-requests", response_model=list[OvertimeRequestRead])
async def list_overtime_requests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OvertimeRequest).order_by(OvertimeRequest.created_at.desc())
    )
    return result.unique().scalars().all()


@router.get("/overtime-requests/{id}", response_model=OvertimeRequestRead)
async def get_overtime_request(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    overtime_request = await db.get(OvertimeRequest, id)

    if overtime_request is None:
        raise HTTPException(status_code=404, detail="Overtime Request not found.")
    return overtime_request


@router.delete("/overtime-requests/{id}", status_code=204)
async def delete_overtime_request(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    overtime_request = await db.get(OvertimeRequest, id)
    if overtime_request is None:
        raise HTTPException(status_code=404, detail="Overtime Request not found.")

    await db.delete(overtime_request)
    await db.commit()


@router.post("/overtime-requests", response_model=OvertimeRequestRead, status_code=201)
async def create_overtime_request(
    payload: OvertimeRequestCreate, db: AsyncSession = Depends(get_db)
):
    project = await db.get(Project, payload.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Employee).where(Employee.id.in_(payload.employee_ids))
    )
    employees = result.scalars().all()
    if len(employees) != len(set(payload.employee_ids)):
        raise HTTPException(status_code=404, detail="One or more employees not found")
    if any(employee.project_id != payload.project_id for employee in employees):
        raise HTTPException(
            status_code=400,
            detail="All employees must belong to the selected project",
        )

    overtime_request = OvertimeRequest(
        date=payload.date,
        project_id=payload.project_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        activities=payload.activities,
        employees=employees,
    )
    db.add(overtime_request)
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An overtime request already exists for this date and project",
        ) from e
    await db.refresh(overtime_request)
    return overtime_request


@router.put("/overtime-requests/{id}", response_model=OvertimeRequestRead)
async def update_overtime_request(
    id: uuid.UUID, payload: OvertimeRequestCreate, db: AsyncSession = Depends(get_db)
):
    overtime_request = await db.get(OvertimeRequest, id)
    if overtime_request is None:
        raise HTTPException(status_code=404, detail="Overtime Request not found.")

    project = await db.get(Project, payload.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Employee).where(Employee.id.in_(payload.employee_ids))
    )
    employees = result.scalars().all()
    if len(employees) != len(set(payload.employee_ids)):
        raise HTTPException(status_code=404, detail="One or more employees not found")
    if any(employee.project_id != payload.project_id for employee in employees):
        raise HTTPException(
            status_code=400,
            detail="All employees must belong to the selected project",
        )

    overtime_request.date = payload.date
    overtime_request.project_id = payload.project_id
    overtime_request.start_time = payload.start_time
    overtime_request.end_time = payload.end_time
    overtime_request.activities = payload.activities
    overtime_request.employees = employees

    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An overtime request already exists for this date and project",
        ) from e
    await db.refresh(overtime_request)
    return overtime_request


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

    parsed_files = []
    date_ranges = set()
    for file in files:
        df = pd.read_excel(file.file)
        df = df.dropna(how="all").dropna(axis=1, how="all")
        _, start_date, end_date = get_attendance_date_range(df)
        date_ranges.add((start_date, end_date))
        parsed_files.append((file, df))

    if len(date_ranges) > 1:
        raise HTTPException(
            status_code=400,
            detail="All attendance files must cover the same date range.",
        )

    period = None
    spreadsheets = []
    for file, df in parsed_files:
        file_period, spreadsheet = await clean_attendance_spreadsheet(
            df, parsed_projects_metadata[file.filename], db
        )
        period = file_period or period
        spreadsheets.append(spreadsheet)

    if period is not None:
        # This batch is expected to contain every project for the period,
        # so drop any records left over from projects not in it.
        processed_project_names = {
            value["project_name"].lower() for value in parsed_projects_metadata.values()
        }
        result = await db.execute(
            select(Project.id).where(
                func.lower(Project.name).in_(processed_project_names)
            )
        )
        processed_project_ids = set(result.scalars().all())
        await delete_payroll_records_outside_projects(
            period.id, processed_project_ids, db
        )

    await db.commit()

    buffer = io.BytesIO()
    filename = compile_spreadsheets(spreadsheets, buffer)

    if period is not None:
        period.spreadsheet = buffer.getvalue()
        period.spreadsheet_filename = f"{filename}.xlsx"
        await db.commit()

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/holidays", response_model=list[HolidayRead])
async def list_holidays(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Holiday).order_by(Holiday.date))
    return result.scalars().all()


@router.post("/holidays", response_model=HolidayRead, status_code=201)
async def create_holiday(payload: HolidayCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Holiday).where(Holiday.date == payload.date))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="A holiday already exists for this date"
        )
    holiday = Holiday(**payload.model_dump())
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)
    return holiday


@router.delete("/holidays/{id}", status_code=204)
async def delete_holiday(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    holiday = await db.get(Holiday, id)
    if holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found.")

    await db.delete(holiday)
    await db.commit()


@router.get("/payroll-periods", response_model=list[PayrollPeriodRead])
async def list_payroll_periods(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PayrollPeriod).order_by(PayrollPeriod.start_date.desc())
    )
    return result.scalars().all()


@router.get("/payroll-periods/{id}", response_model=PayrollPeriodDetailRead)
async def get_payroll_period(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PayrollPeriod)
        .options(selectinload(PayrollPeriod.payroll_records))
        .where(PayrollPeriod.id == id)
    )
    period = result.scalar_one_or_none()
    if period is None:
        raise HTTPException(status_code=404, detail="Payroll period not found.")
    return period


@router.get("/payroll-periods/{id}/spreadsheet")
async def download_payroll_spreadsheet(
    id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    period = await db.get(PayrollPeriod, id)
    if period is None:
        raise HTTPException(status_code=404, detail="Payroll period not found.")

    if period.spreadsheet is None:
        raise HTTPException(
            status_code=404,
            detail="No spreadsheet has been generated for this payroll period yet.",
        )

    # Strip the .xlsx we append for storage so the downloaded filename
    # matches exactly what processing produces. Content-Disposition is set
    # explicitly (rather than via a filename= kwarg) to match
    # process_attendance_records' plain-quoted header style, since Starlette
    # switches to RFC 5987 encoding for filenames containing spaces, which
    # the frontend's Content-Disposition parser doesn't handle.
    filename = os.path.splitext(period.spreadsheet_filename)[0]
    return StreamingResponse(
        io.BytesIO(period.spreadsheet),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/payroll-periods/{id}/payslips", response_model=list[PayslipRead])
async def generate_payslips(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PayrollPeriod)
        .options(selectinload(PayrollPeriod.payroll_records))
        .where(PayrollPeriod.id == id)
    )
    period = result.scalar_one_or_none()
    if period is None:
        raise HTTPException(status_code=404, detail="Payroll period not found.")

    payslips = await generate_payslips_for_period(period, db)
    await db.commit()
    for payslip in payslips:
        await db.refresh(payslip)
    return payslips


@router.get("/payroll-periods/{id}/payslips", response_model=list[PayslipRead])
async def list_payslips(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Payslip)
        .where(Payslip.payroll_period_id == id)
        .order_by(Payslip.generated_at.desc())
    )
    return result.scalars().all()


@router.get("/payroll-periods/{id}/payslips/{payslip_id}/pdf")
async def download_payslip_pdf(
    id: uuid.UUID, payslip_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    period = await db.get(PayrollPeriod, id)
    if period is None:
        raise HTTPException(status_code=404, detail="Payroll period not found.")

    payslip = await db.get(Payslip, payslip_id)
    if payslip is None or payslip.payroll_period_id != id:
        raise HTTPException(status_code=404, detail="Payslip not found.")

    pdf_bytes = await render_payslip_pdf(payslip, period, db)
    filename = f"Payslip - {payslip.employee_full_name} - {period.start_date} to {period.end_date}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _send_one_payslip(
    payslip: Payslip, period: PayrollPeriod, db: AsyncSession
) -> None:
    pdf_bytes = await render_payslip_pdf(payslip, period, db)
    await send_payslip_email(
        to_email=payslip.employee_ref.email_address,
        employee_name=payslip.employee_full_name,
        period_start=period.start_date.strftime("%B %d, %Y"),
        period_end=period.end_date.strftime("%B %d, %Y"),
        pdf_bytes=pdf_bytes,
    )
    # Raw SQL so this doesn't also bump generated_at, which has its own
    # onupdate=func.now() that fires on any ORM-tracked write to the row.
    await db.execute(
        text("UPDATE payslips SET sent_at = :sent_at WHERE id = :id"),
        {"sent_at": datetime.now(timezone.utc).replace(tzinfo=None), "id": payslip.id},
    )


@router.post(
    "/payroll-periods/{id}/payslips/{payslip_id}/send", response_model=PayslipRead
)
async def send_payslip(
    id: uuid.UUID, payslip_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    period = await db.get(PayrollPeriod, id)
    if period is None:
        raise HTTPException(status_code=404, detail="Payroll period not found.")

    payslip = await db.get(Payslip, payslip_id)
    if payslip is None or payslip.payroll_period_id != id:
        raise HTTPException(status_code=404, detail="Payslip not found.")

    if not payslip.employee_ref.email_address:
        raise HTTPException(
            status_code=400,
            detail=f"{payslip.employee_full_name} has no email address on file.",
        )

    try:
        await _send_one_payslip(payslip, period, db)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=502, detail=f"Failed to send email: {e}"
        ) from e

    await db.commit()
    await db.refresh(payslip)
    return payslip


@router.post("/payroll-periods/{id}/payslips/send", response_model=SendPayslipsResult)
async def send_payslips(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    period = await db.get(PayrollPeriod, id)
    if period is None:
        raise HTTPException(status_code=404, detail="Payroll period not found.")

    result = await db.execute(select(Payslip).where(Payslip.payroll_period_id == id))
    payslips = result.scalars().all()
    if not payslips:
        raise HTTPException(
            status_code=400,
            detail="No payslips have been generated for this period yet.",
        )

    pending_payslips = [p for p in payslips if p.sent_at is None]

    sent: list[str] = []
    skipped: list[str] = []
    failed: list[str] = []

    for payslip in pending_payslips:
        if not payslip.employee_ref.email_address:
            skipped.append(payslip.employee_full_name)
            continue

        try:
            await _send_one_payslip(payslip, period, db)
        except Exception as e:
            failed.append(f"{payslip.employee_full_name}: {e}")
            continue

        sent.append(payslip.employee_full_name)

    await db.commit()
    return SendPayslipsResult(sent=sent, skipped=skipped, failed=failed)
