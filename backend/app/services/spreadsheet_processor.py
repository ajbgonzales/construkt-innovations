from datetime import datetime, timedelta
from io import BytesIO

import pandas as pd
from models.attendance import EmployeeAttendanceRecord
from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter
from orm.payroll_period import PayrollPeriod
from sqlalchemy.ext.asyncio import AsyncSession

from services.constants import NON_DATE_COLUMNS
from services.dataframe import get_loc_given_substring
from services.dates import get_date_range, week_of_month
from services.payroll import persist_payroll_records
from services.queries import get_employee_profile, get_holiday, get_work_hours_on_date
from services.summary_formulas import (
    format_number_cells,
    get_manpower,
    get_net_amount,
    get_project_totals_row,
    get_total_disbursement,
)
from services.time_logs import get_full_work_hours, get_hours
from services.utils import (
    generate_filename,
    get_employee_attribute,
    get_work_week_dates,
)


def get_attendance_date_range(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, datetime, datetime]:
    df = df.copy()
    df.columns = [
        f"col_{i}" if col.startswith("Unnamed") else col
        for i, col in enumerate(df.columns, start=1)
    ]

    row, col = get_loc_given_substring(df, "Attendance date")
    start_date, end_date = get_date_range(df.loc[row, col])
    return df, start_date, end_date


def _get_metadata(projects_metadata: dict):
    project_name = projects_metadata["project_name"]
    start_time = projects_metadata["start_time"]
    end_time = projects_metadata["end_time"]
    saturday_end_time = projects_metadata["saturday_end_time"]
    is_compressed = projects_metadata["is_compressed"]
    is_overtime = projects_metadata["is_overtime"]
    return (
        project_name,
        start_time,
        end_time,
        saturday_end_time,
        is_compressed,
        is_overtime,
    )


async def clean_attendance_spreadsheet(
    df: pd.DataFrame, projects_metadata: dict, db: AsyncSession
) -> tuple[PayrollPeriod | None, BytesIO]:
    (
        project_name,
        start_time,
        end_time,
        saturday_end_time,
        is_compressed,
        is_overtime,
    ) = _get_metadata(projects_metadata)

    df, start_date, end_date = get_attendance_date_range(df)
    records = await _get_employee_records(
        df,
        project_name,
        start_date,
        end_date,
        start_time,
        end_time,
        saturday_end_time,
        is_compressed,
        is_overtime,
        db,
    )
    period = await persist_payroll_records(records, db)
    spreadsheet = _create_cleaned_spreadsheet(records, project_name)
    return period, spreadsheet


async def _get_employee_records(
    df: pd.DataFrame,
    project: str,
    start_date: datetime,
    end_date: datetime,
    start_time: str,
    end_time: str,
    saturday_end_time: str,
    is_compressed_time: bool,
    is_overtime: bool,
    db: AsyncSession,
):
    records: list[EmployeeAttendanceRecord] = []
    rows = list(df.itertuples(index=False))
    current_week = week_of_month(start_date, end_date)
    for i, row in enumerate(rows[:-1]):
        name = get_employee_attribute(df, rows, i, "Name:")
        if row.col_4 == "User ID:" and isinstance(name, str):
            current = start_date
            col_num = 1
            previous_work_hours: float | None = None
            while current <= end_date:
                raw_employee_id = row.col_5
                employee_id = (
                    str(int(raw_employee_id))
                    if isinstance(raw_employee_id, float)
                    and raw_employee_id.is_integer()
                    else str(raw_employee_id)
                )
                employee = await get_employee_profile(employee_id, project, db)
                if employee is None:
                    work_hours = 0.0
                    overtime_hours = 0.0
                    is_flagged = "Yes"
                    notes = "Employee profile not found."
                elif await _worked_full_previous_day(
                    employee, current, previous_work_hours, is_compressed_time, db
                ):
                    work_hours = get_full_work_hours(current, is_compressed_time)
                    overtime_hours = 0.0
                    is_flagged = "No"
                    notes = None
                else:
                    work_hours, overtime_hours, is_flagged, notes = await get_hours(
                        rows=rows,
                        index=i + 2,
                        date=current,
                        col_num=col_num,
                        start_time=start_time,
                        end_time=end_time,
                        saturday_end_time=saturday_end_time,
                        employee=employee,
                        db=db,
                        is_compressed_time=is_compressed_time,
                        is_overtime=is_overtime,
                    )
                previous_work_hours = work_hours
                record = EmployeeAttendanceRecord(
                    employee_id=employee_id,
                    employee_full_name=name,
                    position=get_employee_attribute(df, rows, i, "Department:"),
                    project=project,
                    rate=employee.rate if employee else 0,
                    allowance=employee.allowance if employee else 0,
                    phic=employee.phic if employee and current_week == 3 else 0,
                    hdmf=employee.hdmf if employee and current_week == 3 else 0,
                    sss=employee.sss if employee and current_week == 1 else 0,
                    others=employee.others if employee else 0,
                    date=current,
                    work_hours=work_hours,
                    overtime_hours=overtime_hours,
                    is_compressed_time=is_compressed_time,
                    is_overtime=is_overtime,
                    is_flagged=is_flagged,
                    notes=notes,
                    employee_uuid=employee.id if employee else None,
                    project_uuid=employee.project_id if employee else None,
                )
                records.append(record)
                current += timedelta(days=1)
                col_num += 1

    return records


