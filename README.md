# 🔗 URL Shortener — Node.js Learning Project

A beginner-to-expert Node.js project that teaches:
Express, Middleware, Routing, HTTP, dotenv, nanoid, process signals, and more.

---

## 📁 Project Structure

```
url-shortener/
├── index.js        ← The entire app (heavily commented, line by line)
├── .env            ← Environment config (PORT, BASE_URL)
├── .gitignore      ← Tells Git what NOT to track
├── package.json    ← Project manifest + dependency list
├── README.md       ← This file
└── node_modules/   ← Installed packages (created by npm install)
```

---

## ⚙️ Setup (Do this once)

```bash
# 1. Install all dependencies listed in package.json
npm install

# 2. Start the server (normal mode)
npm start

# 3. OR start with auto-restart on file changes (dev mode)
npm run dev
```

---

## 🧪 Test the API

### Shorten a URL
```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com/search?q=nodejs+tutorial"}'
```

**Response:**
```json
{
  "shortUrl": "http://localhost:3000/aB3xZ1",
  "originalUrl": "https://www.google.com/search?q=nodejs+tutorial",
  "code": "aB3xZ1"
}
```

---

### Visit a Short URL (Redirect)
```bash
# -L flag tells curl to FOLLOW redirects
curl -L http://localhost:3000/aB3xZ1

# Without -L, you see the raw redirect response
curl -v http://localhost:3000/aB3xZ1
```

---

### List All Shortened URLs
```bash
curl http://localhost:3000/
```

---

### Test Error Cases

```bash
# Missing URL field → 400 Bad Request
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid URL format → 400 Bad Request
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-valid-url"}'

# Non-existent short code → 404 Not Found
curl http://localhost:3000/fakeCode
```

---

## 🧠 Concepts Covered

| Concept | Where in code |
|---|---|
| `require()` / CommonJS modules | Sections 1–3 |
| `dotenv` + `process.env` | Sections 1, 5 |
| Express app creation | Section 4 |
| In-memory data store | Section 6 |
| Middleware (`app.use`) | Sections 7, 8 |
| Custom middleware | Section 8 |
| HTTP GET route | Sections 9, 11 |
| HTTP POST route | Section 10 |
| Route parameters (`:code`) | Section 11 |
| `req.body`, `req.params` | Sections 10, 11 |
| `res.json()`, `res.status()` | Sections 9–11 |
| HTTP status codes | Sections 9–12 |
| 301 vs 302 redirect | Section 11 |
| Error handling middleware | Section 12 |
| `app.listen()` | Section 13 |
| Graceful shutdown (SIGTERM/SIGINT) | Section 14 |
| `process.exit()` | Section 14 |
| `nanoid` (crypto-safe IDs) | Section 3 |

---

## 📦 Dependencies Explained

| Package | Type | Why |
|---|---|---|
| `express` | dependency | Web framework — routing, middleware, HTTP handling |
| `nanoid@3` | dependency | Generates short, cryptographically random IDs |
| `dotenv` | dependency | Loads `.env` file into `process.env` |
| `nodemon` | devDependency | Auto-restarts server when you save a file (dev only) |

---

## 🔮 What to Build Next

1. **Persist data** — save `urlStore` to a JSON file using Node's `fs` module
2. **Add expiry** — delete links after 24 hours using `setTimeout`
3. **Click counter** — track how many times each short link is visited
4. **HTML frontend** — serve a form using `express.static`
5. **Redis backend** — replace in-memory store with Redis
6. **Rate limiting** — prevent abuse with `express-rate-limit`
7. **Deploy** — push to Railway, Render, or Fly.io
