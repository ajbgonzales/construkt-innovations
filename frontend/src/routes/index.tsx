import { Route, Routes } from "react-router";
import AddNewEmployee from "@/pages/AddNewEmployee";
import { Attendance, Employees } from "@/pages";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Attendance />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/employees/new" element={<AddNewEmployee />} />
    </Routes>
  );
};

export default AppRoutes;
