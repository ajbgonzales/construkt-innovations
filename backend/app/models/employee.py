import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class EmployeeCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    full_name: str = Field(min_length=1)
    email_address: str | None = None
    contact_number: str | None = None
    employee_id: str = Field(min_length=1)
    project: str = Field(min_length=1)
    position: str = Field(min_length=1)
    rate: float = Field(ge=0)
    allowance: float = Field(ge=0)
    sss: float = Field(ge=0)
    hdmf: float = Field(ge=0)
    phic: float = Field(ge=0)


class EmployeeRead(EmployeeCreate):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    id: uuid.UUID
    created_at: datetime
