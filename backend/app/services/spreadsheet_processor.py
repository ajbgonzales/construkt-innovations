import os
import pandas as pd

from datetime import datetime, timedelta

from io import BytesIO

from models.attendance import EmployeeAttendanceRecord

from openpyxl import load_workbook, Workbook
from openpyxl.utils import get_column_letter

from services.dataframe import get_loc_given_substring
from services.dates import get_date_range
from services.time_logs import get_hours
from services.utils import (
    get_employee_attribute,
    get_work_week_dates,
    generate_filename,
)


def _get_metadata(projects_metadata: dict):
    project_name = projects_metadata["project_name"]
    start_time = projects_metadata["start_time"]
    is_compressed = projects_metadata["is_compressed"]
    is_overtime = projects_metadata["is_overtime"]
    # working_days = projects_metadata["working_days"]

    return project_name, start_time, is_compressed, is_overtime


def clean_attendance_spreadsheet(df: pd.DataFrame, projects_metadata: dict):
    project_name, start_time, is_compressed, is_overtime = get_metadata(
        projects_metadata
    )

    df.columns = [
        f"col_{i}" if col.startswith("Unnamed") else col
        for i, col in enumerate(df.columns, start=1)
    ]

    row, col = get_loc_given_substring(df, "Attendance date")
    start_date, end_date = get_date_range(df.loc[row, col])
    records = get_employee_records(
        df, project_name, start_date, end_date, start_time, is_compressed, is_overtime
    )
    create_cleaned_spreadsheet(records, project_name)


def get_employee_records(
    df: pd.DataFrame,
    project: str,
    start_date: datetime,
    end_date: datetime,
    start_time: str,
    is_compressed_time: bool,
    is_overtime: bool,
):
    records: list[EmployeeAttendanceRecord] = []
    rows = list(df.itertuples(index=False))
    for i, row in enumerate(rows[:-1]):
        name = get_employee_attribute(df, rows, i, "Name:")
        if row.col_4 == "User ID:" and isinstance(name, str):
            current = start_date
            col_num = 1
            while current <= end_date:
                work_hours, overtime_hours, is_flagged, notes = get_hours(
                    rows=rows,
                    index=i + 2,
                    date=current,
                    col_num=col_num,
                    start_time=start_time,
                    is_compressed_time=is_compressed_time,
                    is_overtime=is_overtime,
                )
                record = EmployeeAttendanceRecord(
                    employee_id=row.col_5,
                    employee_full_name=name,
                    position=get_employee_attribute(df, rows, i, "Department:"),
                    project=project,
                    rate=0,
                    allowance=0,
                    phic=0,
                    hdmf=0,
                    sss=0,
                    date=current,
                    work_hours=work_hours,
                    overtime_hours=overtime_hours,
                    is_compressed_time=is_compressed_time,
                    is_overtime=is_overtime,
                    is_flagged=is_flagged,
                    notes=notes,
                )
                records.append(record)
                current += timedelta(days=1)
                col_num += 1

    return records


def create_cleaned_spreadsheet(
    records: list[EmployeeAttendanceRecord],
    project_name: str,
):
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
    ]:
        col_data = cleaned_df.pop(col_name)
        cleaned_df[col_name] = col_data

    # Total Work Hours is populated as an Excel SUM formula below, once the
    # sheet exists and date columns can be located by header.

    os.makedirs("./app/records", exist_ok=True)

    output_path = f"./app/records/{project_name}.xlsx"

    # Convert data frame to excel
    cleaned_df.to_excel(output_path, sheet_name=f"{project_name}", index=False)

    # Add Gross Amount and Net Amount formula columns via openpyxl
    wb = load_workbook(output_path)
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
            f"*({twh_letter}{row_idx}-{ot_letter}{row_idx})"
            f"+({ot_letter}{row_idx}*(1.25*({rate_letter}{row_idx}/8)))"
            f"+{phic_letter}{row_idx}"
            f"+{hdmf_letter}{row_idx}"
            f"+{sss_letter}{row_idx},2)"
        )
        net_formula = (
            f"=ROUND({gross_letter}{row_idx}"
            f"-{phic_letter}{row_idx}"
            f"-{hdmf_letter}{row_idx}"
            f"-{sss_letter}{row_idx},2)"
        )
        gross_cell = ws.cell(row=row_idx, column=gross_col, value=gross_formula)
        gross_cell.number_format = "#,##0.00"
        net_cell = ws.cell(row=row_idx, column=net_col, value=net_formula)
        net_cell.number_format = "#,##0.00"

    wb.save(output_path)


def compile_spreadsheets(file_paths: list[str], buffer: BytesIO):
    workbook = Workbook()
    workbook.remove(workbook.active)

    for path in file_paths:
        wb = load_workbook(path)
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            new_ws = workbook.create_sheet(title=sheet_name)
            for row in ws.iter_rows(values_only=True):
                new_ws.append(row)

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
                "HDMF": r.hdmf,
                "SSS": r.sss,
            }
        # Flag employee
        if cleaned_dict[r.employee_id]["Is Flagged"] == "No" and r.is_flagged == "Yes":
            cleaned_dict[r.employee_id]["Is Flagged"] = r.is_flagged
        # Add notes
        if r.notes:
            if cleaned_dict[r.employee_id]["Notes"]:
                cleaned_dict[r.employee_id]["Notes"] += f"\n{r.notes}"
            else:
                cleaned_dict[r.employee_id]["Notes"] = r.notes
        # Add work hours and overtime hours
        cleaned_dict[r.employee_id][r.date.strftime("%Y-%m-%d")] = r.work_hours
        cleaned_dict[r.employee_id]["Overtime"] += r.overtime_hours

    return cleaned_dict


def _get_column_letters(columns):
    rate_letter = get_column_letter(columns["Rate"])
    allowance_letter = get_column_letter(columns["Allowance"])
    phic_letter = get_column_letter(columns["PHIC"])
    hdmf_letter = get_column_letter(columns["HDMF"])
    sss_letter = get_column_letter(columns["SSS"])
    twh_letter = get_column_letter(columns["Total Work Hours"])
    ot_letter = get_column_letter(columns["Overtime"])

    return (
        rate_letter,
        allowance_letter,
        phic_letter,
        hdmf_letter,
        sss_letter,
        twh_letter,
        ot_letter,
    )
