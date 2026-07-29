import os
import secrets

from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = str(form.get("username", ""))
        password = str(form.get("password", ""))

        is_valid_username = secrets.compare_digest(
            username, os.getenv("ADMIN_USERNAME", "")
        )
        is_valid_password = secrets.compare_digest(
            password, os.getenv("ADMIN_PASSWORD", "")
        )
        if not (is_valid_username and is_valid_password):
            return False

        request.session.update({"authenticated": True})
        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return request.session.get("authenticated", False)
