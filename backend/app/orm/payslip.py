import uuid
from datetime import date, datetime

from db import Base
from sqlalchemy import Boolean, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from orm.employee import Employee
from orm.project import Project


class Payslip(Base):
    __tablename__ = "payslips"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payroll_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payroll_records.id", ondelete="CASCADE"),
        unique=True,
    )
    payroll_period_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payroll_periods.id", ondelete="CASCADE")
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id")
    )
    employee_ref: Mapped[Employee] = relationship(lazy="joined")
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id")
    )
    project_ref: Mapped[Project] = relationship(lazy="joined")

    total_work_hours: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    overtime_hours: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    rate: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    allowance: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    sss: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    hdmf: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    phic: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    others: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    gross_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    net_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    is_holiday_pay_eligible: Mapped[bool | None] = mapped_column(Boolean)
    holiday_date: Mapped[date | None]

    generated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
    sent_at: Mapped[datetime | None]

    @property
    def employee_full_name(self) -> str:
        return self.employee_ref.full_name

    @property
    def project_name(self) -> str:
        return self.project_ref.name
