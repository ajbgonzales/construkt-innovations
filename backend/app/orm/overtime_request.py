import uuid
from datetime import UTC, date, datetime, time

from db import Base
from sqlalchemy import Column, ForeignKey, Table, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from orm.employee import Employee
from orm.project import Project

overtime_request_employees = Table(
    "overtime_request_employees",
    Base.metadata,
    Column(
        "overtime_request_id",
        UUID(as_uuid=True),
        ForeignKey("overtime_requests.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "employee_id",
        UUID(as_uuid=True),
        ForeignKey("employees.id"),
        primary_key=True,
    ),
)


class OvertimeRequest(Base):
    __tablename__ = "overtime_requests"
    __table_args__ = (
        UniqueConstraint("date", "project_id", name="uq_overtime_request_date_project"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    date: Mapped[date]
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id")
    )
    project_ref: Mapped[Project] = relationship(lazy="joined")
    start_time: Mapped[time]
    end_time: Mapped[time]
    activities: Mapped[str]
    employees: Mapped[list[Employee]] = relationship(
        secondary=overtime_request_employees, lazy="joined"
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    @property
    def project_name(self) -> str:
        return self.project_ref.name

    @property
    def duration_hours(self) -> int:
        start = datetime.combine(datetime.now(UTC), self.start_time)
        end = datetime.combine(datetime.now(UTC), self.end_time)
        return (end - start).total_seconds() / 3600
