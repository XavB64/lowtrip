import React from "react";

export interface Step {
  index: number;
  locationCoords?: [number, number];
  transportMean?: Transport;
  currentInputRef?: React.MutableRefObject<any>;
}

export enum Transport {
  plane = "Plane",
  car = "Car",
  bus = "Bus",
  train = "Train",
  ferry = "Ferry",
}

export interface ApiResponse {
  data: {
    gdf: string;
    plot_div: string;
  };
}

export interface Gdf {
  type: string;
  features: {
    id: string;
    type: string;
    properties: { colors: string };
    geometry: { type: string; coordinates: [number, number][] };
  }[];
}

export interface PlotDiv {
  data: (ChartData | ChartInfos)[];
  layout: object;
}

export interface ChartData {
  alignmentgroup: string;
  hovertemplate: string;
  legendgroup: string;
  marker: { color: string; pattern: { shape: string } };
  name: string;
  offsetgroup: string;
  orientation: string;
  showlegend: boolean;
  textposition: string;
  x: string[];
  xaxis: string;
  y: number[];
  yaxis: string;
  type: string;
}

export interface ChartInfos {
  mode: string;
  showlegend: boolean;
  text: number[];
  textfont: { size: number };
  textposition: string;
  x: string[];
  y: number[];
  type: string;
}
