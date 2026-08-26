"""add payslip approvers table

Revision ID: f43bdbbf1469
Revises: 6f1f37c47b51
Create Date: 2026-08-23 08:51:36.295104

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f43bdbbf1469'
down_revision: Union[str, Sequence[str], None] = '6f1f37c47b51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    payslip_approvers = op.create_table('payslip_approvers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('signature_image', sa.LargeBinary(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.bulk_insert(
        payslip_approvers,
        [{"id": uuid.uuid4(), "name": "Eugene Nazareno", "signature_image": None}],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('payslip_approvers')
