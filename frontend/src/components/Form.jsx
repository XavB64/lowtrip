import axios from "axios";
import { Box, Button, FormLabel, Grid } from "@mui/material";
import { API_URL } from "../config";
import { LocationInput } from "./LocationInput";

export function Form({ setResponse, departure, arrival }) {
  const handleSubmit = async () => {
    const departurePlace = await departure.autoCompleteRef.current.getPlace();
    const arrivalPlace = await arrival.autoCompleteRef.current.getPlace();
    const formData = new FormData();
    formData.append(
      "departure_coord",
      `${departurePlace.geometry.location.lat()}, ${departurePlace.geometry.location.lng()}`
    );
    formData.append(
      "arrival_coord",
      `${arrivalPlace.geometry.location.lat()}, ${arrivalPlace.geometry.location.lng()}`
    );
    axios
      .post(API_URL, formData, {
        headers: { "Access-Contol-Allow-Origin": "*" },
      })
      .then((response) => {
        setResponse(response);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormLabel>Departure</FormLabel>
          <LocationInput inputRef={departure.inputRef} placeholder="From..." />
        </Grid>
        <Grid item xs={6}>
          <FormLabel>Arrival</FormLabel>
          <LocationInput inputRef={arrival.inputRef} placeholder="To..." />
        </Grid>
        <Grid item xs={12}>
          <Button fullWidth type="submit" onClick={handleSubmit}>
            Emissions computation
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
