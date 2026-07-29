import { Route, Routes } from "react-router";
import AddNewEmployee from "@/pages/AddNewEmployee";
import {
  Attendance,
  EmployeeProfile,
  EmployeeProfileEdit,
  Employees,
} from "@/pages";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Attendance />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/employees/new" element={<AddNewEmployee />} />
      <Route path="/employees/:id" element={<EmployeeProfile />} />
      <Route path="/employees/:id/edit" element={<EmployeeProfileEdit />} />
    </Routes>
  );
};

export default AppRoutes;