async def _worked_full_previous_day(
    employee,
    current: datetime,
    previous_work_hours: float | None,
    is_compressed_time: bool,
    db: AsyncSession,
) -> bool:
    if await get_holiday(current.date(), db) is None:
        return False

    previous_date = (current - timedelta(days=1)).date()
    if previous_work_hours is None:
        # No prior day processed in this batch (current is the first day of
        # the period): fall back to the previously persisted attendance day.
        previous_work_hours = await get_work_hours_on_date(
            employee.id, previous_date, db
        )
        if previous_work_hours is None:
            return False

    return previous_work_hours >= get_full_work_hours(previous_date, is_compressed_time)


def _create_cleaned_spreadsheet(
    records: list[EmployeeAttendanceRecord],
    project_name: str,
) -> BytesIO:
    cleaned_dict = _create_cleaned_dict(records)

    # Convert cleaned_dict to data frame
    cleaned_df = pd.DataFrame.from_dict(cleaned_dict, orient="index")

    # Move Total Work Hours, Rate, Allowance, PHIC, HDMF to the end (in that order before formula columns)
    for col_name in [
        "Total Work Hours",
        "Overtime",
        "Rate",
        "Allowance",
        "PHIC",
        "HDMF",
        "SSS",
        "Others",
    ]:
        col_data = cleaned_df.pop(col_name)
        cleaned_df[col_name] = col_data

    # Total Work Hours is populated as an Excel SUM formula below, once the
    # sheet exists and date columns can be located by header.

    # Convert data frame to excel, in memory
    intermediate = BytesIO()
    cleaned_df.to_excel(intermediate, sheet_name=f"{project_name}", index=False)
    intermediate.seek(0)

    # Add Gross Amount and Net Amount formula columns via openpyxl
    wb = load_workbook(intermediate)
    ws = wb[project_name]

    headers = [cell.value for cell in ws[1]]
    col = {name: idx + 1 for idx, name in enumerate(headers)}

    gross_col = ws.max_column + 1
    net_col = gross_col + 1
    ws.cell(row=1, column=gross_col, value="Gross Amount")
    ws.cell(row=1, column=net_col, value="Net Amount")

    (
        rate_letter,
        allowance_letter,
        phic_letter,
        others_letter,
        hdmf_letter,
        sss_letter,
        twh_letter,
        ot_letter,
    ) = _get_column_letters(col)
    gross_letter = get_column_letter(gross_col)

    date_cols = [idx for name, idx in col.items() if name not in NON_DATE_COLUMNS]
    first_date_letter = get_column_letter(min(date_cols))
    last_date_letter = get_column_letter(max(date_cols))

    for row_idx in range(2, ws.max_row + 1):
        twh_formula = f"=SUM({first_date_letter}{row_idx}:{last_date_letter}{row_idx})"
        ws.cell(row=row_idx, column=col["Total Work Hours"], value=twh_formula)
        gross_formula = (
            f"=ROUND((({rate_letter}{row_idx}+{allowance_letter}{row_idx})/8)"
            f"*({twh_letter}{row_idx})"
            f"+({ot_letter}{row_idx}*(1.25*({rate_letter}{row_idx}/8))),2)"
        )
        net_amount_formula = (
            f"ROUND({gross_letter}{row_idx}"
            f"-{phic_letter}{row_idx}"
            f"-{hdmf_letter}{row_idx}"
            f"-{sss_letter}{row_idx}"
            f"-{others_letter}{row_idx},2)"
        )
        net_formula = f"=IF({net_amount_formula}>0,{net_amount_formula},0)"
        gross_cell = ws.cell(row=row_idx, column=gross_col, value=gross_formula)
        gross_cell.number_format = "#,##0.00"
        net_cell = ws.cell(row=row_idx, column=net_col, value=net_formula)
        net_cell.number_format = "#,##0.00"

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def compile_spreadsheets(spreadsheets: list[BytesIO], buffer: BytesIO):
    workbook = Workbook()
    workbook.remove(workbook.active)
    summary_dict = {}
    work_week_dates = None

    for spreadsheet in spreadsheets:
        wb = load_workbook(spreadsheet)
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            new_ws = workbook.create_sheet(title=sheet_name)
            for row in ws.iter_rows(values_only=True):
                new_ws.append(row)

        if not work_week_dates:
            work_week_dates = get_work_week_dates(new_ws)

        # Capture Manpower/Net Amount formulas before the totals row is
        # appended, so they don't sum the totals row into itself.
        summary_dict = _update_summary_dict(summary_dict, new_ws)

        get_project_totals_row(new_ws)
        format_number_cells(
            new_ws,
            [
                "Rate",
                "Allowance",
                "PHIC",
                "Others",
                "HDMF",
                "SSS",
                "Gross Amount",
                "Net Amount",
            ],
        )

    _create_summary_sheet(summary_dict, workbook)
    workbook.save(buffer)
    buffer.seek(0)
    return generate_filename(work_week_dates[0], work_week_dates[1])


