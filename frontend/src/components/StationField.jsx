import { Autocomplete, TextField } from "@mui/material";

const StationField = ({ isDepature, step, updateLocation }) => {
  const stations = [];
  const inputValue = "Paris";
  return (
    <Autocomplete
      disablePortal
      options={stations}
      getOptionLabel={(option) => option.name}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={isDepature ? "From..." : "To..."}
          InputProps={{
            sx: {
              borderRadius: "20px",
              backgroundColor: "white",
              marginBottom: 1,
            },
          }}
        />
      )}
      onChange={(_, value) => {
        // udpate location and coordinates of step
      }}
      filterOptions={(options) =>
        options.filter((option) =>
          option.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
      inputValue={step?.location || ""}
      onInputChange={(_, inputValue) => {}}
    />
  );
};

export default StationField;
