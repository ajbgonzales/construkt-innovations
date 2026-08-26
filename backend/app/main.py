import os
from typing import ClassVar

from admin_auth import AdminAuth
from api.routes import router as api_router
from db import engine
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from orm.employee import Employee
from orm.holiday import Holiday
from orm.overtime_request import OvertimeRequest
from orm.payroll_period import PayrollPeriod
from orm.payroll_record import PayrollRecord
from orm.payslip import Payslip
from orm.payslip_approver import PayslipApprover
from orm.project import Project
from sqladmin import Admin, ModelView
from sqladmin.fields import FileField
from sqlalchemy import func, select
from starlette.requests import Request

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
        Employee.others,
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


class OvertimeRequestAdmin(ModelView, model=OvertimeRequest):
    name = "Overtime Request"
    name_plural = "Overtime Requests"
    icon = "fa-solid fa-clock"
    column_list: ClassVar = [
        OvertimeRequest.date,
        "project_ref.name",
        OvertimeRequest.start_time,
        OvertimeRequest.end_time,
        OvertimeRequest.employees,
        OvertimeRequest.created_at,
    ]
    column_searchable_list: ClassVar = ["project_ref.name"]
    column_sortable_list: ClassVar = [
        OvertimeRequest.date,
        "project_ref.name",
        OvertimeRequest.created_at,
    ]


class HolidayAdmin(ModelView, model=Holiday):
    name = "Holiday"
    name_plural = "Holidays"
    icon = "fa-solid fa-umbrella-beach"
    column_list: ClassVar = [Holiday.date, Holiday.name]
    column_searchable_list: ClassVar = [Holiday.name]
    column_sortable_list: ClassVar = [Holiday.date, Holiday.name]


class PayrollPeriodAdmin(ModelView, model=PayrollPeriod):
    name = "Payroll Period"
    name_plural = "Payroll Periods"
    icon = "fa-solid fa-calendar-week"
    can_create = False
    can_edit = False
    column_list: ClassVar = [
        PayrollPeriod.start_date,
        PayrollPeriod.end_date,
        PayrollPeriod.created_at,
    ]
    column_sortable_list: ClassVar = [PayrollPeriod.start_date, PayrollPeriod.end_date]


class PayrollRecordAdmin(ModelView, model=PayrollRecord):
    name = "Payroll Record"
    name_plural = "Payroll Records"
    icon = "fa-solid fa-file-invoice-dollar"
    can_create = False
    can_edit = False
    column_list: ClassVar = [
        "employee_ref.full_name",
        "project_ref.name",
        PayrollRecord.total_work_hours,
        PayrollRecord.overtime_hours,
        PayrollRecord.gross_amount,
        PayrollRecord.net_amount,
        PayrollRecord.is_flagged,
    ]
    column_searchable_list: ClassVar = ["employee_ref.full_name", "project_ref.name"]
    column_sortable_list: ClassVar = [
        "employee_ref.full_name",
        "project_ref.name",
        PayrollRecord.net_amount,
    ]


class PayslipAdmin(ModelView, model=Payslip):
    name = "Payslip"
    name_plural = "Payslips"
    icon = "fa-solid fa-money-check-dollar"
    can_create = False
    can_edit = False
    column_list: ClassVar = [
        "employee_ref.full_name",
        "project_ref.name",
        Payslip.gross_amount,
        Payslip.net_amount,
        Payslip.is_holiday_pay_eligible,
        Payslip.holiday_date,
        Payslip.generated_at,
    ]
    column_searchable_list: ClassVar = ["employee_ref.full_name", "project_ref.name"]
    column_sortable_list: ClassVar = [
        "employee_ref.full_name",
        Payslip.net_amount,
        Payslip.generated_at,
    ]


class PayslipApproverAdmin(ModelView, model=PayslipApprover):
    name = "Payslip Approver"
    name_plural = "Payslip Approver"
    icon = "fa-solid fa-signature"
    column_list: ClassVar = [PayslipApprover.name, PayslipApprover.updated_at]
    form_columns: ClassVar = [PayslipApprover.name]

    async def scaffold_form(self, rules: list[str] | None = None):
        base_form = await super().scaffold_form(rules)

        class ApproverForm(base_form):
            signature_image_upload = FileField("Signature Image")

        return ApproverForm

    async def on_model_change(
        self, data: dict, model: PayslipApprover, is_created: bool, request: Request
    ) -> None:
        if is_created:
            async with self.session_maker() as session:
                count = await session.scalar(
                    select(func.count()).select_from(PayslipApprover)
                )
            if count >= 1:
                raise ValueError(
                    "Only one Payslip Approver can exist. Edit the existing "
                    "one instead of creating a new one."
                )

        upload = data.pop("signature_image_upload", None)
        if upload is not None:
            content = await upload.read()
            if content:
                model.signature_image = content


admin.add_view(EmployeeAdmin)
admin.add_view(ProjectAdmin)
admin.add_view(OvertimeRequestAdmin)
admin.add_view(HolidayAdmin)
admin.add_view(PayrollPeriodAdmin)
admin.add_view(PayrollRecordAdmin)
admin.add_view(PayslipAdmin)
admin.add_view(PayslipApproverAdmin)
