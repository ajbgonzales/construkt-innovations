import base64
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from jinja2 import Environment, FileSystemLoader, select_autoescape
from orm.payroll_period import PayrollPeriod
from orm.payslip import Payslip
from orm.payslip_approver import PayslipApprover
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from weasyprint import HTML

_env = Environment(
    loader=FileSystemLoader("app/templates"),
    autoescape=select_autoescape(["html"]),
)

MANILA_TZ = ZoneInfo("Asia/Manila")


def _to_manila_time(utc_naive: datetime) -> datetime:
    # generated_at is stored naive in the DB but always in UTC (server_default
    # func.now() on a Postgres instance configured with Etc/UTC).
    return utc_naive.replace(tzinfo=timezone.utc).astimezone(MANILA_TZ)


async def get_current_approver(db: AsyncSession) -> PayslipApprover | None:
    result = await db.execute(
        select(PayslipApprover).order_by(PayslipApprover.updated_at.desc())
    )
    return result.scalars().first()


def _sniff_image_mime_type(image: bytes) -> str:
    if image.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if image.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if image.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if image.startswith(b"RIFF") and image[8:12] == b"WEBP":
        return "image/webp"
    return "application/octet-stream"


async def render_payslip_pdf(
    payslip: Payslip, period: PayrollPeriod, db: AsyncSession
) -> bytes:
    approver = await get_current_approver(db)
    signature_data_uri = None
    if approver is not None and approver.signature_image:
        mime_type = _sniff_image_mime_type(approver.signature_image)
        encoded = base64.b64encode(approver.signature_image).decode("ascii")
        signature_data_uri = f"data:{mime_type};base64,{encoded}"

    template = _env.get_template("payslip.html")
    html = template.render(
        payslip=payslip,
        period=period,
        approver=approver,
        signature_data_uri=signature_data_uri,
        generated_at_local=_to_manila_time(payslip.generated_at),
    )
    return HTML(string=html).write_pdf()
