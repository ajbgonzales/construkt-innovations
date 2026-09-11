"""add holiday premium pay to payroll records

Revision ID: 3495b09b7b03
Revises: 36271bf59596
Create Date: 2026-08-28 08:34:04.560895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3495b09b7b03'
down_revision: Union[str, Sequence[str], None] = '36271bf59596'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'payroll_records',
        sa.Column(
            'holiday_premium_pay',
            sa.Numeric(10, 2),
            nullable=False,
            server_default='0',
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payroll_records', 'holiday_premium_pay')
