import uuid

from datetime import date
from pydantic import BaseModel, ConfigDict, Field, UUID1
from pydantic.alias_generators import to_camel
from typing import Literal


class EmployeeAttendanceRecord(BaseModel):
    id: UUID1 = Field(default_factory=uuid.uuid1)
    employee_id: int
    employee_full_name: str
    position: str
    project: str
    rate: float
    allowance: float
    phic: float
    hdmf: float
    sss: float
    date: date
    work_hours: float
    overtime_hours: float
    is_compressed_time: bool
    is_overtime: bool
    is_flagged: Literal["Yes", "No"]
    notes: str | None = None


class FilePayload(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    project_name: str
    start_time: str
    end_time: str
    saturday_end_time: str
    is_compressed: bool
    is_overtime: bool
