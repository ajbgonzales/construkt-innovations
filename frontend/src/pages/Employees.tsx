import {
  ActionsContainer,
  Header,
  RecentProfilesTable,
} from "@/components/Employees";
import { Box } from "@mui/material";
import { useState } from "react";

const Employees = () => {
  const [search, setSearch] = useState<string>("");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <Header />
      <ActionsContainer search={search} onSearchChange={setSearch} />
      <RecentProfilesTable search={search} />
    </Box>
  );
};

export default Employees;
