import uuid
from datetime import date, datetime

from db import Base
from orm.payroll_record import PayrollRecord
from sqlalchemy import LargeBinary, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class PayrollPeriod(Base):
    __tablename__ = "payroll_periods"
    __table_args__ = (
        UniqueConstraint("start_date", "end_date", name="uq_payroll_period_dates"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    start_date: Mapped[date]
    end_date: Mapped[date]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    spreadsheet: Mapped[bytes | None] = mapped_column(LargeBinary)
    spreadsheet_filename: Mapped[str | None]

    payroll_records: Mapped[list[PayrollRecord]] = relationship(
        back_populates="payroll_period_ref", cascade="all, delete-orphan"
    )
