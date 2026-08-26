"""add spreadsheet to payroll_periods

Revision ID: 36271bf59596
Revises: 59903f317e46
Create Date: 2026-08-26 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '36271bf59596'
down_revision: Union[str, Sequence[str], None] = '59903f317e46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'payroll_periods',
        sa.Column('spreadsheet', sa.LargeBinary(), nullable=True),
    )
    op.add_column(
        'payroll_periods',
        sa.Column('spreadsheet_filename', sa.String(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payroll_periods', 'spreadsheet_filename')
    op.drop_column('payroll_periods', 'spreadsheet')
