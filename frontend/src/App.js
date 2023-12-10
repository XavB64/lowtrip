import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [response, setResponse] = useState({});

  useEffect(() => {
    const formData = new FormData();
    formData.append("departure_coord", "48.88119, 2.35515");
    formData.append("arrival_coord", "52.50989, 13.49692");
    axios
      .post("http://localhost:8000", formData, {
        headers: { "Access-Contol-Allow-Origin": "*" },
      })
      .then((response) => {
        console.log("SUCCESS", response);
        setResponse(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>
          {response.status === 200 ? (
            <>
              <p>{JSON.stringify(response.data.gdf)}</p>
              <p>{JSON.stringify(response.data.plot_div)}</p>
            </>
          ) : (
            <p>LOADING</p>
          )}
        </div>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
