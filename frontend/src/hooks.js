import { useEffect, useRef, useState } from "react";

export function useAddress() {
  const [addressCoords, setAddressCoords] = useState("");
  const autoCompleteRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    autoCompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { options: { fields: ["geometry", "name"] } }
    );
    autoCompleteRef.current.addListener("place_changed", async function () {
      const place = await autoCompleteRef.current.getPlace();
      setAddressCoords(
        `${place.geometry.location.lat()}, ${place.geometry.location.lng()}`
      );
    });
  }, [inputRef]);

  return { inputRef, autoCompleteRef, addressCoords, setAddressCoords };
}
