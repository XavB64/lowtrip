import React, { useState } from "react";
import { Form } from "./components/Form.jsx";
import { Map } from "./components/Map.jsx";
import { Chart } from "./components/Chart.jsx";
import { Container, Stack } from "@mui/material";

function App() {
  const [response, setResponse] = useState();
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");

  return (
    <Stack direction="row" className="App" style={{ height: "100vh" }}>
      <Stack padding={3} maxWidth="25%" justifyContent="space-between">
        <Form
          setResponse={setResponse}
          departure={departure}
          setDeparture={setDeparture}
          arrival={arrival}
          setArrival={setArrival}
        />
        <Chart response={response} />
      </Stack>
      <Container style={{ padding: 0 }}>
        <Map response={response} departure={departure} arrival={arrival} />
      </Container>
    </Stack>
  );
}

export default App;
