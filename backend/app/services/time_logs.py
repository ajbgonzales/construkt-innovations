import re

from datetime import datetime, timedelta
from .exceptions import TimeLogsError


def get_time_logs(
    rows,
    index: int,
    date: datetime,
    col_num: int,
    start_time: str,
    is_compressed_time: bool,
    is_overtime: bool,
):
    time_in = None
    time_out = None
    is_flagged = "No"
    notes = None

    time_in_logs = getattr(rows[index], f"col_{col_num}")
    # Employee is absent
    if not isinstance(time_in_logs, str):
        return time_in, time_out, is_flagged, notes
    try:
        time_out_logs = getattr(rows[index + 1], f"col_{col_num}")
    except IndexError:
        is_flagged = "Yes"
        notes = f"No afternoon time logs for {date.strftime('%B %d, %Y')}."
        return time_in, time_out, is_flagged, notes

    try:
        if has_valid_time_logs(
            date,
            start_time,
            time_in_logs,
            time_out_logs,
            is_compressed_time,
            is_overtime,
        ):
            time_in_logs_arr = time_in_logs.strip().split("\n")
            time_obj_arr = [
                datetime.strptime(time_obj, "%H:%M").time()
                for time_obj in time_in_logs_arr
            ]
            time_in = datetime.combine(date, time_obj_arr[0])

            time_out_logs_arr = time_out_logs.strip().split("\n")
            time_obj_arr = [
                datetime.strptime(time_obj, "%H:%M").time()
                for time_obj in time_out_logs_arr
            ]
            time_out = datetime.combine(date, time_obj_arr[1])

            return time_in, time_out, is_flagged, notes
    except TimeLogsError as e:
        is_flagged = "Yes"
        notes = e.message
        return time_in, time_out, is_flagged, notes


def has_valid_time_logs(
    date: datetime,
    start_time: str,
    time_in_logs: str,
    time_out_logs: str,
    is_compressed_time: bool,
    is_overtime: bool,
):
    # It has the correct pattern (ex. "08:00\n17:00")
    if not re.fullmatch(r"\d{2}:\d{2}\n\d{2}:\d{2}", time_in_logs):
        raise TimeLogsError(
            f"Invalid morning time logs for {date.strftime('%B %d, %Y')}."
        )
    # Checks if there are time out logs
    if not isinstance(time_out_logs, str):
        raise TimeLogsError(f"No afternoon time logs for {date.strftime('%B %d, %Y')}.")
    # Checks format of time out logs
    if not re.fullmatch(r"\d{2}:\d{2}\n\d{2}:\d{2}", time_out_logs):
        raise TimeLogsError(
            f"Invalid afternoon time logs for {date.strftime('%B %d, %Y')}."
        )
    if not is_within_range(
        start_time, time_in_logs, time_out_logs, is_compressed_time, is_overtime
    ):
        raise TimeLogsError(
            f"Time logs are not within the proper range for {date.strftime('%B %d, %Y')}."
        )
    return True


def is_within_range(
    start_time: str,
    time_in_logs: str,
    time_out_logs: str,
    is_compressed_time: bool,
    is_overtime: bool,
):
    start_time_obj = datetime.strptime(start_time, "%H:%M")
    # break_time for compressed time is 4h30min after start_time
    # break_time for non-compressed time is 4h after start_time
    break_time = (
        start_time_obj + timedelta(hours=4, minutes=30)
        if is_compressed_time
        else start_time_obj + timedelta(hours=4)
    )
    # time_out for compressed time is 8h30min after start_time
    # time_out for non-compressed time is 9h after start_time
    time_out = (
        start_time_obj + timedelta(hours=8, minutes=30)
        if is_compressed_time
        else start_time_obj + timedelta(hours=9)
    )
    time_in_logs_arr = time_in_logs.strip().split("\n")
    time_in_obj_arr = [
        datetime.strptime(time_obj, "%H:%M").time() for time_obj in time_in_logs_arr
    ]
    time_out_logs_arr = time_out_logs.strip().split("\n")
    time_out_obj_arr = [
        datetime.strptime(time_obj, "%H:%M").time() for time_obj in time_out_logs_arr
    ]

    if is_overtime:
        return (
            time_in_obj_arr[0] < break_time.time()
            and time_in_obj_arr[1] <= break_time.time()
        )
    return (
        time_in_obj_arr[0] < break_time.time()
        and time_in_obj_arr[1] <= break_time.time()
        and time_out_obj_arr[0] < time_out.time()
        and time_out_obj_arr[1] <= time_out.time()
    )
