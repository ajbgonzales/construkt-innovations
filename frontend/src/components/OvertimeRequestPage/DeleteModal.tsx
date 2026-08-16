import WarningIcon from "@mui/icons-material/Warning";
import { Box, Button, FormHelperText, Modal, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type FC } from "react";

interface DeleteModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: FC<DeleteModalProps> = ({
  isOpen,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent>
        <Box sx={{ display: "flex", gap: "1rem" }}>
          <WarningIcon sx={{ color: "red", fontSize: "3rem" }} />
          <Box>
            <Typography sx={{ fontWeight: 800 }}>
              Delete Overtime Request
            </Typography>
            <Typography>
              Are you sure you want to delete this overtime request?
            </Typography>
            {errorMessage && (
              <FormHelperText error>{errorMessage}</FormHelperText>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "end", gap: "0.5rem" }}>
          <Button
            variant="outlined"
            disabled={isDeleting}
            sx={{ border: "1px solid #E67E22", color: "#E67E22" }}
            onClick={() => onClose()}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isDeleting}
            sx={{ background: "red", color: "#FFF" }}
            onClick={() => onConfirm()}
          >
            Delete Overtime Request
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default DeleteModal;

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