def _create_cleaned_dict(records: list[EmployeeAttendanceRecord]):
    cleaned_dict = {}
    for r in records:
        # Create a new row for the employee if not yet present
        if r.employee_id not in cleaned_dict:
            cleaned_dict[r.employee_id] = {
                "Employee ID": r.employee_id,
                "Employee Full Name": r.employee_full_name,
                "Position": r.position,
                "Project": r.project,
                "Is Flagged": "No",
                "Notes": None,
                "Total Work Hours": 0,
                "Overtime": 0,
                "Rate": r.rate,
                "Allowance": r.allowance,
                "PHIC": r.phic,
                "Others": r.others,
                "HDMF": r.hdmf,
                "SSS": r.sss,
            }
        # Flag employee
        if cleaned_dict[r.employee_id]["Is Flagged"] == "No" and r.is_flagged == "Yes":
            cleaned_dict[r.employee_id]["Is Flagged"] = r.is_flagged
        # Add notes
        if r.notes:
            existing_notes = cleaned_dict[r.employee_id]["Notes"]
            if not existing_notes:
                cleaned_dict[r.employee_id]["Notes"] = r.notes
            elif r.notes not in existing_notes.split("\n"):
                cleaned_dict[r.employee_id]["Notes"] += f"\n{r.notes}"
        # Add work hours and overtime hours
        cleaned_dict[r.employee_id][r.date.strftime("%Y-%m-%d")] = r.work_hours
        cleaned_dict[r.employee_id]["Overtime"] += r.overtime_hours

    return cleaned_dict


def _get_column_letters(columns):
    rate_letter = get_column_letter(columns["Rate"])
    allowance_letter = get_column_letter(columns["Allowance"])
    phic_letter = get_column_letter(columns["PHIC"])
    others_letter = get_column_letter(columns["Others"])
    hdmf_letter = get_column_letter(columns["HDMF"])
    sss_letter = get_column_letter(columns["SSS"])
    twh_letter = get_column_letter(columns["Total Work Hours"])
    ot_letter = get_column_letter(columns["Overtime"])

    return (
        rate_letter,
        allowance_letter,
        phic_letter,
        others_letter,
        hdmf_letter,
        sss_letter,
        twh_letter,
        ot_letter,
    )


def _update_summary_dict(summary_dict, new_ws):
    return {
        **summary_dict,
        new_ws.title: {
            "Project": new_ws.title,
            "Manpower": get_manpower(new_ws),
            "Net Amount": get_net_amount(new_ws),
        },
    }


def _create_summary_sheet(summary_dict, wb):
    new_ws = wb.create_sheet(title="Summary", index=0)

    # Write header row from the first record's keys
    first_record = next(iter(summary_dict.values()))
    headers = list(first_record.keys())
    new_ws.append(headers)

    # Write each record as a row, in header order
    for record in summary_dict.values():
        new_ws.append([record.get(h) for h in headers])

    get_total_disbursement(new_ws)
    format_number_cells(new_ws, ["Net Amount"])
