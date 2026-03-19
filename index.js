// ================================================================
// URL SHORTENER — index.js
// ================================================================
// This is the ONLY source file in our project.
// Read it top to bottom — each section is numbered and explained.
// ================================================================


// ----------------------------------------------------------------
// SECTION 1 — Load Environment Variables
// ----------------------------------------------------------------
// `require` is how Node imports a module (a file or npm package).
// Think of it like "go fetch this tool and bring it here".
//
// `dotenv` reads the .env file in your project root and injects
// each key=value pair into `process.env` — a global Node object
// that holds all environment configuration for your running process.
//
// `.config()` triggers the actual file-read + injection.
// This line MUST come before anything else that reads process.env.
require('dotenv').config();


// ----------------------------------------------------------------
// SECTION 2 — Import Express
// ----------------------------------------------------------------
// Express is an npm package (installed via `npm install express`).
// It is a "web framework" — a set of tools built on top of Node's
// built-in `http` module that makes it easy to:
//   - Define routes (URL patterns → handler functions)
//   - Parse request bodies (JSON, form data)
//   - Send structured responses
//   - Chain middleware (more on this below)
const express = require('express');





// ----------------------------------------------------------------
// SECTION 3 — Import nanoid
// ----------------------------------------------------------------
// nanoid is an npm package that generates short, unique, random IDs.
// Example IDs: "V1StGX", "z3R4pL", "aB8xQw"
//
// `{ nanoid }` — this is JavaScript destructuring.
// The package exports an OBJECT like { nanoid: function, ... }
// We pull out just the `nanoid` function from that object.
//
// Why nanoid and not Math.random()?
//   Math.random() is NOT cryptographically secure — it can be
//   predicted. nanoid uses Node's `crypto` module under the hood,
//   making IDs unpredictable and safe for URL generation.
const { nanoid } = require('nanoid');


// ----------------------------------------------------------------
// SECTION 4 — Create the Express Application
// ----------------------------------------------------------------
// `express()` is a factory function that creates and returns an
// Express application object. We name it `app` by convention.
//
// This `app` object has methods for:
//   app.use()      → register middleware
//   app.get()      → handle HTTP GET requests
//   app.post()     → handle HTTP POST requests
//   app.listen()   → start the server
const app = express();
const cors = require('cors');
app.use(cors());


// ----------------------------------------------------------------
// SECTION 5 — Read Configuration from Environment
// ----------------------------------------------------------------
// process.env values are ALWAYS strings, even if they look like numbers.
// We use parseInt() to convert the PORT string to a real number.
//
// The || (OR) operator provides a FALLBACK value:
//   If process.env.PORT is undefined or empty → use 3000
//
// This makes your app resilient — it works even without a .env file.
const PORT = parseInt(process.env.PORT) || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;


// ----------------------------------------------------------------
// SECTION 6 — In-Memory URL Store
// ----------------------------------------------------------------
// This is our "database" — a plain JavaScript object (key-value map).
//
// Structure:
//   {
//     "aB3xZ1": "https://www.google.com/very/long/url?with=params",
//     "pQ7yR2": "https://another-very-long-website.com/article/123",
//   }
//
// Lookup is O(1) — instant, no matter how many URLs are stored.
//
// ⚠️  LIMITATION: This lives in RAM (memory).
//     When you stop the server → all data is wiped.
//     In a real app, use a database: Redis, MongoDB, PostgreSQL etc.
//     For learning purposes, this is perfect — zero setup needed.
const urlStore = {};


// ----------------------------------------------------------------
// SECTION 7 — Middleware: JSON Body Parser
// ----------------------------------------------------------------
// WHAT IS MIDDLEWARE?
// Middleware is a function with access to (req, res, next).
// It runs BETWEEN receiving a request and sending a response.
// Think of it as a pipeline — each middleware processes the request
// and either:
//   a) Passes it to the next middleware/route by calling next()
//   b) Ends the cycle by sending a response
//
// Request → [middleware1] → [middleware2] → [route handler] → Response
//
// `app.use()` registers a middleware to run on EVERY request.
//
// `express.json()` is built-in middleware that:
//   1. Checks if the incoming request has Content-Type: application/json
//   2. If yes, reads the raw body stream and parses it as JSON
//   3. Attaches the result to req.body
//
// Without this: req.body === undefined (you can't read POST data)
// With this:    req.body === { url: "https://..." }
app.use(express.json());

