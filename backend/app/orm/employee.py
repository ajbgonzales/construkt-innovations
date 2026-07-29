import uuid
from datetime import datetime

from db import Base
from sqlalchemy import Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        UniqueConstraint("employee_id", "project", name="uq_employee_id_project"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str]
    email_address: Mapped[str | None]
    contact_number: Mapped[str | None]
    employee_id: Mapped[str]
    project: Mapped[str]
    position: Mapped[str]
    rate: Mapped[float] = mapped_column(Numeric(10, 2))
    allowance: Mapped[float] = mapped_column(Numeric(10, 2))
    sss: Mapped[float] = mapped_column(Numeric(10, 2))
    hdmf: Mapped[float] = mapped_column(Numeric(10, 2))
    phic: Mapped[float] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
