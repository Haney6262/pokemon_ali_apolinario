const jsonServer = require("json-server")
const server = jsonServer.create()
const router = jsonServer.router("db.json")
const middlewares = jsonServer.defaults()

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares)

// Add custom routes before JSON Server router
server.delete("/team/:id", (req, res, next) => {
  console.log(`Deleting Pokemon with ID: ${req.params.id}`)
  // Continue to JSON Server router
  next()
})

// To handle POST, PUT and PATCH you need to use a body-parser
server.use(jsonServer.bodyParser)

const fs = require("fs");

// Reload the database from disk on each request
server.use((req, res, next) => {
  try {
    const data = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    router.db.assign(data);
  } catch (err) {
    console.error("Failed to reload db.json:", err);
  }
  next();
});


// Use default router
server.use(router)

server.listen(3001, () => {
  console.log("JSON Server is running on port 3001")
  console.log("Available routes:")
  console.log("  GET    /team")
  console.log("  GET    /team/:id")
  console.log("  POST   /team")
  console.log("  DELETE /team/:id")
  console.log("  GET    /battles")
  console.log("  POST   /battles")
})
