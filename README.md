<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/56b8f5cc-76d5-4fcd-a61d-a0bab8d87ce2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Render (Free Tier)

This platform is completely ready for a 1-click free deployment on Render.com using the included `render.yaml` Configuration and `Dockerfile`.

**Requirements for Free Deployment:**
1. A managed PostgreSQL database with `pgvector` enabled (e.g. [Neon.tech](https://neon.tech))
2. A managed Neo4j Knowledge Graph (e.g. [Neo4j AuraDB Free](https://neo4j.com/cloud/aura-free/))
3. Your code pushed to a GitHub repository.

**How to Deploy:**
1. Log into [Render.com](https://render.com/) with your GitHub account.
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically read the `render.yaml` file and create the Web Service for you.
5. In the Render Dashboard, open the `cerefy-web` service settings, navigate to **Environment**, and paste in your external database credentials (`DATABASE_URL`, `NEO4J_URI`, and `GEMINI_API_KEY`).
