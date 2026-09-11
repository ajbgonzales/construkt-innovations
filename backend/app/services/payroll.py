import uuid
from collections import defaultdict
from datetime import date, timedelta

from models.attendance import EmployeeAttendanceRecord
from orm.attendance_day import AttendanceDay
from orm.payroll_period import PayrollPeriod
from orm.payroll_record import PayrollRecord
from sqlalchemy import delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from services.queries import (
    get_holiday,
    get_or_create_payroll_period,
    get_or_create_payroll_record,
    get_or_create_payslip,
    has_attendance_on_dates,
)


def compute_gross_amount(
    rate: float,
    allowance: float,
    total_work_hours: float,
    overtime_hours: float,
    holiday_premium_pay: float = 0.0,
) -> float:
    gross = (
        ((rate + allowance) / 8) * total_work_hours
        + overtime_hours * (1.25 * (rate / 8))
        + holiday_premium_pay
    )
    return round(gross, 2)


def compute_net_amount(
    gross_amount: float, phic: float, hdmf: float, sss: float, others: float
) -> float:
    net = round(gross_amount - phic - hdmf - sss - others, 2)
    return net if net > 0 else 0.0


def _aggregate_by_employee(records: list[EmployeeAttendanceRecord]):
    aggregates: dict[uuid.UUID, dict] = {}
    daily: dict[uuid.UUID, list[EmployeeAttendanceRecord]] = defaultdict(list)

    for r in records:
        if r.employee_uuid is None or r.project_uuid is None:
            continue
        daily[r.employee_uuid].append(r)
        # rate/allowance/phic/hdmf/sss/others are constant per employee for a
        # given period (phic/hdmf/sss are already zeroed out by the caller on
        # days outside their deduction week), so only the first record's
        # values are kept here, matching _create_cleaned_dict's spreadsheet
        # output. Only hours are actually summed across the period's days.
        agg = aggregates.setdefault(
            r.employee_uuid,
            {
                "project_id": r.project_uuid,
                "rate": r.rate,
                "allowance": r.allowance,
                "phic": r.phic,
                "hdmf": r.hdmf,
                "sss": r.sss,
                "others": r.others,
                "total_work_hours": 0.0,
                "overtime_hours": 0.0,
                "holiday_premium_pay": 0.0,
                "is_flagged": False,
                "notes": None,
            },
        )
        agg["total_work_hours"] += r.work_hours
        agg["overtime_hours"] += r.overtime_hours
        agg["holiday_premium_pay"] += r.holiday_premium_pay
        if r.is_flagged == "Yes":
            agg["is_flagged"] = True
        if r.notes and r.notes not in (agg["notes"] or "").split("\n"):
            agg["notes"] = f"{agg['notes']}\n{r.notes}" if agg["notes"] else r.notes

    return aggregates, daily


async def persist_payroll_records(
    records: list[EmployeeAttendanceRecord], db: AsyncSession
) -> PayrollPeriod | None:
    resolved = [r for r in records if r.employee_uuid is not None]
    if not resolved:
        return None

    start_date = min(r.date for r in resolved)
    end_date = max(r.date for r in resolved)
    period = await get_or_create_payroll_period(start_date, end_date, db)

    aggregates, daily = _aggregate_by_employee(resolved)

    for employee_id, agg in aggregates.items():
        gross_amount = compute_gross_amount(
            agg["rate"],
            agg["allowance"],
            agg["total_work_hours"],
            agg["overtime_hours"],
            agg["holiday_premium_pay"],
        )
        net_amount = compute_net_amount(
            gross_amount, agg["phic"], agg["hdmf"], agg["sss"], agg["others"]
        )

        payroll_record = await get_or_create_payroll_record(
            period.id, employee_id, agg["project_id"], db
        )
        payroll_record.total_work_hours = agg["total_work_hours"]
        payroll_record.overtime_hours = agg["overtime_hours"]
        payroll_record.holiday_premium_pay = agg["holiday_premium_pay"]
        payroll_record.rate = agg["rate"]
        payroll_record.allowance = agg["allowance"]
        payroll_record.phic = agg["phic"]
        payroll_record.hdmf = agg["hdmf"]
        payroll_record.sss = agg["sss"]
        payroll_record.others = agg["others"]
        payroll_record.gross_amount = gross_amount
        payroll_record.net_amount = net_amount
        payroll_record.is_flagged = agg["is_flagged"]
        payroll_record.notes = agg["notes"]
        await db.flush()

        # Daily entries are fully replaced on every (re)processing run so
        # corrections to the source spreadsheet don't leave stale days behind.
        await db.execute(
            delete(AttendanceDay).where(
                AttendanceDay.payroll_record_id == payroll_record.id
            )
        )
        db.add_all(
            [
                AttendanceDay(
                    payroll_record_id=payroll_record.id,
                    employee_id=employee_id,
                    date=r.date,
                    work_hours=r.work_hours,
                    overtime_hours=r.overtime_hours,
                )
                for r in daily[employee_id]
            ]
        )

    return period


