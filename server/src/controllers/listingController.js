import pool from '../db/config.js';
import { checkSafetyRecall } from '../services/safetyService.js';

export const getListings = async (req, res) => {
  try {
    const { ageRange, category, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT l.*,
             u.phone as seller_phone,
             u.parent_badge as seller_parent_badge
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'active'
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (ageRange) {
      query += ` AND l.age_range = $${paramIndex}`;
      queryParams.push(ageRange);
      paramIndex++;
    }

    if (category) {
      query += ` AND l.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY l.featured DESC, l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

export const getListing = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT l.*,
              u.phone as seller_phone,
              u.parent_badge as seller_parent_badge,
              u.id as seller_id
       FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Increment view count
    await pool.query(
      'UPDATE listings SET views = views + 1 WHERE id = $1',
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ message: 'Failed to fetch listing' });
  }
};

export const createListing = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      ageRange,
      condition,
      brand,
      isSmokeFree,
      isPetFree,
      locationZip,
      images,
    } = req.body;

    // MVP Spec: Required fields
    if (!title || !price || !category || !ageRange || !condition || !locationZip) {
      return res.status(400).json({
        message: 'Title, price, category, age range, condition, and ZIP code are required'
      });
    }

    // MVP Spec: 2-6 photos required
    if (!images || images.length < 2 || images.length > 6) {
      return res.status(400).json({
        message: 'Please upload between 2 and 6 photos'
      });
    }

    // Check for safety recalls if brand is provided
    let safetyChecked = false;
    let hasRecalls = false;
    let recallDetails = null;

    if (brand) {
      const recallCheck = await checkSafetyRecall(brand, null, category);
      safetyChecked = true;
      hasRecalls = recallCheck.status === 'recalled';
      recallDetails = recallCheck.notes;
    }

    await client.query('BEGIN');

    // Insert listing
    const result = await client.query(
      `INSERT INTO listings (
        user_id, title, description, price, original_price, category, age_range,
        condition, brand, is_smoke_free, is_pet_free, location_zip,
        safety_checked, has_recalls, recall_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.user.id,
        title,
        description,
        price,
        originalPrice,
        category,
        ageRange,
        condition,
        brand,
        isSmokeFree,
        isPetFree,
        locationZip,
        safetyChecked,
        hasRecalls,
        recallDetails,
      ]
    );

    const listing = result.rows[0];

    // Insert images into listing_images table
    for (let i = 0; i < images.length; i++) {
      await client.query(
        'INSERT INTO listing_images (listing_id, image_url, display_order) VALUES ($1, $2, $3)',
        [listing.id, images[i], i]
      );
    }

    await client.query('COMMIT');

    // Return listing with images array for compatibility
    listing.images = images;

    res.status(201).json(listing);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Failed to create listing' });
  } finally {
    client.release();
  }
};

export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      category,
      ageRange,
      condition,
      status,
      images,
    } = req.body;

    // Check if listing belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE listings SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        category = COALESCE($4, category),
        age_range = COALESCE($5, age_range),
        condition = COALESCE($6, condition),
        status = COALESCE($7, status),
        images = COALESCE($8, images),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
      [title, description, price, category, ageRange, condition, status, images, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ message: 'Failed to update listing' });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if listing belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await pool.query('DELETE FROM listings WHERE id = $1', [id]);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
};

export const getUserListings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ message: 'Failed to fetch user listings' });
  }
};
