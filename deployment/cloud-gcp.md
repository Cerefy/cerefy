# Cerefy Enterprise AI: GCP Deployment Architecture & Provisioning Guide

This document outlines the standard architecture and infrastructure-as-code patterns for launching Cerefy on Google Cloud Platform (GCP).

---

## 1. Production Architecture Topology

```
                  [ Cloud DNS ]
                        │
                        ▼
               [ Cloud Load Balancer ]
                        │ (HTTPS / SSL Offloading via Google-managed certs)
                        ▼
                [ Google Front End ]
                        │
                        ▼
             [ Google Kubernetes Engine (GKE) ]
              (Autoscaled Node pool: e2-standard-4)
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   [ cerefy-app pod 1 ]          [ cerefy-app pod 2 ]
   (Express Monolith)            (Express Monolith)
         │                             │
         └──────────────┬──────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   [ Cloud SQL ]   [ GCE VM ]     [ Vertex AI / Gemini API ]
   (PostgreSQL 16  (Neo4j Graph   (Managed LLM orchestration)
    + pgvector)     Database)
```

---

## 2. Terraform Infrastructure Provisioning

Save this configuration as `main.tf` to provision the foundation on GCP:

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  type        = string
  description = "The GCP Project ID"
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP Region for resources"
}

# ─── VPC Network ──────────────────────────────────────────
resource "google_compute_network" "vpc" {
  name                    = "cerefy-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "cerefy-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# ─── Cloud SQL (PostgreSQL with pgvector) ────────────────
resource "google_sql_database_instance" "postgres" {
  name             = "cerefy-db-instance"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = "db-custom-2-7680" # 2 vCPU, 7.5GB RAM
    ip_configuration {
      ipv4_enabled    = true
      private_network = null
    }
    database_flags {
      name  = "cloudsql.enable_pgvector"
      value = "on"
    }
  }
  deletion_protection = true
}

resource "google_sql_database" "database" {
  name     = "cerefy_production"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "db_user" {
  name     = "cerefy"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# ─── Google Kubernetes Engine (GKE Autopilot) ───────────
resource "google_container_cluster" "gke" {
  name     = "cerefy-gke-cluster"
  location = var.region
  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  enable_autopilot = true
  ip_allocation_policy {}
}

# ─── GCE VM for Neo4j Graph Database ────────────────────
resource "google_compute_instance" "neo4j" {
  name         = "cerefy-neo4j-node"
  machine_type = "e2-standard-2" # 2 vCPU, 8GB RAM
  zone         = "${var.region}-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 50 # 50GB Persistent Disk
    }
  }

  network_interface {
    network    = google_compute_network.vpc.name
    subnetwork = google_compute_subnetwork.subnet.name
    access_config {} # Dynamic Public IP
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    sudo apt update
    sudo apt install -y docker.io
    sudo docker run -d \
      --name neo4j \
      -p 7474:7474 -p 7687:7687 \
      -v /var/lib/neo4j/data:/data \
      --env NEO4J_AUTH=neo4j/${var.neo4j_password} \
      neo4j:5.20.0
  EOT
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "neo4j_password" {
  type      = string
  sensitive = true
}
```

---

## 3. Vertex AI Integration Configuration

Cerefy hooks directly into Google's Vertex AI model APIs (Gemini 1.5 Pro/Flash). Since we utilize standard OAuth/Application Default Credentials (ADC) in GCP:

1. **Attach Service Account**: Ensure the GKE cluster runs under a workload identity/service account with the role `roles/aiplatform.user`.
2. **Vertex Endpoint**: The backend resolves API calls natively without static API keys when deployed within Google Cloud.
