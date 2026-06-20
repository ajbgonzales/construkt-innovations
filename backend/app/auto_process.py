"""
auto_process.py — Standalone runner for the attendance spreadsheet pipeline.

Filename convention (all fields separated by underscores):
  {ProjectName}_{HHMM}_{is_compressed}_{is_overtime}_{working_days}.xlsx

  - ProjectName    : any string (underscores allowed — parsed from the left)
  - HHMM           : 4-digit start time, e.g. 0800
  - is_compressed  : "true" or "false"
  - is_overtime    : "true" or "false"
  - working_days   : integer, e.g. 5

Example: AlphaTeam_0800_true_false_5.xlsx
         My_Project_0800_false_true_6.xlsx

Usage:
  python auto_process.py --input-dir ./incoming --state-file ./processed.json
"""

import argparse
import json
import sys
import os

# Ensure the app directory is on the path so relative imports work
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
from pathlib import Path
from services.spreadsheet_processor import clean_attendance_spreadsheet, compile_spreadsheets


# ── Filename parser ────────────────────────────────────────────────────────────

def parse_metadata_from_filename(filename: str) -> dict:
    """
    Parse project metadata encoded in the filename.

    Expected tail (last 4 underscore-separated tokens before .xlsx):
        {HHMM}_{is_compressed}_{is_overtime}_{working_days}

    Everything before these 4 tokens is the project name.
    """
    stem = Path(filename).stem  # strip .xlsx
    parts = stem.split("_")

    if len(parts) < 5:
        raise ValueError(
            f"Filename '{filename}' does not match the required convention: "
            f"{{ProjectName}}_{{HHMM}}_{{is_compressed}}_{{is_overtime}}_{{working_days}}.xlsx\n"
            f"Example: AlphaTeam_0800_true_false_5.xlsx"
        )

    working_days_str  = parts[-1]
    is_overtime_str   = parts[-2]
    is_compressed_str = parts[-3]
    start_time_str    = parts[-4]
    project_name      = "_".join(parts[:-4])

    # Validate and coerce each field
    if not (start_time_str.isdigit() and len(start_time_str) == 4):
        raise ValueError(
            f"start_time token '{start_time_str}' in '{filename}' must be a 4-digit HHMM value (e.g. 0800)."
        )
    start_time = f"{start_time_str[:2]}:{start_time_str[2:]}"  # "0800" → "08:00"

    if is_compressed_str.lower() not in ("true", "false"):
        raise ValueError(
            f"is_compressed token '{is_compressed_str}' in '{filename}' must be 'true' or 'false'."
        )
    is_compressed = is_compressed_str.lower() == "true"

    if is_overtime_str.lower() not in ("true", "false"):
        raise ValueError(
            f"is_overtime token '{is_overtime_str}' in '{filename}' must be 'true' or 'false'."
        )
    is_overtime = is_overtime_str.lower() == "true"

    if not working_days_str.isdigit():
        raise ValueError(
            f"working_days token '{working_days_str}' in '{filename}' must be an integer."
        )
    working_days = int(working_days_str)

    return {
        "project_name": project_name,
        "start_time": start_time,
        "is_compressed": is_compressed,
        "is_overtime": is_overtime,
        "working_days": working_days,
    }


# ── State tracking ─────────────────────────────────────────────────────────────

def load_state(state_file: Path) -> dict:
    if state_file.exists():
        with open(state_file) as f:
            return json.load(f)
    return {"processed": []}


def save_state(state_file: Path, state: dict):
    with open(state_file, "w") as f:
        json.dump(state, f, indent=2)


# ── Main pipeline ──────────────────────────────────────────────────────────────

def run(input_dir: Path, state_file: Path, output_dir: Path):
    state = load_state(state_file)
    already_processed = set(state.get("processed", []))

    xlsx_files = sorted(input_dir.glob("*.xlsx"))
    new_files = [f for f in xlsx_files if f.name not in already_processed]

    if not new_files:
        print("No new files to process.")
        return

    print(f"Found {len(new_files)} new file(s): {[f.name for f in new_files]}")

    processed_project_names = []
    errors = []

    for file_path in new_files:
        print(f"\n→ Processing: {file_path.name}")
        try:
            metadata = parse_metadata_from_filename(file_path.name)
            print(f"  Metadata: {metadata}")

            df = pd.read_excel(file_path)
            df = df.dropna(how="all").dropna(axis=1, how="all")

            # Redirect output to the output_dir
            original_cwd = os.getcwd()
            os.chdir(output_dir.parent)  # processor saves relative to cwd
            clean_attendance_spreadsheet(df, metadata)
            os.chdir(original_cwd)

            processed_project_names.append(metadata["project_name"])
            already_processed.add(file_path.name)
            print(f"  ✓ Saved: {metadata['project_name']}.xlsx")

        except Exception as e:
            print(f"  ✗ Error processing '{file_path.name}': {e}")
            errors.append({"file": file_path.name, "error": str(e)})

    # Compile all processed project files into compiled.xlsx
    if processed_project_names:
        file_paths = [str(output_dir / f"{name}.xlsx") for name in processed_project_names]
        compiled_path = str(output_dir / "compiled.xlsx")
        try:
            compile_spreadsheets(file_paths, compiled_path)
            print(f"\n✓ Compiled output saved to: {compiled_path}")
        except Exception as e:
            print(f"\n✗ Failed to compile spreadsheets: {e}")
            errors.append({"file": "compiled.xlsx", "error": str(e)})

    # Persist state
    state["processed"] = list(already_processed)
    save_state(state_file, state)
    print(f"\nState updated. Total processed: {len(already_processed)} file(s).")

    if errors:
        print(f"\n⚠ {len(errors)} error(s) occurred:")
        for err in errors:
            print(f"  - {err['file']}: {err['error']}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-process attendance spreadsheets.")
    parser.add_argument(
        "--input-dir",
        default=str(Path(__file__).parent / "incoming"),
        help="Folder where downloaded .xlsx files are placed (default: ./app/incoming)",
    )
    parser.add_argument(
        "--state-file",
        default=str(Path(__file__).parent / "processed_state.json"),
        help="JSON file tracking already-processed filenames",
    )
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).parent / "records"),
        help="Folder where processed .xlsx and compiled.xlsx are saved",
    )
    args = parser.parse_args()

    input_dir  = Path(args.input_dir)
    state_file = Path(args.state_file)
    output_dir = Path(args.output_dir)

    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    run(input_dir, state_file, output_dir)
