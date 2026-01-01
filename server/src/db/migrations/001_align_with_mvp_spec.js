import pool from '../config.js';

const migration = `
-- ============================================
-- Migration: Align schema with MVP spec
-- ============================================

-- Add missing fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location_zip VARCHAR(5),
  ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS location_lon DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS is_verified_parent BOOLEAN DEFAULT FALSE;

-- Rename phone to phone_number for consistency (if not already renamed)
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='phone'
  ) THEN
    ALTER TABLE users RENAME COLUMN phone TO phone_number;
  END IF;
END $$;

-- Rename parent_badge to is_verified_parent (if exists)
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='parent_badge'
  ) THEN
    ALTER TABLE users DROP COLUMN parent_badge;
  END IF;
END $$;

-- Add missing fields to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS is_smoke_free BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_pet_free BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS location_zip VARCHAR(5),
  ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS location_lon DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS safety_checked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_recalls BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recall_details JSONB;

-- Rename columns for consistency
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='listings' AND column_name='latitude'
  ) THEN
    ALTER TABLE listings DROP COLUMN latitude;
  END IF;

  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='listings' AND column_name='longitude'
  ) THEN
    ALTER TABLE listings DROP COLUMN longitude;
  END IF;

  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='listings' AND column_name='location'
  ) THEN
    ALTER TABLE listings DROP COLUMN location;
  END IF;
END $$;

-- Create listing_images table (separate from listings array)
CREATE TABLE IF NOT EXISTS listing_images (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for listing_images
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_order ON listing_images(listing_id, display_order);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_listings_location_zip ON listings(location_zip);
CREATE INDEX IF NOT EXISTS idx_listings_location_coords ON listings(location_lat, location_lon);
CREATE INDEX IF NOT EXISTS idx_users_location_zip ON users(location_zip);

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add index for sold listings
CREATE INDEX IF NOT EXISTS idx_listings_is_sold ON listings(is_sold);

-- Update messages table to match spec (rename receiver_id to recipient_id)
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='messages' AND column_name='receiver_id'
  ) THEN
    ALTER TABLE messages RENAME COLUMN receiver_id TO recipient_id;
  END IF;

  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='messages' AND column_name='read'
  ) THEN
    ALTER TABLE messages RENAME COLUMN read TO is_read;
  END IF;

  IF EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name='messages' AND column_name='message'
  ) THEN
    ALTER TABLE messages RENAME COLUMN message TO message_text;
  END IF;
END $$;

-- Add constraint for message length (max 500 chars per spec)
ALTER TABLE messages
  ADD CONSTRAINT check_message_length
  CHECK (char_length(message_text) <= 500);

-- Add constraint for listing title length (max 100 chars per spec)
ALTER TABLE listings
  ADD CONSTRAINT check_title_length
  CHECK (char_length(title) <= 100);

-- Add constraint for listing description length (max 1000 chars per spec)
ALTER TABLE listings
  ADD CONSTRAINT check_description_length
  CHECK (char_length(description) <= 1000);
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: Align schema with MVP spec...');
    await client.query(migration);
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigration;
