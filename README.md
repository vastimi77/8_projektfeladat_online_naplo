# 📔 Online Napló - Personal Notes Application

Egy modern, többfelhasználós online naplóalkalmazás **Node.js**, **Express**, **SQLite** és **Bootstrap** alapon.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

## 🚀 Jellemzők

- ✅ **JWT alapú autentikáció** - Biztonságos bejelentkezés és regisztráció
- ✅ **Teljes CRUD funkció** - Jegyzetek létrehozása, olvasása, szerkesztése, törlése
- ✅ **Keresés és szűrés** - Jegyzet keresése cím és tartalom alapján
- ✅ **Kategóriák** - Jegyzetek szervezése kategóriák szerint
- ✅ **Reszponzív UI** - Bootstrap 5 alapú modern felület
- ✅ **Multi-felhasználó** - Elszigetelt felhasználói munkamenetek
- ✅ **Docker támogatás** - Könnyű telepítés containerrel
- ✅ **Integrációs tesztek** - 20+ tesztes lefedettség

## 🛠️ Tech Stack

| Kategória | Technológia |
|-----------|-------------|
| **Runtime** | Node.js 18+ |
| **Backend Framework** | Express.js 4.x |
| **Adatbázis** | SQLite3 |
| **Autentikáció** | JWT (jsonwebtoken) |
| **Jelszókezelés** | bcryptjs |
| **Frontend** | Vanilla JS + Bootstrap 5 |
| **Tesztelés** | Jest + Supertest |
| **Containerizáció** | Docker + Docker Compose |

## 📁 Projekt Szerkezete

```
8_projektfeladat_online_naplo/
├── backend/                          # Express API
│   ├── src/
│   │   ├── config/database.js        # SQLite konfigurációs
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT middleware
│   │   │   └── validation.js         # Input validáció
│   │   ├── routes/
│   │   │   ├── auth.js               # Bejelentkezés/regisztráció
│   │   │   └── notes.js              # Jegyzetek API
│   │   └── server.js                 # Express app
│   ├── tests/notes.test.js           # Integrációs tesztek
│   ├── .env.example                  #环境 template
│   ├── package.json                  # NPM dependencies
│   └── Dockerfile                    # Container image
├── frontend/
│   ├── css/styles.css                # Bootstrap + custom CSS
│   └── js/app.js                     # Frontend logika
├── database/
│   ├── naplo.db                      # SQLite adatbázis
│   └── schema.sql                    # DB séma
├── docker-compose.yml                # Container orchestration
├── index.html                        # Főoldal
└── README.md                         # Ez a fájl
```

## ⚙️ Telepítés

### Előfeltételek
- **Node.js 18+**
- **npm** vagy **yarn**
- **Docker** (opcionális)

### Helyi fejlesztés

#### 1. Repository klónozása
```bash
git clone https://github.com/username/8_projektfeladat_online_naplo.git
cd 8_projektfeladat_online_naplo
```

#### 2. Backend beállítása
```bash
cd backend
npm install
cp .env.example .env
```

#### 3. Environment konfigurálása
Szerkeszd a `backend/.env` fájlt:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
```

#### 4. Szerver indítása
```bash
npm start
# vagy desarrollo módban
npm run dev
```

Nyisd meg a **http://localhost:5000** címet.

### Docker segítségével

```bash
# Projekt gyökerből
docker-compose up --build

# Háttérben
docker-compose up -d

# Naplók megtekintése
docker-compose logs -f

# Leállítás
docker-compose down
```

## 📡 API Dokumentáció

### 🔐 Autentikáció

#### Regisztráció
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "jondoe",
  "email": "jon@example.com",
  "password": "SecurePassword123"
}
```

**Válasz (201):**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

#### Bejelentkezés
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "jondoe",
  "password": "SecurePassword123"
}
```

**Válasz (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "jondoe",
    "email": "jon@example.com"
  }
}
```

### 📝 Jegyzetek

Minden jegyzet endpoint-hoz szükséges az `Authorization: Bearer <token>` header!

