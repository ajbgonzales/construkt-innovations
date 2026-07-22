import io
import json
import pandas as pd

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from models.attendance import FilePayload
from models.employee import EmployeeCreate, EmployeeRead
from orm.employee import Employee
from services.spreadsheet_processor import (
    clean_attendance_spreadsheet,
    compile_spreadsheets,
)

from typing import List


router = APIRouter()


@router.get("/employees", response_model=List[EmployeeRead])
async def list_employees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).order_by(Employee.created_at.desc()))
    return result.scalars().all()


@router.post("/employees", response_model=EmployeeRead, status_code=201)
async def create_employee(payload: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    employee = Employee(**payload.model_dump())
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


@router.post("/process_attendance_records")
async def process_attendance_records(
    files: List[UploadFile] = File(...),
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
