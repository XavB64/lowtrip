import * as React from "react";
import { AppBar, Box, Button, Toolbar } from "@mui/material";
import logo from "../assets/logo.png";

const navItems = ["Methodology", "About", "Licenses", "Contact"];

const NavBar = () => (
  <AppBar position="static" style={{ background: "#0097A7" }}>
    <Toolbar>
      <div style={{ flexGrow: 1, height: 64 }}>
        <img src={logo} height="100%" alt="Lowtrip logo" />
      </div>
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
