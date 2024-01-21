import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { ApiResponse, Gdf } from "../types";

interface MapProps {
  response?: ApiResponse;
  stepsCoords: [number, number][];
}

export const Map = ({ response, stepsCoords }: MapProps) => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  return (
    <MapContainer center={[48, 20]} zoom={5} scrollWheelZoom={true}>
      <MapContent response={response} stepsCoords={stepsCoords} />
    </MapContainer>
  );
};

const MapContent = ({ response, stepsCoords }: MapProps) => {
  const map = useMap();

  useEffect(() => {
    if (stepsCoords.length > 1) {
      const maxLat = Math.max(...stepsCoords.map((stepCoord) => stepCoord[0]));
      const minLat = Math.min(...stepsCoords.map((stepCoord) => stepCoord[0]));
      const maxLng = Math.max(...stepsCoords.map((stepCoord) => stepCoord[1]));
      const minLng = Math.min(...stepsCoords.map((stepCoord) => stepCoord[1]));
      map.flyToBounds([
        [minLat, minLng],
        [maxLat, maxLng],
      ]);
    }
  }, [map, stepsCoords]);

  return (
    <>
      <TileLayer url="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png" />
      {response &&
        (JSON.parse(response.data.gdf) as Gdf).features.map((feature) => (
          <Polyline
            key={feature.id}
            pathOptions={{ color: feature.properties.colors }}
            positions={feature.geometry.coordinates.map((coordinate) => [
              coordinate[1],
              coordinate[0],
            ])}
          />
        ))}
      {stepsCoords.map((coords, index) => (
        <Marker key={index} position={coords} />
      ))}
    </>
  );
};
