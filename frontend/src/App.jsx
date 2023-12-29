import React, { useState } from "react";
import { Form } from "./components/Form.jsx";
import { Map } from "./components/Map.jsx";
import { Chart } from "./components/Chart.jsx";
import { Container, Stack } from "@mui/material";
import { useAddress } from "./hooks.js";

function App() {
  const [response, setResponse] = useState();
  const departure = useAddress();
  const arrival = useAddress();

  return (
    <Stack direction="row" className="App" style={{ height: "100vh" }}>
      <Stack padding={3} maxWidth="25%" justifyContent="space-between">
        <Form
          setResponse={setResponse}
          departure={departure}
          arrival={arrival}
        />
        <Chart response={response} />
      </Stack>
      <Container style={{ padding: 0 }}>
        <Map
          response={response}
          departureCoords={departure.addressCoords}
          arrivalCoords={arrival.addressCoords}
        />
      </Container>
    </Stack>
  );
}

export default App;
