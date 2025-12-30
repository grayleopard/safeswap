import axios from 'axios';
import pool from '../db/config.js';

// CPSC Recalls API endpoint
const CPSC_API_URL = 'https://www.saferproducts.gov/RestWebServices';

/**
 * Check if a product has any safety recalls
 * @param {string} brand - Product brand
 * @param {string} model - Product model
 * @param {string} category - Product category
 * @returns {Object} Safety status and notes
 */
export const checkSafetyRecall = async (brand, model, category) => {
  try {
    // First check our cached recalls
    const cachedResult = await pool.query(
      `SELECT * FROM safety_recalls
       WHERE LOWER(brand) = LOWER($1)
       AND (LOWER(model) = LOWER($2) OR LOWER(product_name) LIKE $3)
       ORDER BY recall_date DESC
       LIMIT 1`,
      [brand, model, `%${model}%`]
    );

    if (cachedResult.rows.length > 0) {
      const recall = cachedResult.rows[0];
      return {
        status: 'recalled',
        notes: `Recall: ${recall.hazard}. Remedy: ${recall.remedy}`,
        recallDate: recall.recall_date,
        recallId: recall.recall_id,
      };
    }

    // If not in cache, check CPSC API
    try {
      const response = await axios.get(`${CPSC_API_URL}/Recall`, {
        params: {
          format: 'json',
          ProductType: mapCategoryToProductType(category),
          RecallTitle: `${brand} ${model}`,
        },
        timeout: 5000,
      });

      if (response.data && response.data.length > 0) {
        const recall = response.data[0];

        // Cache the recall for future checks
        await pool.query(
          `INSERT INTO safety_recalls (recall_id, product_name, brand, model, hazard, remedy, recall_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (recall_id) DO NOTHING`,
          [
            recall.RecallNumber,
            recall.Products?.[0]?.Name || `${brand} ${model}`,
            brand,
            model,
            recall.Hazards?.[0]?.Name || 'Unknown hazard',
            recall.Remedies?.[0]?.Name || 'Contact manufacturer',
            recall.RecallDate || new Date(),
          ]
        );

        return {
          status: 'recalled',
          notes: `Recall: ${recall.Hazards?.[0]?.Name || 'Unknown hazard'}`,
          recallDate: recall.RecallDate,
          recallId: recall.RecallNumber,
        };
      }
    } catch (apiError) {
      console.warn('CPSC API check failed:', apiError.message);
      // Continue to safe status if API fails
    }

    // No recalls found
    return {
      status: 'safe',
      notes: 'No recalls found',
    };
  } catch (error) {
    console.error('Safety check error:', error);
    return {
      status: 'unknown',
      notes: 'Unable to verify safety status',
    };
  }
};

/**
 * Map our categories to CPSC product types
 */
function mapCategoryToProductType(category) {
  const mapping = {
    'Strollers': 'Strollers',
    'Car Seats': 'Child Safety Seats',
    'Cribs & Bassinets': 'Cribs',
    'Toys': 'Toys',
    'Clothing': 'Children\'s Products',
    'Feeding': 'Children\'s Products',
    'Books': 'Children\'s Products',
    'Other': 'Children\'s Products',
  };

  return mapping[category] || 'Children\'s Products';
}

/**
 * Get recent recalls for display
 */
export const getRecentRecalls = async (limit = 10) => {
  try {
    const result = await pool.query(
      'SELECT * FROM safety_recalls ORDER BY recall_date DESC LIMIT $1',
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Get recent recalls error:', error);
    return [];
  }
};
