import re

from datetime import datetime, time
from .exceptions import TimeLogsError


def get_time_logs(
    rows,
    index: int,
    date: datetime,
    col_num: int,
    is_compressed_time: bool,
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
        if has_valid_time_logs(date, time_in_logs, time_out_logs, is_compressed_time):
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
    date: datetime, time_in_logs: str, time_out_logs: str, is_compressed_time: bool
):
    """
    Validates each time log whether:
    1. It has the correct pattern (ex. "08:00\n17:00")
    2. Time in logs are before 12:00 (12:30 for compressed time)
    3. Time out logs are before 17:00 (16:30 for compressed time)
    4. # TODO: overtime?
    """
    if not re.fullmatch(r"\d{2}:\d{2}\n\d{2}:\d{2}", time_in_logs):
        raise TimeLogsError(
            f"Invalid morning time logs for {date.strftime('%B %d, %Y')}."
        )
    if not isinstance(time_out_logs, str):
        raise TimeLogsError(f"No afternoon time logs for {date.strftime('%B %d, %Y')}.")
    if not re.fullmatch(r"\d{2}:\d{2}\n\d{2}:\d{2}", time_out_logs):
        raise TimeLogsError(
            f"Invalid afternoon time logs for {date.strftime('%B %d, %Y')}."
        )
    if not is_within_range(time_in_logs, time_out_logs, is_compressed_time):
        raise TimeLogsError(
            f"Time logs are not within the proper range for {date.strftime('%B %d, %Y')}."
        )
    return True


def is_within_range(time_in_logs: str, time_out_logs: str, is_compressed_time: bool):
    break_time = time(12, 0) if not is_compressed_time else time(12, 30)
    time_out = time(17, 0) if not is_compressed_time else time(16, 30)
    time_in_logs_arr = time_in_logs.strip().split("\n")
    time_in_obj_arr = [
        datetime.strptime(time_obj, "%H:%M").time() for time_obj in time_in_logs_arr
    ]
    time_out_logs_arr = time_out_logs.strip().split("\n")
    time_out_obj_arr = [
        datetime.strptime(time_obj, "%H:%M").time() for time_obj in time_out_logs_arr
    ]
    return (
        time_in_obj_arr[0] < break_time
        and time_in_obj_arr[1] <= break_time
        and time_out_obj_arr[0] < time_out
        and time_out_obj_arr[1] <= time_out
    )
