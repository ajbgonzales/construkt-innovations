import uuid
from datetime import date, time

from models.employee import EmployeeRead
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel


class OvertimeRequestCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    date: date
    project_id: uuid.UUID
    start_time: time
    end_time: time
    activities: str = Field(min_length=1)
    employee_ids: list[uuid.UUID] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_time_range(self) -> "OvertimeRequestCreate":
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")
        return self


class OvertimeRequestRead(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    id: uuid.UUID
    date: date
    project_id: uuid.UUID
    project_name: str
    start_time: time
    end_time: time
    activities: str
    employees: list[EmployeeRead]
