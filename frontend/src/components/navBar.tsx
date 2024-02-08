import * as React from "react";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";

const navItems = ["Methodology", "About", "Licenses", "Contact"];

const NavBar = () => (
  <AppBar position="static" style={{ background: "#0097A7" }}>
    <Toolbar>
      <Typography
        variant="h5"
        component="div"
        sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
      >
        LowTrip
      </Typography>
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        {navItems.map((item) => (
          <Button key={item} sx={{ color: "#fff" }}>
            {item}
          </Button>
        ))}
      </Box>
    </Toolbar>
  </AppBar>
);

export default NavBar;
