import { Box, Typography } from "@mui/material";
import { type FC } from "react";

interface PageHeaderProps {
  headerText: string;
  caption?: string;
}

const PageHeader: FC<PageHeaderProps> = ({ headerText, caption }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      <Typography
        sx={{ fontFamily: "Public Sans", fontSize: "24px", fontWeight: 600 }}
      >
        {headerText}
      </Typography>
      {caption && (
        <Typography sx={{ fontFamily: "Public Sans" }}>{caption}</Typography>
      )}
    </Box>
  );
};

export default PageHeader;
