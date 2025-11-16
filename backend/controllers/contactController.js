import User from '../models/User.js';

// @desc    Submit contact message (for logged-in users)
// @route   POST /api/contact
// @access  Private
export const submitContactMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user._id; // From auth middleware

    // Validation
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Validate length
    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Subject cannot exceed 200 characters'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters'
      });
    }

    // Find user and add contact message
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add message to user's contactMessages array
    user.contactMessages.push({
      subject: subject.trim(),
      message: message.trim(),
      status: 'new'
    });

    await user.save();

    console.log(`✅ Contact message saved for user: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: {
        subject,
        createdAt: user.contactMessages[user.contactMessages.length - 1].createdAt
      }
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};

// @desc    Get user's contact messages
// @route   GET /api/contact/my-messages
// @access  Private
export const getMyContactMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('contactMessages');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Sort messages by newest first
    const messages = user.contactMessages.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact/all
// @access  Private/Admin
export const getAllContactMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build aggregation pipeline
    const pipeline = [
      { $unwind: '$contactMessages' },
      {
        $project: {
          name: 1,
          email: 1,
          subject: '$contactMessages.subject',
          message: '$contactMessages.message',
          status: '$contactMessages.status',
          createdAt: '$contactMessages.createdAt',
          messageId: '$contactMessages._id'
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    // Filter by status if provided
    if (status) {
      pipeline.splice(1, 0, {
        $match: { 'contactMessages.status': status }
      });
    }

    const allMessages = await User.aggregate(pipeline);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const messages = allMessages.slice(startIndex, endIndex);

    res.json({
      success: true,
      count: messages.length,
      total: allMessages.length,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allMessages.length / limit),
        hasNext: endIndex < allMessages.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching all messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

// @desc    Get contact message statistics (Admin only)
// @route   GET /api/contact/stats
// @access  Private/Admin
export const getContactStats = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: '$contactMessages' },
      {
        $group: {
          _id: '$contactMessages.status',
          count: { $sum: 1 }
        }
      }
    ];

    const stats = await User.aggregate(pipeline);

    // Format the stats
    const formattedStats = {
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

// @desc    Update contact message status (Admin only)
// @route   PATCH /api/contact/:userId/:messageId/status
// @access  Private/Admin
export const updateMessageStatus = async (req, res) => {
  try {
    const { userId, messageId } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        'contactMessages._id': messageId
      },
      {
        $set: { 'contactMessages.$.status': status }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// @desc    Reply to a contact message (Admin only)
// @route   POST /api/contact/:userId/:messageId/reply
// @access  Private/Admin
export const replyToMessage = async (req, res) => {
  try {
    const { userId, messageId } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        'contactMessages._id': messageId
      },
      {
        $set: { 
          'contactMessages.$.status': 'replied',
          'contactMessages.$.reply': reply.trim(),
          'contactMessages.$.repliedAt': new Date(),
          'contactMessages.$.repliedBy': req.user._id
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // TODO: Send email notification to user
    // You can add email sending logic here

    res.json({
      success: true,
      message: 'Reply sent successfully'
    });

  } catch (error) {
    console.error('❌ Error replying to message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
};

// @desc    Delete contact message (Admin only)
// @route   DELETE /api/contact/:userId/:messageId
// @access  Private/Admin
export const deleteContactMessage = async (req, res) => {
  try {
    const { userId, messageId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { contactMessages: { _id: messageId } }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};