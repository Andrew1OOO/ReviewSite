#!/bin/bash
# Usage: bash scripts/set-password.sh your@email.com yourpassword

set -e

EMAIL=$1
PASSWORD=$2

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: bash scripts/set-password.sh your@email.com yourpassword"
  exit 1
fi

# Load env vars
source .env

SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY not found in .env"
  echo "Add it: Supabase → Project Settings → API → service_role key"
  exit 1
fi

# Get user ID by email
echo "Looking up user: $EMAIL"
USER_ID=$(curl -s \
  "${SUPABASE_URL}/auth/v1/admin/users?email=${EMAIL}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "Error: Could not find user with email $EMAIL"
  exit 1
fi

echo "Found user ID: $USER_ID"
echo "Setting password..."

RESULT=$(curl -s -X PUT \
  "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${PASSWORD}\"}")

if echo "$RESULT" | grep -q '"id"'; then
  echo "Password set successfully. You can now sign in at /signin with the Password tab."
else
  echo "Error: $RESULT"
fi
