import React, { useState } from "react";
import { Form } from "./components/Form.js";
import { Map } from "./components/Map.js";
import { Chart } from "./components/Chart.js";

function App() {
  const [response, setResponse] = useState();
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");

  return (
    <div className="App" style={{ height: "100vh" }}>
      <Map response={response} departure={departure} arrival={arrival} />
      <Form
        setResponse={setResponse}
        departure={departure}
        setDeparture={setDeparture}
        arrival={arrival}
        setArrival={setArrival}
      />
      <Chart response={response} />
    </div>
  );
}

export default App;
