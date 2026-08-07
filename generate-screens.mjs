import { StitchToolClient } from "@google/stitch-sdk";
import { writeFileSync, mkdirSync } from "fs";

const client = new StitchToolClient({
  apiKey: process.env.STITCH_API_KEY,
});

const PROJECT_ID = "2491759216216589904";

const screens = [
  {
    name: "home",
    prompt: `A premium enterprise SaaS landing page for "EyeX Technologies" — an AI intelligence platform. DESIGN: Dark theme (#050505 bg, #0A0A0C surfaces, #38BDF8 primary, Geist font, 0.125rem radius). HERO: full-viewport, bold "Intelligence, Architected", subtitle "Foundational intelligence infrastructure for global enterprise", two CTA buttons, ambient glow. BENTO GRID: 6 cards (Multi-Agent AI, Enterprise Security, Real-Time Analytics, API-First, Global Scale, Developer Experience) with icons and descriptions. Glass nav bar with EyeX logo, links, CTA. Footer. Premium enterprise feel.`,
  },
  {
    name: "about",
    prompt: `About page for "EyeX Technologies" — cinematic company story. DESIGN: Dark (#050505 bg, #38BDF8 primary, Geist font). HERO with "About EyeX Technologies" headline. Mission statement with gradient text. VERTICAL TIMELINE: milestones 2019-2026 with gradient connecting line. TEAM SECTION: grid of team member cards. STATS ROW: "120+ PhDs", "4 Global Hubs", "∞ Commitment". VALUES section with 4 cards. Glass nav, premium borders, glow effects. Cinematic editorial feel.`,
  },
  {
    name: "ai-chat",
    prompt: `AI Chat interface for EyeX Technologies. DESIGN: Dark (#050505 bg, #38BDF8 primary, Geist font). LEFT SIDEBAR (280px): conversation list, search, new chat button. MAIN CHAT: message bubbles with user/assistant styling, assistant has left primary border. CODE BLOCKS with dark bg. INPUT AREA: textarea + send + agent selector. AGENT BADGES showing active agent. Thinking dots animation. Glass elements. Enterprise-grade chat UI.`,
  },
  {
    name: "ai-copilot",
    prompt: `AI Copilot command palette for EyeX Technologies. DESIGN: Dark (#050505 bg, #38BDF8 primary, Geist font). CENTERED PALETTE (600px): search input at top. CATEGORIZED SUGGESTIONS in grid: Analytics, Reports, Data, System. Each has icon, title, description. Recent commands with timestamps. Keyboard shortcuts. Dark overlay with glass-morphism. Agent step visualization. Clean keyboard-first design.`,
  },
  {
    name: "api",
    prompt: `API management dashboard for EyeX Technologies. DESIGN: Dark (#050505 bg, #38BDF8 primary, Geist mono font). HEADER: "API Management" + "Generate New Key" button. API KEY CARDS: name, masked key, rate limit, status badge. REAL-TIME CONSOLE: scrollable log with timestamps, method badges (GET green, POST blue, DELETE red). USAGE STATS: requests, latency, error rate. Rate limit bars. Dark card layout, monospace code.`,
  },
  {
    name: "dashboard",
    prompt: `Main dashboard for EyeX Technologies enterprise platform. DESIGN: Dark (#050505 bg, #38BDF8 primary, Geist font). TOP ROW: 4 KPI cards (Revenue, Users, API Calls, Uptime) with sparklines. MIDDLE: area chart + activity feed. BOTTOM: transactions table + status cards. SIDEBAR NAV: icons for Dashboard, Analytics, AI Chat, Documents, Settings. Gradient chart fills. Enterprise dashboard aesthetic.`,
  },
  {
    name: "analytics",
    prompt: `Analytics dashboard for EyeX Technologies. DESIGN: Dark (#050505 bg, #38BDF8 primary, Geist font). FILTER BAR: date range, metric selector, export. 3 KPI CARDS: Sessions, Bounce Rate, Avg Duration with sparklines. LARGE AREA CHART: traffic over time with gradient. PIE CHART: traffic sources. DATA TABLE: top pages with views, bounce rate. Real-time visitor count with pulse. Cards with subtle borders.`,
  },
];

async function main() {
  mkdirSync("stitch-screens", { recursive: true });

  console.log(`Generating ${screens.length} screens...`);

  for (const screen of screens) {
    console.log(`\n→ ${screen.name}...`);
    try {
      const result = await client.callTool("generate_screen_from_text", {
        projectId: PROJECT_ID,
        prompt: screen.prompt,
        deviceType: "DESKTOP",
      });

      const htmlUrl = result.outputComponents?.[0]?.design?.screens?.[0]?.htmlCode?.downloadUrl;

      if (htmlUrl) {
        const resp = await fetch(htmlUrl);
        const html = await resp.text();
        writeFileSync(`stitch-screens/${screen.name}.html`, html);
        console.log(`  ✓ ${html.length} bytes`);
      } else {
        console.log(`  ✗ No HTML URL returned`);
      }

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  ✗ ${err.message?.substring(0, 200)}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
