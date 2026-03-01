-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Note: The activity_streams hypertable will be created by Drizzle migration,
-- then converted to a hypertable with:
-- SELECT create_hypertable('activity_streams', 'timestamp', migrate_data => true);
