import User from '../models/User.js';
import Organization from '../models/Organization.js';

export const clerkWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = data;
      
      const email = email_addresses[0]?.email_address;
      
      if (!email) {
        return res.status(400).json({
          error: true,
          message: 'No email address found',
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ clerkUserId: id });
      if (existingUser) {
        return res.status(200).json({ message: 'User already exists' });
      }

      // Create organization
      const organization = await Organization.create({
        name: `${first_name || 'User'}'s Company`,
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
      });

      // Create user
      await User.create({
        clerkUserId: id,
        email,
        firstName: first_name || '',
        lastName: last_name || '',
        organizationId: organization._id,
        role: 'admin', // First user is admin
      });

      console.log(`[Webhook] User created: ${email} (${id})`);
      return res.status(201).json({
        message: 'User and organization created successfully',
      });
    }

    // Handle other webhook events if needed
    return res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};