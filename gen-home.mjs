import { StitchToolClient } from "@google/stitch-sdk";
import { writeFileSync } from "fs";

const client = new StitchToolClient({ apiKey: process.env.STITCH_API_KEY });

const result = await client.callTool("generate_screen_from_text", {
  projectId: "2491759216216589904",
  prompt:
    "Premium enterprise SaaS landing page for EyeX Technologies AI platform. Dark theme 050505 background. Hero: Intelligence Architected headline, subtitle, dual CTA. Bento grid: 6 feature cards. Glass nav. Footer.",
  deviceType: "DESKTOP",
});

const htmlUrl = result.outputComponents?.[0]?.design?.screens?.[0]?.htmlCode?.downloadUrl;
if (htmlUrl) {
  const resp = await fetch(htmlUrl);
  const html = await resp.text();
  writeFileSync("stitch-screens/home.html", html);
  console.log("Home saved:", html.length, "bytes");
} else {
  console.log("No HTML URL", JSON.stringify(result).substring(0, 500));
}
