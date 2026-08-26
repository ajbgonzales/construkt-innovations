import uuid
from datetime import date, datetime

from db import Base
from sqlalchemy import ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class AttendanceDay(Base):
    __tablename__ = "attendance_days"
    __table_args__ = (
        UniqueConstraint(
            "payroll_record_id", "date", name="uq_attendance_day_record_date"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payroll_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payroll_records.id", ondelete="CASCADE")
    )
    payroll_record_ref = relationship(
        "PayrollRecord", back_populates="attendance_days"
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.id")
    )
    date: Mapped[date]
    work_hours: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    overtime_hours: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
