import React, { useState } from "react";
import { Form } from "./components/Form.jsx";
import { Map } from "./components/Map.jsx";
import { Chart } from "./components/Chart.jsx";
import { Container, Stack } from "@mui/material";
import "./styles.css";
import { NewForm } from "./components/NewForm.jsx";

function App() {
  const [response, setResponse] = useState();
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");

  return (
    <Stack direction="row" className="App" style={{ height: "100vh" }}>
      <Stack
        maxWidth="40%"
        justifyContent="space-between"
        height="100%"
        overflow="auto"
      >
        <Stack padding={3}>
          <Stack padding={3} justifyItems="center">
            <h1 className="title">Compare the emissions from your travels</h1>
          </Stack>
          <NewForm />
          {/* <Form
            setResponse={setResponse}
            departure={departure}
            setDeparture={setDeparture}
            arrival={arrival}
            setArrival={setArrival}
          /> */}
          <Chart response={response} />
        </Stack>
      </Stack>
      <Container style={{ padding: 0 }}>
        <Map response={response} departure={departure} arrival={arrival} />
      </Container>
    </Stack>
  );
}

export default App;
