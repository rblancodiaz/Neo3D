# Hotel Room Mapper - Database Schema

## Overview
Complete PostgreSQL 15+ database schema for the Hotel Room Mapper application, featuring normalized coordinate storage, spatial functions, and optimized performance indexes.

## Database Structure

### Core Tables
- **hotels**: Main hotel entities with image references
- **floors**: Hotel floors/levels with ordering
- **rooms**: Room entities with normalized coordinates (0-1 range)
- **room_coordinate_history**: Audit trail for coordinate changes

### Key Features
- **Normalized Coordinates**: All coordinates stored as DECIMAL(12,10) in 0-1 range
- **Spatial Functions**: Overlap detection, point-in-room queries, region searches
- **Automatic Triggers**: Counter maintenance, audit trails, validation
- **Optimized Views**: Pre-computed aggregations for performance
- **Geometric Indexes**: Specialized indexes for spatial queries

## Installation

### Prerequisites
- PostgreSQL 15 or higher
- Superuser access for initial setup
- ~100MB minimum storage for initial setup

### Quick Setup
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Run the complete setup script
\i D:/devprojects/Neo3D/database/08_create_all.sql
```

### Manual Setup (Step by Step)
```bash
# 1. Create database
psql -U postgres -f database/01_create_database.sql

# 2. Create tables
psql -U postgres -d hotel_mapper -f database/schema/02_create_tables.sql

# 3. Create indexes
psql -U postgres -d hotel_mapper -f database/indexes/03_create_indexes.sql

# 4. Create functions
psql -U postgres -d hotel_mapper -f database/functions/04_spatial_functions.sql

# 5. Create triggers
psql -U postgres -d hotel_mapper -f database/triggers/05_create_triggers.sql

# 6. Create views
psql -U postgres -d hotel_mapper -f database/views/06_create_views.sql

# 7. Load sample data (optional)
psql -U postgres -d hotel_mapper -f database/seeds/07_seed_data.sql
```

## Configuration

### Database Users
- **postgres**: Superuser for setup and maintenance
- **hotel_app**: Application user with CRUD permissions
- **hotel_backup**: Read-only user for backups

### Connection Settings
```yaml
Host: localhost
Port: 5432
Database: hotel_mapper
Username: hotel_app
Password: hotel_app_password  # Change in production!
```

### Performance Tuning
Apply the optimized PostgreSQL configuration:
```bash
# Copy configuration to PostgreSQL data directory
cp database/config/postgresql.conf /var/lib/postgresql/15/main/

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Key Functions

### Spatial Functions

#### check_room_overlap()
Detects overlapping rooms with configurable tolerance:
```sql
SELECT * FROM check_room_overlap(
    'floor-uuid',           -- floor_id
    0.1, 0.2, 0.15, 0.25,  -- x, y, width, height
    NULL,                   -- exclude_room_id
    0.05                    -- 5% tolerance
);
```

#### find_rooms_at_point()
Find rooms containing a specific point:
```sql
SELECT * FROM find_rooms_at_point(
    'floor-uuid',  -- floor_id
    0.5, 0.5       -- x, y coordinates
);
```

#### validate_room_coordinates()
Comprehensive validation before insert/update:
```sql
SELECT * FROM validate_room_coordinates(
    'floor-uuid',           -- floor_id
    0.1, 0.2, 0.15, 0.25,  -- x, y, width, height
    NULL                    -- room_id (for updates)
);
```

## Views

### hotel_summary
Aggregated statistics for hotel dashboards:
```sql
SELECT * FROM hotel_summary WHERE status = 'active';
```

### floor_details
Floor information with room statistics:
```sql
SELECT * FROM floor_details WHERE hotel_id = 'uuid';
```

### room_coordinate_map
Optimized for canvas rendering:
```sql
SELECT * FROM room_coordinate_map WHERE floor_id = 'uuid';
```

## Maintenance

### Update Statistics
```sql
ANALYZE hotels;
ANALYZE floors;
ANALYZE rooms;
```

### Refresh Materialized View
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY floor_room_cache;
```

### Check for Overlaps
```sql
SELECT * FROM overlap_analysis;
```

### Monitor Performance
```sql
-- Top slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Index usage
SELECT * FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;
```

## Backup & Recovery

### Backup
```bash
# Full database backup
pg_dump -U hotel_backup -d hotel_mapper -Fc > hotel_mapper_backup.dump

# Schema only
pg_dump -U hotel_backup -d hotel_mapper --schema-only > schema.sql

# Data only
pg_dump -U hotel_backup -d hotel_mapper --data-only > data.sql
```

### Restore
```bash
# Restore from dump
pg_restore -U postgres -d hotel_mapper hotel_mapper_backup.dump

# Restore specific table
pg_restore -U postgres -d hotel_mapper -t rooms hotel_mapper_backup.dump
```

## Testing

### Verify Installation
```sql
-- Check table counts
SELECT 
    (SELECT COUNT(*) FROM hotels) as hotels,
    (SELECT COUNT(*) FROM floors) as floors,
    (SELECT COUNT(*) FROM rooms) as rooms;

-- Test overlap detection
SELECT * FROM check_room_overlap(
    (SELECT id FROM floors LIMIT 1),
    0.1, 0.1, 0.2, 0.2
);

-- Test coordinate validation
SELECT * FROM validate_room_coordinates(
    (SELECT id FROM floors LIMIT 1),
    0.1, 0.1, 0.2, 0.2
);
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
```sql
GRANT ALL PRIVILEGES ON DATABASE hotel_mapper TO hotel_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO hotel_app;
```

2. **Extension Not Found**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

3. **Slow Queries**
```sql
-- Check query plan
EXPLAIN ANALYZE SELECT * FROM rooms WHERE floor_id = 'uuid';

-- Update statistics
VACUUM ANALYZE rooms;
```

## Security Notes

⚠️ **Production Deployment**:
- Change default passwords immediately
- Use SSL connections
- Implement connection pooling (PgBouncer)
- Set up regular automated backups
- Monitor with pg_stat_statements
- Apply principle of least privilege

## Support

For issues or questions about the database schema, please refer to:
- `/docs/03_database_req.md` - Detailed requirements
- PostgreSQL documentation: https://www.postgresql.org/docs/15/