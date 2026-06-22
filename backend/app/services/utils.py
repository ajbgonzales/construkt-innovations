from pandas import DataFrame

from services.dataframe import get_loc_given_substring


def get_employee_attribute(df: DataFrame, rows: list, index: int, label: str):
    _, col = get_loc_given_substring(df, label)
    cols = df.columns.tolist()
    name_col = cols[cols.index(col) + 1]
    return getattr(rows[index], name_col)
