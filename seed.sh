#!/bin/bash

echo "🗑️  Deleting existing database..."
rm kawayan.db 2>/dev/null
rm kawayan.db-shm 2>/dev/null
rm kawayan.db-wal 2>/dev/null

echo "🌱 Running seeder..."
npx tsx seed.ts

echo "✨ Seeding complete!"
