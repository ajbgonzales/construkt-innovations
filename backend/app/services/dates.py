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
