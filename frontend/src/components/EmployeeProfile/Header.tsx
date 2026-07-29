import { deleteEmployee } from "@/api/employees";
import { EmployeeProfileDeleteModal } from "@/components";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { type FC, useState } from "react";
import { Link, useNavigate } from "react-router";

interface HeaderProps {
  id: string;
  employeeName: string;
}

const Header: FC<HeaderProps> = ({ id, employeeName }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleDeleteModalClose = () => {
    if (isDeleting) return;
    setDeleteError(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteEmployee(id);
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/employees");
    } catch {
      setDeleteError("Failed to delete employee. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <EmployeeProfileDeleteModal
        isOpen={isDeleteModalOpen}
        employeeName={employeeName}
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
      />
      <Container>
        <Box
          sx={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
            gap: "0.5rem",
            width: "100%",
          }}
        >
          <Button
            variant="outlined"
            sx={{ color: "red", border: "1px solid red" }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Profile
          </Button>
          <Link to={`/employees/${id}/edit`}>
            <Button variant="contained" sx={{ background: "#E67E22" }}>
              Edit Profile
            </Button>
          </Link>
        </Box>
      </Container>
    </>
  );
};

export default Header;

const Container = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.5rem",
});
