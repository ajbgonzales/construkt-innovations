import base64
import os

import httpx

POSTMARK_SEND_URL = "https://api.postmarkapp.com/email"


def _server_token() -> str:
    return os.getenv("POSTMARK_SERVER_TOKEN", "")


def _from_email() -> str:
    return os.getenv("POSTMARK_FROM_EMAIL", "")


async def send_payslip_email(
    to_email: str,
    employee_name: str,
    period_start: str,
    period_end: str,
    pdf_bytes: bytes,
) -> None:
    encoded = base64.b64encode(pdf_bytes).decode("ascii")

    payload = {
        "From": _from_email(),
        "To": to_email,
        "Subject": f"Payslip for {period_start} to {period_end}",
        "HtmlBody": (
            f"<p>Hi {employee_name},</p>"
            f"<p>Your payslip for {period_start} to {period_end} is attached.</p>"
        ),
        "Attachments": [
            {
                "Name": f"Payslip - {employee_name} - {period_start} to {period_end}.pdf",
                "Content": encoded,
                "ContentType": "application/pdf",
            }
        ],
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            POSTMARK_SEND_URL,
            json=payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": _server_token(),
            },
        )
        if response.is_error:
            detail = response.text
            try:
                detail = response.json()["Message"]
            except (ValueError, KeyError):
                pass
            raise RuntimeError(f"Postmark error ({response.status_code}): {detail}")
