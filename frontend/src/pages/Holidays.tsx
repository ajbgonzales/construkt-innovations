import AddIcon from "@mui/icons-material/Add";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import type { Holiday } from "@/api/holidays";
import { PageHeader } from "@/components";
import {
  DeleteHolidayModal,
  HolidayFormModal,
  HolidaysTable,
} from "@/components/Holidays";

const Holidays = () => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  const handleAdd = () => {
    setEditingHoliday(null);
    setIsFormOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHoliday(null);
  };

  return (
    <Container>
      <PageHeader
        headerText="Holidays"
        caption="Manage regular and special non-working holidays."
      />
      <Box sx={{ display: "flex", justifyContent: "end" }}>
        <StyledButton startIcon={<AddIcon />} onClick={handleAdd}>
          Add New Holiday
        </StyledButton>
      </Box>
      <HolidaysTable onEdit={handleEdit} onDelete={setDeletingHoliday} />
      <HolidayFormModal
        isOpen={isFormOpen}
        holiday={editingHoliday}
        onClose={handleCloseForm}
      />
      <DeleteHolidayModal
        holiday={deletingHoliday}
        onClose={() => setDeletingHoliday(null)}
      />
    </Container>
  );
};

export default Holidays;

const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
});

const StyledButton = styled(Button)({
  width: "fit-content",
  background: "#E67E22",
  border: "1px solid #E67E22",
  padding: "12px 20px",
  textTransform: "uppercase",
  color: "#FFF",
  fontWeight: 600,
});
