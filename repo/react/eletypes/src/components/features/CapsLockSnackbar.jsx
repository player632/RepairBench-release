import React from "react";
import { Slide } from "@mui/material";
import { Alert } from "@mui/material";
import { Snackbar } from "@mui/material";
import { useLocale } from "../../context/LocaleContext";

const CapsLockSnackbar = ({open}) => {
  const { t } = useLocale();

  return (
    <div>
    <Snackbar
      open={open}
      anchorOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <Slide in={open} mountOnEnter unmountOnExit>
        <Alert className="alert" severity="warning" sx={{ width: "100%" }}>
          {t("caps_locked")}
        </Alert>
      </Slide>
    </Snackbar>
  </div>
  );
};

export default CapsLockSnackbar;