import { createClerkClient } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export default clerk;