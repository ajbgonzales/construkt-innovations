import datetime
import enum
import uuid

from db import Base
from sqlalchemy import Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class HolidayType(str, enum.Enum):
    SPECIAL_NON_WORKING = "special_non_working"
    REGULAR = "regular"


class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    date: Mapped[datetime.date] = mapped_column(unique=True)
    name: Mapped[str]
    type: Mapped[HolidayType] = mapped_column(
        Enum(
            HolidayType,
            name="holiday_type",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        )
    )
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
