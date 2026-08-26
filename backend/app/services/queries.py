import uuid
from datetime import date, datetime

from orm.attendance_day import AttendanceDay
from orm.employee import Employee
from orm.holiday import Holiday
from orm.overtime_request import OvertimeRequest
from orm.payroll_period import PayrollPeriod
from orm.payroll_record import PayrollRecord
from orm.payslip import Payslip
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


async def get_or_create_payroll_period(
    start_date: date, end_date: date, db: AsyncSession
) -> PayrollPeriod:
    result = await db.execute(
        select(PayrollPeriod).where(
            PayrollPeriod.start_date == start_date, PayrollPeriod.end_date == end_date
        )
    )
    period = result.scalar_one_or_none()
    if period is None:
        period = PayrollPeriod(start_date=start_date, end_date=end_date)
        db.add(period)
        await db.flush()
    return period


async def get_or_create_payroll_record(
    payroll_period_id: uuid.UUID,
    employee_id: uuid.UUID,
    project_id: uuid.UUID,
    db: AsyncSession,
) -> PayrollRecord:
    result = await db.execute(
        select(PayrollRecord).where(
            PayrollRecord.payroll_period_id == payroll_period_id,
            PayrollRecord.employee_id == employee_id,
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        record = PayrollRecord(
            payroll_period_id=payroll_period_id,
            employee_id=employee_id,
            project_id=project_id,
        )
        db.add(record)
        await db.flush()
    else:
        record.project_id = project_id
    return record


async def get_or_create_payslip(payroll_record_id: uuid.UUID, db: AsyncSession) -> Payslip:
    result = await db.execute(
        select(Payslip).where(Payslip.payroll_record_id == payroll_record_id)
    )
    payslip = result.scalar_one_or_none()
    if payslip is None:
        # Not flushed here: payroll_period_id/employee_id/project_id are
        # NOT NULL and are only set by the caller after this returns.
        payslip = Payslip(payroll_record_id=payroll_record_id)
        db.add(payslip)
    return payslip


async def get_holiday(holiday_date: date, db: AsyncSession) -> Holiday | None:
    result = await db.execute(select(Holiday).where(Holiday.date == holiday_date))
    return result.scalar_one_or_none()


async def get_work_hours_on_date(
    employee_id: uuid.UUID, date: date, db: AsyncSession
) -> float | None:
    result = await db.execute(
        select(AttendanceDay.work_hours).where(
            AttendanceDay.employee_id == employee_id,
            AttendanceDay.date == date,
        )
    )
    return result.scalar_one_or_none()


async def has_attendance_on_dates(
    employee_id: uuid.UUID, dates: list[date], db: AsyncSession
) -> bool:
    result = await db.execute(
        select(AttendanceDay.id).where(
            AttendanceDay.employee_id == employee_id,
            AttendanceDay.date.in_(dates),
            AttendanceDay.work_hours > 0,
        )
    )
    return result.first() is not None
