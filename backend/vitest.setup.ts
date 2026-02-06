import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
dotenv.config({ path: resolve(__dirname, '../.env') });
