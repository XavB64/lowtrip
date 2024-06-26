
<img src="./frontend/src/assets/lowtrip_color.png" alt="lowtrip" width="400"/>

# a web app to compute travel CO2eq for different means of transport worldwide

The work presented here is independent and not-for-profit. This work has been carried out on a
voluntary basis.

The aim of this web app is to present precise carbon inventories per passenger for each mode of
transport and each journey. These results enable users to make informed choices in the context of
reducing their greenhouse gas emissions to mitigate climate change. To put these results into context, total net yearly
per-capita emissions should not exceed 2 tons CO2eq in 2050 to limit global warming below +2°C.

You can have a look at https://lowtrip.fr/.

# How the emissions are calculated?

To calculate CO2 equivalent emissions per person, we multiply the distance of a journey (km) by the corresponding emission factor (mass of CO2 equivalent per person per km) of a mean of transport. For a mutlistep journey, these emissions are summed over the different steps:

$$CO_2eq = \sum_{step} Distance(km) \times Emission \\: Factor(kgCO_2eq / km) $$

### Estimation of distances

| Mean of Transport | Distance |
| --- | --- |
| `Train` | OpenStreetMap network |
| `Car & Bus & eCar` | OpenStreetMap network |
| `Bike route` | OpenStreetMap network |
| `Plane` | Geodesic distance and average detour |
| `Ferry & Sailboat` | Approximation of shortest path |

### What do emission factors depend on?

| Mean of Transport | Variable |
| --- | --- |
| `Train` | Visited countries |
| `Bus` | - |
| `Car` | Number of passengers |
| `Electric car` | Visited countries & Number of passengers |
| `Bike route` | - |
| `Plane` | Distance of journey |
| `Ferry` | User-specified parameters |
| `Sailboat` | - ; improvements on the way |

Emissions factors consider usage (linked to the manufacture and use of energy to move the vehicle) as well as infrastructure and vehicle construction where these are significant. The table below summarizes the types of emissions taken into account by lowtrip. Empty cells mean that the related emissions did not contribute significantly to the result and are therefore excluded to facilitate understanding and readability for the user.

| Mean of Transport | Usage | Vehicle construction | Infrastruture construction |
| --- |  :---: |  :---: |  :---: |
| `Train` | :white_check_mark: |  | :white_check_mark: |
| `Car & Bus & eCar` | :white_check_mark: | :white_check_mark: |  |
| `Bike route` | | :white_check_mark: | Not found |
| `Plane` |  :white_check_mark: |  |  |
| `Ferry` |  :white_check_mark: | | Not found |
| `Sailboat` | :white_check_mark: | | Not found |

All assumptions, data and sources used are available in the [methodology](https://github.com/XavB64/lowtrip/blob/main/frontend/src/assets/lowtrip_methodology.pdf) document.

# How to launch the app?

### Prerequisites

Have docker installed

### Launch the app

At the root of the directory, run:

```bash
docker-compose up --build
```

You can now connect to [http://localhost:3000](http://localhost:3000) to test the application.

Note: If you want to launch them in the backgroup and leave them running, you can add the flag `-d` or `--detach`.

### Rebuild and restart a service

At the root of the directory, run:

```bash
docker-compose up --build <service name: backend or frontend>
```

### Stop the app

At the root of the directory, run:

```bash
docker-compose down
```

## How to launch the app components separately?

### Prerequisites

Have python & node installed

### Launch the backend

```bash
cd backend

# create a python environment and activate it
python -m venv lowtrip-venv
source lowtrip-venv/bin/activate

# install the dependencies
pip install -r requirements.txt

# launch the app
gunicorn app:app
```

You can format the code with ruff:
```bash
pip install ruff
ruff format
```

### Launch the frontend


```bash
cd frontend

# install the dependencies
npm install

# launch the app
npm start
```

# How to cite this work ?

*Bonnemaizon, Xavier, Ni, Clara, Gres, Paola & Pellas, Chiara. lowtrip (2024). https://lowtrip.fr*
