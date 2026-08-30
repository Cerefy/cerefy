const BASE = "http://localhost:3000/api/trpc";

async function test() {
  // 1. Register (may already exist)
  console.log("=== Register ===");
  try {
    const reg = await fetch(`${BASE}/auth.register?batch=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 0: { json: { email: "admin@haier.it", password: "H41er_D3mo!2026", name: "Marco Rossi", organizationName: "Haier Europe" } } }),
    });
    console.log("Register status:", reg.status);
  } catch (e) {
    console.log("Register:", e.message);
  }

  // 2. Login
  console.log("\n=== Login ===");
  let cookie = "";
  try {
    const login = await fetch(`${BASE}/auth.login?batch=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 0: { json: { email: "admin@haier.it", password: "H41er_D3mo!2026" } } }),
    });
    console.log("Login status:", login.status);
    const setCookie = login.headers.get("set-cookie");
    if (setCookie) {
      cookie = setCookie.split(";")[0];
      console.log("Session cookie:", cookie.substring(0, 50) + "...");
    }
  } catch (e) {
    console.log("Login:", e.message);
  }

  // 2b. Bootstrap workspace
  console.log("\n=== Bootstrap Workspace ===");
  try {
    const bootstrap = await fetch(`${BASE}/workspaces.bootstrap?batch=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ 0: { json: {} } }),
    });
    console.log("Bootstrap status:", bootstrap.status);
    const bootstrapBody = await bootstrap.text();
    console.log("Bootstrap:", bootstrapBody.substring(0, 400));
  } catch (e) {
    console.log("Bootstrap:", e.message);
  }

  // 2c. List workspaces
  console.log("\n=== Workspaces List ===");
  try {
    const ws = await fetch(`${BASE}/workspaces.list?batch=1`, {
      headers: { Cookie: cookie },
    });
    console.log("Workspaces status:", ws.status);
    const wsBody = await ws.text();
    console.log("Workspaces:", wsBody.substring(0, 400));
  } catch (e) {
    console.log("Workspaces:", e.message);
  }

  const workspaceId = 17;
  const headers = { Cookie: cookie };
  const input = encodeURIComponent(JSON.stringify({ json: { workspaceId } }));

  // 4. Test agents.list
  console.log("\n=== Agents List ===");
  try {
    const agents = await fetch(`${BASE}/agents.list?input=${input}`, { headers });
    console.log("Agents status:", agents.status);
    const agentsBody = await agents.text();
    console.log("Agents:", agentsBody.substring(0, 500));
  } catch (e) {
    console.log("Agents:", e.message);
  }

  // 5. Test conversations.list
  console.log("\n=== Conversations List ===");
  try {
    const convs = await fetch(`${BASE}/conversations.list?input=${input}`, { headers });
    console.log("Conversations status:", convs.status);
    const convsBody = await convs.text();
    console.log("Conversations:", convsBody.substring(0, 500));
  } catch (e) {
    console.log("Conversations:", e.message);
  }

  // 6. Test decisions.list
  console.log("\n=== Decisions List ===");
  try {
    const dec = await fetch(`${BASE}/decisions.list?input=${input}`, { headers });
    console.log("Decisions status:", dec.status);
    const decBody = await dec.text();
    console.log("Decisions:", decBody.substring(0, 500));
  } catch (e) {
    console.log("Decisions:", e.message);
  }

  // 7. Test decisions.getStats
  console.log("\n=== Decisions Stats ===");
  try {
    const stats = await fetch(`${BASE}/decisions.getStats?input=${input}`, { headers });
    console.log("Stats status:", stats.status);
    const statsBody = await stats.text();
    console.log("Stats:", statsBody.substring(0, 500));
  } catch (e) {
    console.log("Stats:", e.message);
  }

  // 7. Test health
  console.log("\n=== Health ===");
  try {
    const health = await fetch("http://localhost:3000/api/trpc/system.health?batch=1");
    console.log("Health status:", health.status);
    const healthBody = await health.text();
    console.log("Health:", healthBody.substring(0, 300));
  } catch (e) {
    console.log("Health:", e.message);
  }
}

test().catch(console.error);
