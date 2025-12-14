#!/bin/sh
set -e

echo "✅ Database ready (schema initialized via postgres-init)"
echo "🚀 Starting Next.js server..."

exec npm start
