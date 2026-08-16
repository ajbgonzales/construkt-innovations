import { PageHeader } from "@/components";
import { ActionsContainer, RecentProfilesTable } from "@/components/Employees";
import { Box } from "@mui/material";
import { useState } from "react";

const Employees = () => {
  const [search, setSearch] = useState<string>("");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <PageHeader
        headerText="Employee Directory"
        caption="Manage personnel data, project assignments, and contact information across
        all active projects."
      />
      <ActionsContainer search={search} onSearchChange={setSearch} />
      <RecentProfilesTable search={search} />
    </Box>
  );
};

export default Employees;
