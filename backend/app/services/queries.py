from orm.employee import Employee
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_employee_profile(employee_id: str, project: str, db: AsyncSession):
    result = await db.execute(
        select(Employee).where(
            Employee.employee_id == employee_id,
            Employee.project == project,
        )
    )

    return result.scalar_one_or_none()
