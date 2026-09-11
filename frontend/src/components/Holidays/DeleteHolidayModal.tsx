import WarningIcon from "@mui/icons-material/Warning";
import { Box, Button, FormHelperText, Modal, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FC } from "react";
import { deleteHoliday, type Holiday } from "@/api/holidays";

interface DeleteHolidayModalProps {
  holiday: Holiday | null;
  onClose: () => void;
}

const DeleteHolidayModal: FC<DeleteHolidayModalProps> = ({
  holiday,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const {
    mutate,
    isPending,
    error,
    reset,
  } = useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      onClose();
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={holiday !== null} onClose={handleClose}>
      <ModalContent>
        <Box sx={{ display: "flex", gap: "1rem" }}>
          <WarningIcon sx={{ color: "red", fontSize: "3rem" }} />
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Delete Holiday</Typography>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{holiday?.name}</strong>?
            </Typography>
            {error && (
              <FormHelperText error>
                Failed to delete holiday. Please try again.
              </FormHelperText>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "end", gap: "0.5rem" }}>
          <Button
            variant="outlined"
            disabled={isPending}
            sx={{ border: "1px solid #E67E22", color: "#E67E22" }}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isPending}
            sx={{ background: "red", color: "#FFF" }}
            onClick={() => holiday && mutate(holiday.id)}
          >
            Delete Holiday
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default DeleteHolidayModal;

const ModalContent = styled(Box)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  boxShadow: "1.5rem",
  background: "#FFF",
  padding: "1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
});
