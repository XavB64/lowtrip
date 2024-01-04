export function LocationInput({ inputRef, ...props }) {
  return (
    <input
      ref={inputRef}
      {...props}
      style={{
        display: "flex",
        height: 35,
        width: "-webkit-fill-available",
        borderRadius: 10,
        borderWidth: 0,
        paddingLeft: 7,
        paddingRoght: 7,
      }}
    />
  );
}
