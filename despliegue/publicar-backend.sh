#!/usr/bin/env bash
set -euo pipefail

proyecto="${FIREBASE_PROJECT_ID:?Definí FIREBASE_PROJECT_ID antes de publicar.}"
region="${CLOUD_RUN_REGION:-southamerica-east1}"
origen="${FRONTEND_ORIGIN:?Definí FRONTEND_ORIGIN con las direcciones de la web.}"
cuentaCompilacion="projects/${proyecto}/serviceAccounts/menteclear-compilacion@${proyecto}.iam.gserviceaccount.com"
cuentaBackend="menteclear-backend@${proyecto}.iam.gserviceaccount.com"

gcloud run deploy menteclear-api \
  --project="${proyecto}" \
  --region="${region}" \
  --source=. \
  --build-service-account="${cuentaCompilacion}" \
  --service-account="${cuentaBackend}" \
  --set-env-vars="^|^FIREBASE_PROJECT_ID=${proyecto}|FRONTEND_ORIGIN=${origen}|REMINDERS_ENABLED=false" \
  --cpu=1 \
  --memory=512Mi \
  --min=0 \
  --min-instances=0 \
  --max=1 \
  --max-instances=1 \
  --concurrency=20 \
  --timeout=300 \
  --cpu-throttling \
  --no-cpu-boost \
  --execution-environment=gen2 \
  --port=8080 \
  --ingress=all \
  --allow-unauthenticated \
  --quiet
