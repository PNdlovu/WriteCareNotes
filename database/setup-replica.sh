#!/bin/bash
# Setup PostgreSQL Replica Server

set -e

echo "Setting up PostgreSQL replica..."

# Wait for primary to be ready
until PGPASSWORD=$POSTGRES_REPLICATION_PASSWORD psql -h "$POSTGRES_PRIMARY_HOST" -U "$POSTGRES_REPLICATION_USER" -c '\q'; do
  echo "Waiting for primary database to be ready..."
  sleep 5
done

echo "Primary database is ready. Starting replication setup..."

# Stop PostgreSQL if running
pg_ctl -D "$PGDATA" stop || true

# Remove existing data directory
rm -rf "$PGDATA"/*

# Base backup from primary
PGPASSWORD=$POSTGRES_REPLICATION_PASSWORD pg_basebackup \
    -h "$POSTGRES_PRIMARY_HOST" \
    -U "$POSTGRES_REPLICATION_USER" \
    -D "$PGDATA" \
    -P \
    -Xs \
    -R

# Create standby signal file (PostgreSQL 12+)
touch "$PGDATA/standby.signal"

# Configure recovery settings
cat >> "$PGDATA/postgresql.auto.conf" <<EOF
primary_conninfo = 'host=$POSTGRES_PRIMARY_HOST port=5432 user=$POSTGRES_REPLICATION_USER password=$POSTGRES_REPLICATION_PASSWORD application_name=$(hostname)'
primary_slot_name = '$(hostname)_slot'
hot_standby = on
EOF

echo "Replica setup completed successfully!"
echo "Starting PostgreSQL replica..."

# Start PostgreSQL
pg_ctl -D "$PGDATA" -o "-c listen_addresses='*'" -w start