// ----------------------------------------------------------------
// SECTION 7B — Serve Static Files (HTML, CSS, JS from /public)
// ----------------------------------------------------------------
// `express.static('public')` is built-in middleware that:
//   1. Looks inside the `public/` folder
//   2. If a request matches a file there, it serves it directly
//   3. GET / → serves public/index.html automatically
//
// This is how you attach a frontend to an Express backend.
// No route needed — static files are served automatically.
app.use(express.static('public'));


// ----------------------------------------------------------------
// SECTION 8 — Middleware: Request Logger (Custom Middleware)
// ----------------------------------------------------------------
// Here we write our OWN middleware — this is how you learn the pattern.
//
// Every middleware receives three arguments:
//   req  → the incoming Request object (method, URL, headers, body...)
//   res  → the outgoing Response object (send, json, redirect, status...)
//   next → a function — call it to pass control to the next middleware
//
// This logger prints every incoming request to the terminal.
// Useful for debugging — you can see exactly what's hitting your server.
app.use((req, res, next) => {
  const timestamp = new Date().toISOString(); // e.g. "2024-01-15T10:30:00.000Z"
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  //           └─ time        └─ GET/POST  └─ /shorten or /aB3xZ

  // MUST call next() to pass control forward.
  // If you forget next(), the request hangs forever — a common bug!
  next();
});


// ----------------------------------------------------------------
// SECTION 9 — ROUTE: GET /  (Home — List all shortened URLs)
// ----------------------------------------------------------------
// WHAT IS A ROUTE?
// A route is a combination of:
//   1. An HTTP METHOD (GET, POST, PUT, DELETE, PATCH)
//   2. A PATH (the URL pattern: "/", "/shorten", "/:code")
//   3. A HANDLER function(req, res) called when both match
//
// HTTP GET = "I want to READ/retrieve data" (no body sent)
// HTTP POST = "I want to CREATE something" (body contains data)
//
// This route handles: GET http://localhost:3000/
// It shows all currently stored URL mappings — useful for debugging.
app.get('/', (req, res) => {

  // Object.entries() converts { key: val, key2: val2 }
  // into [ [key, val], [key2, val2] ] — an array of pairs.
  // This makes it easy to loop over with .map()
  const entries = Object.entries(urlStore);

  if (entries.length === 0) {
    // res.json() does two things:
    //   1. Sets the Content-Type header to "application/json"
    //   2. Serializes the JS object to a JSON string and sends it
    // Default status code when you don't call res.status() first is 200 OK.
    return res.json({
      message: 'No URLs shortened yet.',
      hint: 'POST to /shorten with body: { "url": "https://example.com" }'
    });
  }

  // .map() transforms each [code, url] pair into a readable object
  const links = entries.map(([code, originalUrl]) => ({
    code,
    shortUrl: `${BASE_URL}/${code}`,
    originalUrl
  }));

  res.json({
    total: links.length,
    links
  });
});


