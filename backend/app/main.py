import os
from typing import ClassVar

from admin_auth import AdminAuth
from api.routes import router as api_router
from db import engine
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from orm.employee import Employee
from orm.project import Project
from sqladmin import Admin, ModelView

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(api_router, prefix="/api")

authentication_backend = AdminAuth(secret_key=os.getenv("SESSION_SECRET_KEY"))
admin = Admin(app, engine, authentication_backend=authentication_backend)


class EmployeeAdmin(ModelView, model=Employee):
    name = "Employee"
    name_plural = "Employees"
    icon = "fa-solid fa-user"
    column_list: ClassVar = [
        Employee.full_name,
        Employee.employee_id,
        "project_ref.name",
        Employee.position,
        Employee.rate,
        Employee.allowance,
        Employee.sss,
        Employee.hdmf,
        Employee.phic,
        Employee.created_at,
    ]
    column_searchable_list: ClassVar = [
        Employee.full_name,
        Employee.employee_id,
        "project_ref.name",
    ]
    column_sortable_list: ClassVar = [
        Employee.full_name,
        Employee.employee_id,
        "project_ref.name",
        Employee.created_at,
    ]


class ProjectAdmin(ModelView, model=Project):
    name = "Project"
    name_plural = "Projects"
    icon = "fa-solid fa-diagram-project"
    column_list: ClassVar = [Project.name]
    column_searchable_list: ClassVar = [Project.name]
    column_sortable_list: ClassVar = [Project.name]


admin.add_view(EmployeeAdmin)
admin.add_view(ProjectAdmin)
