import re

from datetime import datetime, timedelta

from typing import Literal

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

    try:
        time_logs = getattr(rows[index], f"col_{col_num}")
    except IndexError:
        return time_in, time_out, is_flagged, notes

    # Employee is absent
    if (
        not isinstance(time_logs, str)
        or time_logs == "User ID:"
        or re.match(r"^\d+$", time_logs)
    ):
        return time_in, time_out, is_flagged, notes

    try:
        if has_valid_time_logs(
            date,
            start_time,
            time_logs,
            is_compressed_time,
            is_overtime,
        ):
            time_obj_arr = _get_time_obj_arr(time_logs)
            time_in = _get_time_in(date, start_time, time_obj_arr)
            time_out = _get_time_out(
                date, start_time, time_obj_arr, is_compressed_time, is_overtime
            )
            return time_in, time_out, is_flagged, notes
    except TimeLogsError as e:
        is_flagged = "Yes"
        notes = e.message
        return time_in, time_out, is_flagged, notes


def has_valid_time_logs(
    date: datetime,
    start_time: str,
    time_logs: str,
    is_compressed_time: bool,
    is_overtime: bool,
):
    # It has the correct pattern (ex. "08:00\n17:00")
    if not re.fullmatch(r"\d{2}:\d{2}\n\d{2}:\d{2}", time_logs):
        raise TimeLogsError(f"Invalid time logs for {date.strftime('%B %d, %Y')}.")
    if not is_within_range(start_time, time_logs, is_compressed_time, is_overtime):
        raise TimeLogsError(
            f"Time logs are not within the proper range for {date.strftime('%B %d, %Y')}."
        )
    return True


def is_within_range(
    start_time: str,
    time_logs: str,
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
    time_logs_arr = time_logs.strip().split("\n")
    time_logs_obj_arr = [
        datetime.strptime(time_obj, "%H:%M").time() for time_obj in time_logs_arr
    ]

    if is_overtime:
        return (
            time_logs_obj_arr[0] < break_time.time()
            and time_logs_obj_arr[1] >= break_time.time()
        )
    return (
        time_logs_obj_arr[0] <= break_time.time()
        and time_logs_obj_arr[1] >= break_time.time()
        and time_logs_obj_arr[1] <= (time_out + timedelta(minutes=10)).time()
    )


def is_time_within_timedelta(
    time1: datetime.time,
    time2: datetime.time,
    attr: Literal["hours", "minutes", "seconds"],
    delta: int,
):
    t2 = datetime.combine(datetime.min, time2)
    t1 = datetime.combine(datetime.min, time1)
    if attr == "hours":
        return t2 - t1 <= timedelta(hours=delta)
    elif attr == "minutes":
        return t2 - t1 <= timedelta(minutes=delta)
    else:
        return t2 - t1 <= timedelta(seconds=delta)


def _get_time_obj_arr(time_logs):
    time_logs_arr = time_logs.strip().split("\n")
    return [datetime.strptime(time_obj, "%H:%M").time() for time_obj in time_logs_arr]


def _get_time_in(date, start_time, time_obj_arr):
    start_time_obj = datetime.strptime(start_time, "%H:%M").time()

    if time_obj_arr[0] <= start_time_obj or is_time_within_timedelta(
        start_time_obj, time_obj_arr[0], "minutes", 10
    ):
        return datetime.combine(date, start_time_obj)
    else:
        return datetime.combine(date, time_obj_arr[0])


def _get_time_out(date, start_time, time_obj_arr, is_compressed_time, is_overtime):
    hours = 8 if is_compressed_time else 9
    minutes = 30 if is_compressed_time else 0
    end_time_obj = datetime.strptime(start_time, "%H:%M") + timedelta(
        hours=hours, minutes=minutes
    )

    if (
        not is_overtime
        and time_obj_arr[1] >= end_time_obj.time()
        and is_time_within_timedelta(
            end_time_obj.time(), time_obj_arr[1], "minutes", 10
        )
    ):
        return datetime.combine(date, end_time_obj.time())
    else:
        return datetime.combine(date, time_obj_arr[1])
