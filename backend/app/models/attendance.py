import uuid
from datetime import date
from typing import Literal

from pydantic import UUID1, BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


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
    others: float
    date: date
    work_hours: float
    overtime_hours: float
    holiday_premium_pay: float = 0.0
    is_compressed_time: bool
    is_overtime: bool
    is_flagged: Literal["Yes", "No"]
    notes: str | None = None
    # Resolved DB identifiers for the matched employee, populated when the
    # employee profile lookup succeeds. None when the employee_id/project
    # pair has no matching Employee row, in which case the record can't be
    # persisted to payroll tables.
    employee_uuid: uuid.UUID | None = None
    project_uuid: uuid.UUID | None = None


class FilePayload(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    project_name: str
    start_time: str
    end_time: str
    include_saturday: bool
    saturday_end_time: str
    is_compressed: bool
    is_overtime: bool
