import re
from datetime import datetime, timedelta


def get_date_range(date_str: str):
    dates = re.findall(r"\d{4}-\d{2}-\d{2}", date_str)
    start_date = datetime.fromisoformat(dates[0])
    end_date = datetime.fromisoformat(dates[1])

    return start_date, end_date


def get_week_range(date_str: str, fmt: str = "%Y-%m-%d") -> tuple[datetime, datetime]:
    date = datetime.strptime(date_str, fmt)
    start_of_week = date - timedelta(days=date.weekday())  # Monday
    end_of_week = start_of_week + timedelta(days=6)  # Sunday
    return start_of_week, end_of_week


def _attributed_month(start_date: datetime, end_date: datetime) -> tuple[int, int]:
    """The (year, month) holding the most days of [start_date, end_date].

    Ties (possible for even-length ranges split evenly across a month
    boundary) go to start_date's month.
    """
    counts: dict[tuple[int, int], int] = {}
    current = start_date
    while current <= end_date:
        key = (current.year, current.month)
        counts[key] = counts.get(key, 0) + 1
        current += timedelta(days=1)

    best_count = max(counts.values())
    candidates = [key for key, count in counts.items() if count == best_count]
    return candidates[0] if len(candidates) == 1 else (start_date.year, start_date.month)


def week_of_month(start_date: datetime, end_date: datetime) -> int:
    """Which numbered week of the month a work week counts as.

    A work week is attributed to whichever month holds the majority of its
    days (see `_attributed_month`), so a week straddling a month boundary
    counts toward exactly one month instead of neither (or both). The
    returned number is that week's 1-based position among the run of
    consecutive work weeks attributed to the same month.
    """
    length = (end_date - start_date).days + 1
    target_month = _attributed_month(start_date, end_date)

    week_number = 1
    cursor_start = start_date - timedelta(days=length)
    cursor_end = end_date - timedelta(days=length)
    while _attributed_month(cursor_start, cursor_end) == target_month:
        week_number += 1
        cursor_start -= timedelta(days=length)
        cursor_end -= timedelta(days=length)

    return week_number
