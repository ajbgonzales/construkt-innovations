import io
import json
import pandas as pd

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from models.attendance import FilePayload
from services.spreadsheet_processor import (
    clean_attendance_spreadsheet,
    compile_spreadsheets,
)

from typing import List


router = APIRouter()


@router.post("/process_attendance_records")
async def process_attendance_records(
    files: List[UploadFile] = File(...),
    projects_metadata: str = Form(...),
):
    metadata = json.loads(projects_metadata)
    parsed_projects_metadata = {
        key: FilePayload(**value).model_dump() for key, value in metadata.items()
    }

    for file in files:
        df = pd.read_excel(file.file)
        df = df.dropna(how="all").dropna(axis=1, how="all")
        clean_attendance_spreadsheet(df, parsed_projects_metadata[file.filename])

    file_paths = []
    file_paths.extend(
        f"app/records/{value['project_name']}.xlsx"
        for value in parsed_projects_metadata.values()
    )

    buffer = io.BytesIO()
    compile_spreadsheets(file_paths, buffer)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=compiled.xlsx"},
    )
