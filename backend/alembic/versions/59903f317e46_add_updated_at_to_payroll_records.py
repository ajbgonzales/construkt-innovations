"""add updated_at to payroll_records

Revision ID: 59903f317e46
Revises: 2a4d54946ad6
Create Date: 2026-08-26 07:52:15.364984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '59903f317e46'
down_revision: Union[str, Sequence[str], None] = '2a4d54946ad6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'payroll_records',
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payroll_records', 'updated_at')
