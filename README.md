# lowtrip

A web interface to easily compute carbon inventories for different means of transport in Europe

## How to launch the app

### Prerequisites

Have python & node installed

### Launch the backend

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
