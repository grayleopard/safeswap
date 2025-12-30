import pool from '../db/config.js';

export const getConversations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (conversation_id)
        CASE
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        u.phone as other_user_phone,
        l.id as listing_id,
        l.title as listing_title,
        m.message as last_message,
        m.created_at as last_message_at,
        m.read as last_message_read
      FROM messages m
      JOIN users u ON (
        CASE
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END = u.id
      )
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY
        CASE
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END,
        m.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { listingId } = req.query;

    let query = `
      SELECT m.*,
             sender.phone as sender_phone,
             receiver.phone as receiver_phone
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE ((m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1))
    `;

    const params = [req.user.id, otherUserId];

    if (listingId) {
      query += ' AND m.listing_id = $3';
      params.push(listingId);
    }

    query += ' ORDER BY m.created_at ASC';

    const result = await pool.query(query, params);

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET read = TRUE
       WHERE receiver_id = $1 AND sender_id = $2 AND read = FALSE`,
      [req.user.id, otherUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, listingId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({
        message: 'Receiver ID and message are required'
      });
    }

    // Check if receiver exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [receiverId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if listing exists (if provided)
    if (listingId) {
      const listingCheck = await pool.query(
        'SELECT id FROM listings WHERE id = $1',
        [listingId]
      );

      if (listingCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Listing not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, listing_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, receiverId, listingId || null, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await pool.query(
      `UPDATE messages SET read = TRUE
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND read = FALSE',
      [req.user.id]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};
