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
  alternativeStepsCoords: [number, number][];
}

export const Map = ({
  response,
  stepsCoords,
  alternativeStepsCoords,
}: MapProps) => {
  return (
    <MapContainer center={[48, 20]} zoom={5} scrollWheelZoom={true}>
      <MapContent
        response={response}
        stepsCoords={stepsCoords}
        alternativeStepsCoords={alternativeStepsCoords}
      />
    </MapContainer>
  );
};

const MapContent = ({
  response,
  stepsCoords,
  alternativeStepsCoords,
}: MapProps) => {
  const map = useMap();

  useEffect(() => {
    const allCoords = [...stepsCoords, ...alternativeStepsCoords];
    if (allCoords.length > 1) {
      const lats = allCoords.map((coords) => coords[0]);
      const lons = allCoords.map((coords) => coords[1]);
      const maxLat = Math.max(...lats);
      const minLat = Math.min(...lats);
      const maxLng = Math.max(...lons);
      const minLng = Math.min(...lons);
      map.flyToBounds([
        [minLat, minLng],
        [maxLat, maxLng],
      ]);
    }
  }, [map, stepsCoords, alternativeStepsCoords]);

  return (
    <>
      <TileLayer url="https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png" />
      {response &&
        (JSON.parse(response.data.gdf) as Gdf).features.map((feature) => {
          return (
            <Polyline
              key={JSON.stringify(feature.geometry.coordinates)}
              pathOptions={{ color: feature.properties.colors }}
              positions={feature.geometry.coordinates.map((coordinate) => [
                coordinate[1],
                coordinate[0],
              ])}
            />
          );
        })}
      {stepsCoords.map((coords, index) => (
        <Marker
          key={index}
          position={coords}
          icon={getMarkerIcon(
            index === 0 || index === stepsCoords.length - 1
              ? "#0097A7"
              : "#93D3DB"
          )}
        />
      ))}
      {alternativeStepsCoords.map((coords, index) => (
        <Marker
          key={index}
          position={coords}
          icon={getMarkerIcon(
            index === 0 || index === alternativeStepsCoords.length - 1
              ? "#FF758F"
              : "#FFBBC7"
          )}
        />
      ))}
    </>
  );
};

function getMarkerIcon(color: string) {
  return L.divIcon({
    html: `
    <svg width="30" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_105_82)">
    <g filter="url(#filter0_f_105_82)">
    <path d="M826.543 834.032C711.667 908.069 560.057 976.308 470.192 970.503C505.228 881.569 583.906 658.206 672.549 571.971C766.569 480.505 861.812 485.99 927.65 564.488C983.982 631.651 948.021 755.739 826.543 834.032Z" fill="black" fill-opacity="0.14"/>
    </g>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M507.323 975C618.186 864.933 839.913 592.85 839.913 385.057C839.913 165.321 728.85 25 507.323 25C285.796 25 161 149.199 161 385.057C161 573.743 391.882 856.971 507.323 975ZM500.158 451.933C574.027 451.933 633.91 392.05 633.91 318.18C633.91 244.311 574.027 184.428 500.158 184.428C426.288 184.428 366.405 244.311 366.405 318.18C366.405 392.05 426.288 451.933 500.158 451.933Z" fill="${color}"/>
    </g>
    <defs>
    <filter id="filter0_f_105_82" x="370.192" y="404.491" width="683.441" height="666.358" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
    <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_105_82"/>
    </filter>
    <clipPath id="clip0_105_82">
    <rect width="1000" height="1000" fill="white"/>
    </clipPath>
    </defs>
    </svg>`,
    className: "svg-icon",
    iconAnchor: [12, 24],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });
}
