# Cerefy Enterprise AI - Production Deployment Guide

This guide outlines the steps to deploy the Cerefy Enterprise AI operating system to a production environment using Docker Compose.

## Prerequisites
- A Linux server (Ubuntu 22.04 LTS recommended)
- Docker and Docker Compose installed
- A domain name pointing to your server's IP address (for SSL/Nginx)
- Access to an AI provider API Key (e.g., Google Gemini, OpenAI)

## Deployment Steps

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd cerefy
```

### 2. Configure Environment Variables
Copy the production environment template and fill in your secrets.
```bash
cp .env.production .env
nano .env
```
Ensure you change the `JWT_SECRET`, database passwords, and provide your `GEMINI_API_KEY`.

### 3. Start the Infrastructure
Use docker-compose to build and start the monolithic application along with Postgres, Neo4j, and Nginx.

```bash
docker-compose -f docker-compose.production.yml up -d --build
```

### 4. Verify Services
Check the status of all containers:
```bash
docker-compose -f docker-compose.production.yml ps
```
You should see:
- `cerefy-db` (Running / Healthy)
- `cerefy-graph` (Running / Healthy)
- `cerefy-app` (Running)
- `cerefy-proxy` (Running)

### 5. Database Migrations (Prisma/Drizzle)
Once the database container is healthy, run the migrations to create the schema.
*(Run this command against your application container)*
```bash
docker exec -it cerefy-app npm run db:migrate
```

### 6. SSL / HTTPS (Optional but Highly Recommended)
For production, you should secure the Nginx proxy with Let's Encrypt using `certbot`.
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-cerefy-domain.com
```

## Maintenance

### Updating the Application
To deploy a new version of the code:
```bash
git pull
docker-compose -f docker-compose.production.yml up -d --build cerefy-app
```

### Viewing Logs
To view logs for the Node.js application:
```bash
docker logs -f cerefy-app
```

To view WebSocket or Proxy logs:
```bash
docker logs -f cerefy-proxy
```
