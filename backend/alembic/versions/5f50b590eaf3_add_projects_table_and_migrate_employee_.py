"""add projects table and migrate employee project to fk

Revision ID: 5f50b590eaf3
Revises: 12c02e19b130
Create Date: 2026-08-02 16:58:05.392816

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '5f50b590eaf3'
down_revision: Union[str, Sequence[str], None] = '12c02e19b130'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    # 1. Create the projects table.
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.UniqueConstraint("name", name="uq_projects_name"),
    )

    projects_table = sa.table(
        "projects",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("name", sa.String),
    )
    employees_table = sa.table(
        "employees",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("project", sa.String),
        sa.column("project_id", UUID(as_uuid=True)),
    )

    # 2. Backfill one Project row per distinct existing employees.project value.
    # Group by the *trimmed* name so whitespace-only variants (e.g. "B Ong" vs
    # "B Ong ") collapse into a single project instead of creating duplicates,
    # while still matching each employee row by its exact original string.
    raw_names = [
        row[0]
        for row in bind.execute(sa.select(employees_table.c.project).distinct())
    ]
    trimmed_to_id: dict[str, uuid.UUID] = {}
    raw_to_id: dict[str, uuid.UUID] = {}
    for raw_name in raw_names:
        trimmed_name = raw_name.strip()
        if trimmed_name not in trimmed_to_id:
            trimmed_to_id[trimmed_name] = uuid.uuid4()
        raw_to_id[raw_name] = trimmed_to_id[trimmed_name]

    if trimmed_to_id:
        bind.execute(
            projects_table.insert(),
            [
                {"id": project_id, "name": name}
                for name, project_id in trimmed_to_id.items()
            ],
        )

    # 3. Add project_id as nullable first so we can backfill it row by row.
    op.add_column("employees", sa.Column("project_id", UUID(as_uuid=True), nullable=True))

    for raw_name, project_id in raw_to_id.items():
        bind.execute(
            employees_table.update()
            .where(employees_table.c.project == raw_name)
            .values(project_id=project_id)
        )

    # 4. Now that every row has a project_id, enforce NOT NULL and add the FK.
    op.alter_column("employees", "project_id", nullable=False)
    op.create_foreign_key(
        "fk_employees_project_id_projects",
        "employees",
        "projects",
        ["project_id"],
        ["id"],
    )

    # 5. Swap the composite unique constraint from (employee_id, project) to
    # (employee_id, project_id).
    op.drop_constraint("uq_employee_id_project", "employees", type_="unique")
    op.create_unique_constraint(
        "uq_employee_id_project", "employees", ["employee_id", "project_id"]
    )

    # 6. Drop the old free-text project column.
    op.drop_column("employees", "project")


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()

    op.add_column("employees", sa.Column("project", sa.String(), nullable=True))

    projects_table = sa.table(
        "projects",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("name", sa.String),
    )
    employees_table = sa.table(
        "employees",
        sa.column("project_id", UUID(as_uuid=True)),
        sa.column("project", sa.String),
    )

    rows = bind.execute(sa.select(projects_table.c.id, projects_table.c.name)).all()
    for project_id, name in rows:
        bind.execute(
            employees_table.update()
            .where(employees_table.c.project_id == project_id)
            .values(project=name)
        )

    op.alter_column("employees", "project", nullable=False)

    op.drop_constraint("uq_employee_id_project", "employees", type_="unique")
    op.create_unique_constraint(
        "uq_employee_id_project", "employees", ["employee_id", "project"]
    )

    op.drop_constraint(
        "fk_employees_project_id_projects", "employees", type_="foreignkey"
    )
    op.drop_column("employees", "project_id")
    op.drop_table("projects")
