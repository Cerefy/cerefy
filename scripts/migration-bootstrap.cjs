const http = require("node:http");

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.url === "/health/live") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "live", phase: "migration" }));
    return;
  }

  res.writeHead(503, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "migration_in_progress" }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Migration bootstrap liveness listening on port ${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);

process.on("uncaughtException", (error) => {
  console.error("Migration bootstrap failed:", error);
  process.exit(1);
});