async def delete_payroll_records_outside_projects(
    payroll_period_id: uuid.UUID, project_ids: set[uuid.UUID], db: AsyncSession
) -> None:
    # A processing batch is expected to include every project for the period,
    # so records for projects absent from the latest batch are stale and are
    # dropped (cascades to their AttendanceDay/Payslip rows).
    await db.execute(
        delete(PayrollRecord).where(
            PayrollRecord.payroll_period_id == payroll_period_id,
            PayrollRecord.project_id.notin_(project_ids),
        )
    )


def _next_monday(from_date: date) -> date:
    days_ahead = (7 - from_date.weekday()) % 7
    return from_date + timedelta(days=days_ahead or 7)


async def get_holiday_pay_eligibility(
    period: PayrollPeriod, employee_id: uuid.UUID, db: AsyncSession
) -> tuple[date | None, bool | None]:
    next_monday = _next_monday(period.end_date)
    holiday = await get_holiday(next_monday, db)
    if holiday is None:
        return None, None

    friday = next_monday - timedelta(days=3)
    saturday = next_monday - timedelta(days=2)
    worked = await has_attendance_on_dates(employee_id, [friday, saturday], db)
    return holiday.date, worked


async def generate_payslips_for_period(period: PayrollPeriod, db: AsyncSession):
    payslips = []
    for payroll_record in period.payroll_records:
        holiday_date, is_eligible = await get_holiday_pay_eligibility(
            period, payroll_record.employee_id, db
        )
        payslip = await get_or_create_payslip(payroll_record.id, db)
        payslip.payroll_period_id = period.id
        payslip.employee_id = payroll_record.employee_id
        payslip.project_id = payroll_record.project_id
        payslip.rate = payroll_record.rate
        payslip.allowance = payroll_record.allowance
        payslip.sss = payroll_record.sss
        payslip.hdmf = payroll_record.hdmf
        payslip.phic = payroll_record.phic
        payslip.others = payroll_record.others
        payslip.total_work_hours = payroll_record.total_work_hours
        payslip.overtime_hours = payroll_record.overtime_hours
        payslip.gross_amount = payroll_record.gross_amount
        payslip.net_amount = payroll_record.net_amount
        payslip.holiday_date = holiday_date
        payslip.is_holiday_pay_eligible = is_eligible
        # Regenerating means the content may have changed since it was last
        # emailed, so any prior send no longer reflects what's on file.
        payslip.sent_at = None
        # generated_at has onupdate=func.now(), but that only fires when the
        # row is otherwise dirty. If the payroll record was touched without
        # changing any value copied above (e.g. flagged/noted, then reverted),
        # none of the assignments above would mark the row dirty, so the
        # UPDATE (and the onupdate bump) would silently never happen and the
        # payslip would stay "stale" forever. Set it explicitly so
        # regenerating always refreshes it.
        payslip.generated_at = func.now()
        payslips.append(payslip)

    await db.flush()
    return payslips
