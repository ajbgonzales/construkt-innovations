import re

from datetime import datetime


def get_date_range(date_str: str):
    dates = re.findall(r"\d{4}-\d{2}-\d{2}", date_str)
    start_date = datetime.fromisoformat(dates[0])
    end_date = datetime.fromisoformat(dates[1])

    return start_date, end_date
