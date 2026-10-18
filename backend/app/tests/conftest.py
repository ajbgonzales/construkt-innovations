import os
from pathlib import Path

import pytest
from sqlalchemy.engine import make_url

# The app reads its configuration from the environment at import time, so
# point it at the test database before anything from the app is imported.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    pytest.exit(
        "TEST_DATABASE_URL must be set, e.g. "
        "postgresql+asyncpg://user:password@localhost:5433/construkt_test",
        returncode=4,
    )
# Every test truncates all tables, so refuse to run against anything that
# doesn't look like a dedicated test database.
if "test" not in (make_url(TEST_DATABASE_URL).database or ""):
    pytest.exit(
        "TEST_DATABASE_URL must point at a database whose name contains "
        "'test'; the test suite wipes every table in it.",
        returncode=4,
    )

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["POSTMARK_SERVER_TOKEN"] = "test-token"
os.environ.setdefault("POSTMARK_FROM_EMAIL", "payroll@example.test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("SESSION_SECRET_KEY", "test-secret")
os.environ.setdefault("ADMIN_USERNAME", "admin")
os.environ.setdefault("ADMIN_PASSWORD", "admin")

import api.routes as routes  # noqa: E402
import httpx  # noqa: E402
import services.spreadsheet_processor as spreadsheet_processor  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from db import AsyncSessionLocal, Base, engine  # noqa: E402
from main import app  # noqa: E402
from sqlalchemy import text  # noqa: E402

ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


@pytest.fixture(scope="session", autouse=True)
def migrated_database():
    # Rebuild the schema from scratch with the real migrations, which also
    # exercises every downgrade on databases left over from a previous run.
    config = Config(str(ALEMBIC_INI))
    command.downgrade(config, "base")
    command.upgrade(config, "head")


@pytest.fixture(autouse=True)
async def clean_tables(migrated_database):
    yield
    table_names = ", ".join(table.name for table in Base.metadata.sorted_tables)
    async with engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))


@pytest.fixture(autouse=True)
def sent_emails(monkeypatch):
    """Records payslip emails instead of sending them through Postmark."""
    sent: list[str] = []

    async def fake_send_payslip_email(to_email, **kwargs):
        sent.append(to_email)

    monkeypatch.setattr(routes, "send_payslip_email", fake_send_payslip_email)
    return sent


@pytest.fixture(autouse=True)
def stub_payslip_pdf(monkeypatch):
    async def fake_render_payslip_pdf(payslip, period, db):
        return b"%PDF-test"

    monkeypatch.setattr(routes, "render_payslip_pdf", fake_render_payslip_pdf)


@pytest.fixture
def stub_full_day_hours(monkeypatch):
    """Makes every employee log a clean 8-hour day without real time logs."""

    async def fake_get_hours(**kwargs):
        return 8.0, 0.0, "No", None

    monkeypatch.setattr(spreadsheet_processor, "get_hours", fake_get_hours)


@pytest.fixture
async def db():
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
