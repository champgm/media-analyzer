#!/bin/bash
set -Eeuo pipefail


npm ci
npm run build
npm prune --production

zip -rq1 "twilio-webhook.zip" "node_modules"
zip -gqr1 "twilio-webhook.zip" "tsc-out"
