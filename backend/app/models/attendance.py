import uuid

from datetime import date, datetime
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
    date: date
    time_in: datetime | None
    time_out: datetime | None
    break_seconds: int
    is_compressed_time: bool
    is_flagged: Literal["Yes", "No"]
    notes: str | None = None

    def work_hours(self):
        return (
            (self.time_out - self.time_in).total_seconds() - self.break_seconds
        ) / 3600

    def overtime_hours(self):
        if self.is_compressed_time:
            total_work_hours = 8.5
        else:
            total_work_hours = 8

        overtime = (
            (self.time_out - self.time_in).total_seconds() - self.break_seconds / 3600
        ) - total_work_hours
        return overtime if overtime > 0 else 0


class FilePayload(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    project_name: str
    start_time: str
    is_compressed: bool
    is_overtime: bool
    working_days: int
