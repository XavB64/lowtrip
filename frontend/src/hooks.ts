import { useEffect, useRef, useState } from "react";

export function useDestination() {
  const [locationCoords, setLocationCoords] = useState<[number, number]>();
  const autoCompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      // @ts-ignore
      autoCompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        { fields: ["geometry", "name"] }
      );
    }
    if (autoCompleteRef.current) {
      // @ts-ignore
      autoCompleteRef.current.addListener("place_changed", async function () {
        // @ts-ignore
        const place = await autoCompleteRef.current.getPlace();
        setLocationCoords([
          place.geometry.location.lat(),
          place.geometry.location.lng(),
        ]);
      });
    }
  }, [inputRef]);

  return {
    inputRef,
    autoCompleteRef,
    locationCoords,
    setLocationCoords,
  };
}
