from datetime import datetime

from orm.employee import Employee
from orm.overtime_request import OvertimeRequest
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


async def get_overtime_request(date: datetime, employee: Employee, db: AsyncSession):
    result = await db.execute(
        select(OvertimeRequest).where(
            OvertimeRequest.date == date,
            OvertimeRequest.project_id == employee.project_id,
            OvertimeRequest.employees.any(Employee.id == employee.id),
        )
    )

    return result.unique().scalars().one_or_none()
