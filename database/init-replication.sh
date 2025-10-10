#!/bin/bash
# Initialize PostgreSQL Replication on Primary Server

set -e

echo "Initializing replication on primary server..."

# Create replication user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create replication user
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'replicator') THEN
            CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '${POSTGRES_REPLICATION_PASSWORD}';
        END IF;
    END
    \$\$;

    -- Grant necessary privileges
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO replicator;
    
    -- Create replication slot for replica 1
    SELECT pg_create_physical_replication_slot('replica1_slot');
    
    -- Create replication slot for replica 2
    SELECT pg_create_physical_replication_slot('replica2_slot');
EOSQL

echo "Replication initialized successfully!"
echo "Replication user: replicator"
echo "Replication slots created: replica1_slot, replica2_slot"
