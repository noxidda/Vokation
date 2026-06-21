import { Clerk } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export default clerk;