import * as dotenv from 'dotenv';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { generateDotEnv } from './lib/env';
import { join } from 'path';

dotenv.config();

// This script generates a default .env file in the server folder.
// Variables that need to be inserted are the openAI credentials, and an
// email for the user to received cord notifications

const main = async () => {
  // Check if there is an existing one
  await generateDotEnv();
};

main().catch((err) => {
  console.error('Somthing went wrong with generating .env', err);
  process.exit(1);
});
