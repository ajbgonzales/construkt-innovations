"""enforce single payslip approver row

Revision ID: b92ca445558a
Revises: f43bdbbf1469
Create Date: 2026-08-23 09:02:16.617303

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b92ca445558a'
down_revision: Union[str, Sequence[str], None] = 'f43bdbbf1469'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'payslip_approvers',
        sa.Column('singleton_guard', sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.create_check_constraint(
        'ck_payslip_approvers_singleton_guard',
        'payslip_approvers',
        'singleton_guard IS TRUE',
    )
    op.create_unique_constraint(
        'uq_payslip_approvers_singleton_guard',
        'payslip_approvers',
        ['singleton_guard'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_payslip_approvers_singleton_guard', 'payslip_approvers', type_='unique')
    op.drop_constraint('ck_payslip_approvers_singleton_guard', 'payslip_approvers', type_='check')
    op.drop_column('payslip_approvers', 'singleton_guard')
