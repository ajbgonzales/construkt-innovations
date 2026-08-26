import { Route, Routes } from "react-router";
import {
  AddNewEmployee,
  Attendance,
  EmployeeProfile,
  EmployeeProfileEdit,
  Employees,
  NewOvertimeRequest,
  OvertimeRequestEdit,
  OvertimeRequestPage,
  OvertimeRequests,
  PayrollPeriodPage,
  PayslipGenerator,
} from "@/pages";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Attendance />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/employees/new" element={<AddNewEmployee />} />
      <Route path="/employees/:id" element={<EmployeeProfile />} />
      <Route path="/employees/:id/edit" element={<EmployeeProfileEdit />} />
      <Route path="/overtime-requests" element={<OvertimeRequests />} />
      <Route path="/overtime-requests/new" element={<NewOvertimeRequest />} />
      <Route path="/overtime-requests/:id" element={<OvertimeRequestPage />} />
      <Route
        path="/overtime-requests/:id/edit"
        element={<OvertimeRequestEdit />}
      />
      <Route path="/payslip-generator" element={<PayslipGenerator />} />
      <Route path="/payroll-periods/:id" element={<PayrollPeriodPage />} />
    </Routes>
  );
};

export default AppRoutes;
