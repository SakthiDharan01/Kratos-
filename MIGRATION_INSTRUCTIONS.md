# Database Migration Instructions

## Event Table Schema Update (2025-09-09)

### Changes Made:
1. **Added new columns:**
   - `venue` VARCHAR(255) NOT NULL - Physical or virtual location of the event
   - `rounds` TEXT - Description of event rounds/phases

2. **Modified existing columns:**
   - `rules` - Now NOT NULL (required field)
   - `event_date` - Made NOT NULL (required field)
   - `time_slot` - Updated constraint to use 'morning'/'afternoon'/'both' instead of 'slot1'/'slot2'/'both'
   - `category` - Updated constraint to use specific values: 'technical', 'no_code', 'playground', 'online'
   - `incharge_name1/2` - Increased length to VARCHAR(255) and made NOT NULL
   - `incharge_phone1/2` - Changed to VARCHAR(15) and made NOT NULL
   - `participant_limit` - Made NOT NULL with default value 0

3. **Removed columns:**
   - `start_time` - No longer needed
   - `end_time` - No longer needed
   - `slot_duration` - No longer needed
   - `registration_start` - No longer needed
   - `registration_end` - No longer needed

### Migration File:
- `supabase/migrations/20250909_update_events_schema.sql`

### Frontend Updates:
- Updated `Event` interface in `lib/store.ts`
- Updated `fetchEvents` function in `lib/events.ts`
- Removed references to deprecated fields
- Added support for new `venue` and `rounds` fields

### Running the Migration:

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to SQL Editor
4. Copy and paste the contents of `supabase/migrations/20250909_update_events_schema.sql`
5. Run the SQL script

## Option 2: Using Supabase CLI (if installed)

```bash
supabase db push
```

## Option 3: Manual SQL Execution

If you prefer to run the migration manually, execute the following SQL commands in your database:

```sql
-- Add new columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS rounds TEXT;

-- Update time_slot constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_time_slot_check;
ALTER TABLE events ADD CONSTRAINT events_time_slot_check CHECK (time_slot IN ('morning','afternoon','both'));

-- Update existing time_slot values
UPDATE events SET time_slot = 'morning' WHERE time_slot = 'slot1';
UPDATE events SET time_slot = 'afternoon' WHERE time_slot = 'slot2';

-- Make rules NOT NULL
UPDATE events SET rules = '' WHERE rules IS NULL;
ALTER TABLE events ALTER COLUMN rules SET NOT NULL;

-- Make venue NOT NULL
UPDATE events SET venue = 'TBD' WHERE venue IS NULL;
ALTER TABLE events ALTER COLUMN venue SET NOT NULL;

-- Update category constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events ADD CONSTRAINT events_category_check CHECK (category IN ('technical', 'no_code', 'playground', 'online'));

-- Update category values
UPDATE events SET category = 'technical' WHERE category = 'Technical';
UPDATE events SET category = 'no_code' WHERE category = 'No-Code';
UPDATE events SET category = 'playground' WHERE category = 'PlayGround';
UPDATE events SET category = 'online' WHERE category = 'Online Events';

-- Update incharge fields
UPDATE events SET incharge_name1 = 'TBD' WHERE incharge_name1 IS NULL;
UPDATE events SET incharge_phone1 = 'TBD' WHERE incharge_phone1 IS NULL;
UPDATE events SET incharge_name2 = 'TBD' WHERE incharge_name2 IS NULL;
UPDATE events SET incharge_phone2 = 'TBD' WHERE incharge_phone2 IS NULL;

ALTER TABLE events ALTER COLUMN incharge_name1 TYPE VARCHAR(255);
ALTER TABLE events ALTER COLUMN incharge_name1 SET NOT NULL;
ALTER TABLE events ALTER COLUMN incharge_phone1 TYPE VARCHAR(15);
ALTER TABLE events ALTER COLUMN incharge_phone1 SET NOT NULL;
ALTER TABLE events ALTER COLUMN incharge_name2 TYPE VARCHAR(255);
ALTER TABLE events ALTER COLUMN incharge_name2 SET NOT NULL;
ALTER TABLE events ALTER COLUMN incharge_phone2 TYPE VARCHAR(15);
ALTER TABLE events ALTER COLUMN incharge_phone2 SET NOT NULL;

-- Update participant_limit
UPDATE events SET participant_limit = 0 WHERE participant_limit IS NULL;
ALTER TABLE events ALTER COLUMN participant_limit SET NOT NULL;
ALTER TABLE events ALTER COLUMN participant_limit SET DEFAULT 0;

-- Remove unnecessary columns
ALTER TABLE events DROP COLUMN IF EXISTS start_time;
ALTER TABLE events DROP COLUMN IF EXISTS end_time;
ALTER TABLE events DROP COLUMN IF EXISTS slot_duration;
ALTER TABLE events DROP COLUMN IF EXISTS registration_start;
ALTER TABLE events DROP COLUMN IF EXISTS registration_end;
```

### Data Migration Notes:
- Existing `time_slot` values are automatically converted ('slot1' → 'morning', 'slot2' → 'afternoon')
- Default venues are assigned based on category
- Sample rounds descriptions are added for existing events
- NULL values in required fields are populated with appropriate defaults

### Important Notes:
- **Backup your database** before running the migration
- The migration is designed to be safe and preserve existing data
- Test in a development environment first if possible
- The migration includes sample data population for new fields

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `qfihpgcwkaybzudfyzxk`
3. Go to SQL Editor
4. Copy and paste the contents of the migration file: `supabase/migrations/20250909_update_events_table_structure.sql`
5. Run the migration

## Option 2: Install Supabase CLI and run locally

```powershell
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref qfihpgcwkaybzudfyzxk

# Run the migration
supabase db push
```

## Important Notes

1. **Backup First**: Before running the migration, ensure you have a backup of your database
2. **Test Environment**: If possible, test this migration on a staging environment first
3. **Data Validation**: After migration, verify that existing events data is properly updated
4. **Category Updates**: The migration includes updates to convert existing category values to match the new ENUM

## What This Migration Does

- Makes `rules`, `event_date`, `time_slot`, `start_time`, `end_time` required fields
- Updates all incharge fields to be required with increased length
- Changes `category` to a strict ENUM type with: 'technical', 'no_code', 'playground', 'online'
- Removes `slot_duration`, `registration_start`, `registration_end` columns
- Adds new `rounds` and `venue` columns
- Changes timestamp columns from TIMESTAMPTZ to TIMESTAMP
- Adds proper constraints and defaults

## Post-Migration Steps

1. Update any existing events to have proper venue information
2. Verify that all existing events have valid category values
3. Test the frontend to ensure all components work with the new schema
4. Update any API endpoints that might reference the removed fields