// ----------------------------------------------------------------
// SECTION 10 — ROUTE: POST /shorten  (Create a short URL)
// ----------------------------------------------------------------
// This is the CORE route of our app.
//
// CLIENT sends:  POST /shorten
//                Content-Type: application/json
//                Body: { "url": "https://very-long-url.com/..." }
//
// SERVER responds: { "shortUrl": "http://localhost:3000/aB3xZ",
//                    "originalUrl": "https://very-long-url.com/..." }
//
// FLOW inside this handler:
//   1. Extract `url` from req.body
//   2. Validate — is it present? Is it a valid URL?
//   3. Generate a short code with nanoid
//   4. Store code → url in urlStore
//   5. Build the full short URL string
//   6. Send 201 Created response with the short URL
app.post('/shorten', (req, res) => {

  // Destructure `url` from req.body (the parsed JSON body).
  // req.body is populated by the express.json() middleware (Section 7).
  const { url } = req.body;

  // ------ VALIDATION STEP 1: Check if url was provided ------
  // `!url` is true if url is: undefined, null, "", 0, false
  // `typeof url !== 'string'` guards against someone sending { "url": 123 }
  if (!url || typeof url !== 'string') {
    // res.status(400) sets the HTTP status code to 400 Bad Request.
    // Chaining .json() on it sends the response immediately.
    //
    // HTTP 400 = "You (the client) sent a bad/invalid request"
    //
    // `return` here is important — it STOPS the function execution.
    // Without it, code below would still run after sending a response,
    // causing a "Cannot set headers after they are sent" error.
    return res.status(400).json({
      error: 'Missing URL',
      message: 'Please provide a url field in the request body.',
      example: { url: 'https://example.com' }
    });
  }

  // ------ VALIDATION STEP 2: Check URL format ------
  // The built-in URL constructor validates URL format.
  // `new URL("not-a-url")` throws a TypeError.
  // `new URL("https://google.com")` succeeds (we don't need the result).
  // We use try/catch to handle the error gracefully.
  try {
    new URL(url);
  } catch {
    return res.status(400).json({
      error: 'Invalid URL format',
      message: 'URL must include a protocol. Example: https://google.com',
    });
  }

  // ------ GENERATE SHORT CODE ------
  // nanoid(6) → generates a 6-character random string.
  // Character set: A-Za-z0-9_ and - (all URL-safe, no encoding needed)
  // With 6 chars from ~64 possible chars = 64^6 = ~68 billion combinations.
  // Collision probability is astronomically low.
  const shortCode = nanoid(6);

  // ------ STORE THE MAPPING ------
  // Bracket notation: object[key] = value
  // Creates a new entry: urlStore["aB3xZ1"] = "https://..."
  urlStore[shortCode] = url;

  // ------ BUILD SHORT URL ------
  // Template literal (backtick string) with ${} interpolation.
  // e.g. "http://localhost:3000/aB3xZ1"
  const shortUrl = `${BASE_URL}/${shortCode}`;

  // ------ LOG IT ------
  console.log(`✂️  Shortened: ${url} → ${shortUrl}`);

  // ------ SEND RESPONSE ------
  // HTTP 201 Created — the standard code for "I created a new resource".
  // Different from 200 OK — 201 specifically means something new was made.
  res.status(201).json({
    shortUrl,
    originalUrl: url,
    code: shortCode
  });
});


// ----------------------------------------------------------------
// SECTION 11 — ROUTE: GET /:code  (Redirect to original URL)
// ----------------------------------------------------------------
// This route handles all short URL visits.
//
// ROUTE PARAMETERS (the `:code` part):
//   `:code` is a named DYNAMIC SEGMENT — a wildcard that matches
//   any single path segment after the slash.
//
//   GET /aB3xZ1  → req.params.code = "aB3xZ1"
//   GET /pQ7yR2  → req.params.code = "pQ7yR2"
//   GET /hello   → req.params.code = "hello"
//
//   All named route params are available in `req.params` object.
//
// ⚠️  ORDER MATTERS: This route MUST come after GET / and POST /shorten
//   because Express matches routes TOP TO BOTTOM, first match wins.
//   If /:code came first, it would match "/" and "/shorten" too!
app.get('/:code', (req, res) => {

  // Extract the short code from the URL
  const { code } = req.params;

  // Look up the code in our store.
  // If code doesn't exist → undefined (falsy)
  const originalUrl = urlStore[code];

  // Handle "not found" case
  if (!originalUrl) {
    return res.status(404).json({
      error: 'Short URL not found',
      message: `No URL mapped to code: "${code}"`,
      hint: 'The link may have expired or was never created.'
    });
    // HTTP 404 = Not Found — the requested resource doesn't exist
  }

  // ------ REDIRECT ------
  // res.redirect(statusCode, url) sends an HTTP redirect.
  // The browser sees this and automatically navigates to the new URL.
  //
  // Two types of redirects:
  //   301 Moved Permanently — browser CACHES this redirect forever.
  //       Use when a page has permanently moved. Bad for URL shorteners
  //       because if you ever reassign a code, browsers ignore the change.
  //
  //   302 Found (Temporary) — browser checks the server every time.
  //       CORRECT for URL shorteners — always fresh, never cached.
  //
  // We log the redirect so you can see it in the terminal.
  console.log(`🔀 Redirecting /${code} → ${originalUrl}`);
  res.redirect(302, originalUrl);
});


