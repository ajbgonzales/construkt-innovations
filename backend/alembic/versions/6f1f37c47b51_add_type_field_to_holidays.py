"""add type field to holidays

Revision ID: 6f1f37c47b51
Revises: 646a1bd90071
Create Date: 2026-08-22 19:30:07.083054

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f1f37c47b51'
down_revision: Union[str, Sequence[str], None] = '646a1bd90071'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    holiday_type = sa.Enum(
        "special_non_working", "regular", name="holiday_type"
    )
    holiday_type.create(op.get_bind())
    op.add_column(
        "holidays", sa.Column("type", holiday_type, nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("holidays", "type")
    sa.Enum(name="holiday_type").drop(op.get_bind())
