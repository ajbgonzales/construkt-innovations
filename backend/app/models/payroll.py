import uuid
from datetime import date, datetime, timezone

from pydantic import BaseModel, ConfigDict, field_serializer
from pydantic.alias_generators import to_camel


def _as_utc(value: datetime | None) -> datetime | None:
    # These timestamps are stored naive in the DB but always in UTC
    # (server_default func.now() on a Postgres instance configured with
    # Etc/UTC). Attach the offset so clients don't misread them as local.
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=timezone.utc)


class PayrollRecordRead(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    id: uuid.UUID
    employee_id: uuid.UUID
    employee_full_name: str
    project_id: uuid.UUID
    project_name: str
    total_work_hours: float
    overtime_hours: float
    rate: float
    allowance: float
    sss: float
    hdmf: float
    phic: float
    others: float
    gross_amount: float
    net_amount: float
    is_flagged: bool
    notes: str | None
    updated_at: datetime

    @field_serializer("updated_at")
    def _serialize_updated_at(self, value: datetime) -> datetime:
        return _as_utc(value)


class PayrollPeriodRead(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    id: uuid.UUID
    start_date: date
    end_date: date
    created_at: datetime


class PayrollPeriodDetailRead(PayrollPeriodRead):
    payroll_records: list[PayrollRecordRead]


class PayslipRead(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )

    id: uuid.UUID
    payroll_record_id: uuid.UUID
    payroll_period_id: uuid.UUID
    employee_id: uuid.UUID
    employee_full_name: str
    project_id: uuid.UUID
    project_name: str
    total_work_hours: float
    overtime_hours: float
    rate: float
    allowance: float
    sss: float
    hdmf: float
    phic: float
    others: float
    gross_amount: float
    net_amount: float
    is_holiday_pay_eligible: bool | None
    holiday_date: date | None
    generated_at: datetime
    sent_at: datetime | None

    @field_serializer("generated_at", "sent_at")
    def _serialize_utc(self, value: datetime | None) -> datetime | None:
        return _as_utc(value)


class SendPayslipsResult(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sent: list[str]
    skipped: list[str]
    failed: list[str]