// ----------------------------------------------------------------
// SECTION 12 — Error Handling Middleware
// ----------------------------------------------------------------
// Express has SPECIAL error-handling middleware.
// It's identified by having EXACTLY 4 parameters: (err, req, res, next)
// The `err` as the first parameter is the signal to Express.
//
// When does this run?
//   - When any route calls: next(new Error("something broke"))
//   - When synchronous code in a route throws an error
//
// This is a SAFETY NET — it catches unexpected crashes and returns
// a clean JSON response instead of crashing the server.
//
// ⚠️  MUST be registered LAST (after all routes).
app.use((err, req, res, next) => {
  // Log the full stack trace to the terminal for debugging
  console.error('💥 Unhandled Error:', err.stack);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
    // Don't expose err.stack to clients in production — it reveals internals!
  });
  // HTTP 500 = Internal Server Error — something went wrong on OUR end
});


// ----------------------------------------------------------------
// SECTION 13 — Start the Server
// ----------------------------------------------------------------
// app.listen(port, callback) does two things:
//   1. Binds the process to a TCP port (tells the OS: "send me traffic on this port")
//   2. Starts the event loop listening for incoming connections
//
// The callback function runs once the server is ready to accept connections.
//
// We store the returned value in `server` — it's a Node http.Server instance.
// We need this reference for graceful shutdown (Section 14).
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║         URL SHORTENER — Running!           ║
╠════════════════════════════════════════════╣
║                                            ║
║  🌐  Base URL : ${BASE_URL.padEnd(26)}║
║                                            ║
║  📮  Shorten  : POST /shorten              ║
║      Body     : { "url": "https://..." }   ║
║                                            ║
║  🔗  Redirect : GET  /:code                ║
║  📋  List all : GET  /                     ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
});


// ----------------------------------------------------------------
// SECTION 14 — Graceful Shutdown
// ----------------------------------------------------------------
// WHAT ARE SIGNALS?
// When your OS or a process manager wants to stop your app, it sends
// a SIGNAL — a low-level notification.
//
// SIGTERM — "Please shut down cleanly" (sent by Docker, Heroku, K8s, etc.)
// SIGINT  — "You pressed Ctrl+C" (sent by your terminal)
//
// process.on(event, handler) — listens to events on the Node process object.
// `process` is a global object — no require() needed.
//
// WHY GRACEFUL SHUTDOWN MATTERS:
//   Without it: server dies instantly, dropping any in-progress requests.
//   With it:    server finishes current requests, then exits cleanly.
//   This is critical in production — users don't get half-responses.
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n⚠️  ${signal} received — starting graceful shutdown...`);

  // server.close() tells the server: "stop accepting NEW connections".
  // Already-connected clients can finish their requests.
  // The callback fires once ALL active connections are closed.
  server.close(() => {
    console.log('✅ All connections closed. Server exited cleanly.\n');
    process.exit(0);
    // process.exit(0) → exit code 0 = SUCCESS
    // process.exit(1) → exit code 1 = FAILURE/ERROR
    // Other programs (shell scripts, CI/CD) check exit codes to know
    // if your app shut down successfully.
  });

  // SAFETY NET: If connections don't close within 10 seconds, force exit.
  // This handles stuck connections (e.g. long-polling, websockets).
  setTimeout(() => {
    console.error('❌ Connections still open after 10s — forcing exit.');
    process.exit(1);
  }, 10000).unref();
  // .unref() — tells Node: "don't let this timer keep the event loop alive".
  // Without .unref(), Node waits 10 full seconds even after server.close() succeeds.
}
