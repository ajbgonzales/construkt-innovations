from pandas import DataFrame


def get_loc_given_substring(df: DataFrame, substring: str):
    mask = df.apply(lambda col: col.astype(str).str.contains(substring)).stack()
    row, col = mask[mask].index.tolist()[0]
    return row, col
