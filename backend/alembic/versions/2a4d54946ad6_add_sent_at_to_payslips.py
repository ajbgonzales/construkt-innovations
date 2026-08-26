"""add sent_at to payslips

Revision ID: 2a4d54946ad6
Revises: b92ca445558a
Create Date: 2026-08-23 10:51:00.551931

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a4d54946ad6'
down_revision: Union[str, Sequence[str], None] = 'b92ca445558a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('payslips', sa.Column('sent_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payslips', 'sent_at')
