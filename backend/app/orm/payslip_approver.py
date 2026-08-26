import uuid
from datetime import datetime

from db import Base
from sqlalchemy import Boolean, LargeBinary, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class PayslipApprover(Base):
    __tablename__ = "payslip_approvers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str]
    signature_image: Mapped[bytes | None] = mapped_column(LargeBinary)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
    # DB-enforced singleton: always True, and unique, so at most one row can
    # ever exist regardless of how it's inserted (not just via the admin UI).
    singleton_guard: Mapped[bool] = mapped_column(Boolean, default=True)

    # Backs the admin form's upload field, which isn't a mapped column.
    # Kept as a plain class attribute (not Mapped) so sqladmin's edit-form
    # handling can safely `getattr` it without raising when a row is edited
    # without re-uploading a signature.
    signature_image_upload = None
