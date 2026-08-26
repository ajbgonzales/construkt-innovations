import uuid
from datetime import datetime

from db import Base
from orm.project import Project
from sqlalchemy import ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        UniqueConstraint("employee_id", "project_id", name="uq_employee_id_project"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str]
    email_address: Mapped[str | None]
    contact_number: Mapped[str | None]
    employee_id: Mapped[str]
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id")
    )
    project_ref: Mapped[Project] = relationship(lazy="joined")
    position: Mapped[str]
    rate: Mapped[float] = mapped_column(Numeric(10, 2))
    allowance: Mapped[float] = mapped_column(Numeric(10, 2))
    sss: Mapped[float] = mapped_column(Numeric(10, 2))
    hdmf: Mapped[float] = mapped_column(Numeric(10, 2))
    phic: Mapped[float] = mapped_column(Numeric(10, 2))
    others: Mapped[float] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    @property
    def project(self) -> str:
        return self.project_ref.name
