from orm.employee import Employee
from orm.project import Project
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_employee_profile(employee_id: str, project: str, db: AsyncSession):
    result = await db.execute(
        select(Employee)
        .join(Employee.project_ref)
        .where(
            Employee.employee_id == employee_id,
            func.lower(Project.name) == project.lower(),
        )
    )

    return result.scalar_one_or_none()