#### Összes jegyzet lekérése
```http
GET /api/notes?limit=50&offset=0&search=text&category=munka
Authorization: Bearer TOKEN
```

**Válasz (200):**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Bevásárlólista",
      "content": "Tej, kenyér, tojás...",
      "category": "osobni",
      "created_at": "2026-05-11T10:30:00Z",
      "updated_at": "2026-05-11T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

#### Jegyzet létrehozása
```http
POST /api/notes
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Új jegyzet",
  "content": "Jegyzet tartalma...",
  "category": "munka"
}
```

**Válasz (201):**
```json
{
  "message": "Note created successfully",
  "data": {
    "id": 2,
    "title": "Új jegyzet",
    "content": "Jegyzet tartalma...",
    "category": "munka",
    "user_id": 1,
    "created_at": "2026-05-11T10:35:00Z",
    "updated_at": "2026-05-11T10:35:00Z"
  }
}
```

#### Jegyzet frissítése
```http
PUT /api/notes/2
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Módosított cím",
  "content": "Módosított tartalom",
  "category": "személyes"
}
```

#### Jegyzet törlése
```http
DELETE /api/notes/2
Authorization: Bearer TOKEN
```

## 🧪 Tesztelés

```bash
cd backend

# Összes teszt futtatása
npm test

# Coverage megtekintése
npm run test:coverage

# Watch módban
npm test -- --watch
```

**Tesztek:**
- ✅ Jegyzet létrehozása
- ✅ Jegyzet keresése/listázása
- ✅ Jegyzet módosítása
- ✅ Jegyzet törlése
- ✅ Páytási validáció
- ✅ Autentikációs ellenőrzés
- ✅ Cross-user access isolation

## 🔒 Biztonság

- **JWT tokenek** 24 óra lejárati idővel
- **bcryptjs** jelszóhashing (10 salt round)
- **CORS** védelem
- **SQL injection** elleni védelem (parameterezett queryek)
- **XSS** védelem (HTML escape)
- **Cross-user isolation** (felhasználók csak saját adatait érhetik el)

## 📝 Environment Változók

| Változó | Leírás | Default |
|---------|--------|---------|
| `PORT` | Szerver port | `5000` |
| `NODE_ENV` | Futási mód | `development` |
| `JWT_SECRET` | JWT aláírási kulcs | ⚠️ Kötelező |
| `JWT_EXPIRATION` | Token lejárati idő | `24h` |
| `BCRYPT_ROUNDS` | Jelszóhashing erőssége | `10` |
| `CORS_ORIGIN` | Engedélyezett CORS origin | `*` |
| `DATABASE_URL` | Adatbázis elérési útja | `./database/naplo.db` |

## 🐛 Hibaelhárítás

### Port már használatban van
```bash
# Linux/Mac: Talált processz törlése
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Adatbázis hiba
```bash
# Adatbázis törlése (fejlesztés közben)
rm database/naplo.db
```

### Szerver nem indulnál
1. Node.js verzió ellenőrzése: `node --version` (18+ kell)
2. Függőségek újratelepítése: `rm -rf node_modules && npm install`
3. Naplók megtekintése: `npm start`

## 📖 Fejlesztés

### Új feature hozzáadása

1. Branch készítése
```bash
git checkout -b feature/new-feature
```

2. Fejlesztés és tesztelés
```bash
npm test
```

3. Commit és push
```bash
git add .
git commit -m "feat: új funkció leírása"
git push origin feature/new-feature
```

### Code style
- ESLint conformité
- 2 szóköz indentáció
- JSDoc megjegyzésekhez funkciók

## 📄 Licenc

MIT License - lásd a [LICENSE](LICENSE) fájlt.

## 🤝 Közreműködés

Szívesen fogadunk pull request-eket! Nyiss egy GitHub issue-t előbb a nagyobb változásokhoz.

## 📞 Támogatás

Kérdésed van? Nyiss egy [GitHub issue-t](https://github.com/username/8_projektfeladat_online_naplo/issues).

---

**Létrehozva**: 2026. május  
**Utolsó frissítés**: 2026. május 11.