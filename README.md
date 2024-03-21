# lowtrip

## A web interface to easily compute per passenger travel carbon inventories for different means of transport worldwide. 

The work presented here is independent and not-for-profit. This work has been carried out on a
voluntary basis and presents no conflict of interest.

The aim of this web app is to present precise carbon inventories per passenger for each mode of
transport and each journey. These results enable users to make informed choices in the context of
reducing their greenhouse gas emissions to mitigate climate change. To put these results into context, total yearly
per-capita emissions should not exceed 2 tons CO2eq in 2050 to limit global warming below 2°C (IPCC).

## How the emissions are calculated?

To calculate CO2 equivalent emissions per person, we multiply the distance of a journey (km) by the corresponding emission factor (mass of CO2 per person per km) of a mean of transport. For a, mutlistep journey, these emissions are summed over the different steps.

$$CO_2 = \sum_{step} Distance(km) \times Emission factor(kgCO_2 / km) $$

### Estimation of distances

| Mean of Transport | Distance |
| --- | --- |
| `Train` | OpenStreetMap network |
| `Car & Bus & eCar` | OpenStreetMap network |
| `Bike route` | OpenStreetMap network |
| `Plane` | Geodesic distance |
| `Ferry` | Approximation of shortest path |

### What do emission factors depend on?

| Mean of Transport | Variable |
| --- | --- |
| `Train` | Visited countries |
| `Bus` | - |
| `Car` | User-specified parameters |
| `Electric car` | Visited countries & User-specified parameters |
| `Bike route` | - |
| `Plane` | Distance of journey |
| `Ferry` | User-specified parameters |

Emissions factors consider usage (linked to the manufacture and use of energy to move the vehicle) as well as infrastructure and vehicle construction where these are significant. The table below summarizes the types of emissions taken into account by lowtrip. Blank spaces mean that the related emissions did not contribute significantly to the result and are therefore excluded to facilitate understanding and readability for the user.

| Mean of Transport | Usage | Vehicle construction | Infrastruture construction |
| --- |  :---: |  :---: |  :---: |
| `Train` | :white_check_mark: |  | :white_check_mark: |
| `Car & Bus & eCar` | :white_check_mark: | :white_check_mark: |  |
| `Electric car` | :white_check_mark: | :white_check_mark: |  |
| `Bike route` | | :white_check_mark: | Not found |
| `Plane` |  :white_check_mark: |  |  |
| `Ferry` |  :white_check_mark: | Not found | Not found |

All the assumptions, data and sources used are available in the [methodology](https://github.com/XavB64/lowtrip/blob/main/frontend/src/assets/lowtrip_methodology.pdf).

## How to launch the app?

### Prerequisites

Have python & node installed

### Launch the backend

Go in backend folder :

```bash
cd backend
```

Install the dependencies :

```bash
pip install -r requirements.txt
```

Launch :

```bash
gunicorn app:app
```

### Launch the frontend

Go in frontend folder :

```bash
cd frontend
```

Install the dependencies :

```bash
npm install
```

Launch :

```bash
npm start
```

## How to cite this work ? 

*Bonnemaizon, Xavier, Ni, Clara, Gres, Paola & Pellas, Chiara. lowtrip (2024). lowtrip-app.onrender.com*

