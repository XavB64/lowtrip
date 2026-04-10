# Contributing

Thank you for contributing to this project!

## 🧑‍💻 Development

### Option 1 — Run with Docker (recommended)

Install docker and run at the root of the directory:

```bash
docker-compose up --build
```

You can now connect to [http://localhost:3000](http://localhost:3000) to test the application.

### Option 2 — Run services manually

#### Prerequisites

- Node.js (frontend)
- Python (backend)

#### Backend

```bash
cd backend

# create a python environment and activate it
python -m venv lowtrip-venv
source lowtrip-venv/bin/activate

# install the dependencies
pip install -r requirements.txt

# launch the app
gunicorn app:app --reload
```

You can format the code with ruff:

```bash
pip install ruff
ruff format .
```

#### Frontend

```bash
cd frontend

# install the dependencies
npm ci

# launch the app
npm run start
```

---

## 🧪 Commit conventions

We use emoji-based commit messages for clarity with the following format:

```
<emoji> <service>: <short description>
```

| Icon            | Meaning                           | Example                            |
| --------------- | --------------------------------- | ---------------------------------- |
| ✨ `:sparkles:` | New feature                       | `✨ front: add date picker modal`  |
| ⭐ `:star:`     | Small functional improvement      | `⭐ front: refine selection UX`    |
| 🐞 `:bug:`      | Bug fix                           | `🐞 front: correct period parsing` |
| 🔧 `:wrench:`   | Config / setup / refactor / perf  | `🔧 back: update npm scripts`      |
| 🧹 `:broom:`    | Code cleanup (no behavior change) | `🧹 back: remove unused code`      |
| 📦 `:package:`  | Dependencies                      | `📦 front: add topojson-client`    |
| 📝 `:memo:`     | Documentation                     | `📝 docs: add catalog format`      |
