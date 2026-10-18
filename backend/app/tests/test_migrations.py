import orm  # noqa: F401  -- registers every model on Base.metadata
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from db import Base, engine


async def test_migrations_match_models():
    def diff(connection):
        context = MigrationContext.configure(connection)
        return compare_metadata(context, Base.metadata)

    async with engine.connect() as conn:
        differences = await conn.run_sync(diff)

    assert differences == [], (
        "ORM models and migrations are out of sync; "
        "run `alembic revision --autogenerate` to add a migration."
    )
