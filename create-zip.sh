#!/bin/bash

set -Eeuo pipefail

npm ci
npm run build
npm prune --production

zip -rq1 "lambda-api.zip" "node_modules"
zip -gqr1 "lambda-api.zip" "tsc-out"

