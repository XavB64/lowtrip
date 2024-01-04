import { Ref } from "react";

interface StationFieldProps {
  inputRef: Ref<HTMLInputElement>;
  isDeparture?: boolean;
}

const StationField = ({ inputRef, isDeparture }: StationFieldProps) => {
  return (
    <input
      ref={inputRef}
      placeholder={isDeparture ? "From..." : "To..."}
      style={{
        width: "-webkit-fill-available",
        height: "40px",
        padding: "9px",
        border: "1px solid lightgrey",
        borderRadius: "20px",
        backgroundColor: "white",
        marginBottom: 1,
        fontSize: "16px",
      }}
    />
  );
};

export default StationField;
