import EmailIcon from "@mui/icons-material/Email";
import { Box, Button, Modal, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type FC } from "react";

interface SendPayslipModalProps {
  isOpen: boolean;
  isSending: boolean;
  employeeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const SendPayslipModal: FC<SendPayslipModalProps> = ({
  isOpen,
  isSending,
  employeeName,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent>
        <Box sx={{ display: "flex", gap: "1rem" }}>
          <EmailIcon sx={{ color: "#E67E22", fontSize: "3rem" }} />
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Send Payslip</Typography>
            <Typography>
              This will email {employeeName}&apos;s payslip PDF to their address
              on file. Send now?
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "end", gap: "0.5rem" }}>
          <Button
            variant="outlined"
            disabled={isSending}
            sx={{ border: "1px solid #E67E22", color: "#E67E22" }}
            onClick={() => onClose()}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isSending}
            sx={{ background: "#E67E22" }}
            onClick={() => onConfirm()}
          >
            {isSending ? "Sending…" : "Send Payslip"}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default SendPayslipModal;

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
  width: "400px",
});
