# lowtrip

A web interface to easily compute travel carbon inventories for different means of transport worldwide

## How to launch the app

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
