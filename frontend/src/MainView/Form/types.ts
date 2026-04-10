export type City = {
  id: number;
  name: string;
  lon: string;
  lat: string;
};

export type PhotonApiCity = {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    place_id: number;
    name: string;
    state: string;
    country: string;
  };
};
