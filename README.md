# Online naplo

Tobb felhasznalos online naploalkalmazas Node.js, Express, SQLite es vanilla JavaScript alapon.

## Funkciok

- felhasznaloi regisztracio es bejelentkezes JWT tokennel
- sajat jegyzetek listazasa
- uj jegyzet letrehozasa
- meglvo jegyzet szerkesztese
- jegyzet torlese
- kategoriamezo a jobb rendezhetoseghez
- reszponziv frontend
- Docker futtatas docker-compose fajllal

## Projekt szerkezet

- `backend/`: API, autentikacio, tesztek, Dockerfile
- `frontend/`: CSS es kliensoldali JavaScript
- `database/schema.sql`: adatbazis letrehozasa
- `index.html`: a fo felulet

## Inditas helyben

1. Lepj be a `backend` mappaba.
2. Telepitsd a fuggosegeket: `npm install`
3. Masold a `.env.example` fajlt `.env` nevvel.
4. Inditsd a szervert: `npm start`
5. Nyisd meg a `http://localhost:5000` cimet.

## API vegpontok

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Notes

- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

## Tesztek

Futtatas a `backend` mappabol:

`npm test`

## Docker

Inditas a projekt gyokerbol:

`docker compose up --build`