import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export function Map({ response, departure, arrival }) {
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  return (
    <MapContainer center={[48, 20]} zoom={5} scrollWheelZoom={true}>
      <TileLayer url="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png" />
      {response &&
        JSON.parse(response.data.gdf).features.map((feature) => (
          <Polyline
            key={feature.id}
            pathOptions={{ color: feature.properties.colors }}
            positions={feature.geometry.coordinates.map((coordinate) => [
              coordinate[1],
              coordinate[0],
            ])}
          />
        ))}
      {departure && <Marker position={departure.split(", ")} />}
      {arrival && <Marker position={arrival.split(", ")} />}
    </MapContainer>
  );
}
