"""add is_active field to employees

Revision ID: 4df102e7ec35
Revises: 3495b09b7b03
Create Date: 2026-09-11 10:35:30.068039

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4df102e7ec35'
down_revision: Union[str, Sequence[str], None] = '3495b09b7b03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "employees",
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("employees", "is_active")
