import * as dotenv from 'dotenv';
import { appendFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

export const defaultEnvValues = {
  HOST: 'http://localhost',
  PORT: 4000,
  CORD_SERVER: 'https://api.cord.com:8161',
  CORD_APPLICATION_ID: '<INSERT A CORD APPLICATION ID>',
  CORD_API_SECRET:
    '<INSERT THE CORD API SECRET ASSOCIATED WITH APPLICATION ID>',
  CORD_USER_EMAIL: '<INSERT AN EMAIL ADDRESS FOR USER NOTIFICATIONS>',
  OPENAI_API_SECRET: '<INSERT YOUR OPEN API SECRET>',
};

const CORD_CREDENTIALS_MESSAGE =
  '--- Cord Credentials ---' +
  '\n' +
  'This can be found in the Cord Console https://console.cord.com.' +
  '\n' +
  'If you do not have an account you can sign up here: https://console.cord.com/signup.';

const OPENAI_CREDENTIALS_MESSAGE =
  '--- OpenAI Credentials ---' +
  '\n' +
  'This can be found once you have signed up to OpenAI https://platform.openai.com/account/api-keys.';

export type DefaultEnvKeys = keyof typeof defaultEnvValues;

const ENV_KEYS = Object.keys(defaultEnvValues) as Array<DefaultEnvKeys>;

export async function generateDotEnv() {
  const envFile = existsSync(join(process.cwd(), '.env'));
  if (!envFile) {
    console.log('--- Creating .env with default values ---');
    await populateEnvWithDefaultVars();
    console.log(
      'Please fill in the missing env variables in .env' +
        '\n\n' +
        CORD_CREDENTIALS_MESSAGE +
        '\n\n' +
        OPENAI_CREDENTIALS_MESSAGE,
    );
    return;
  }
  const result = dotenv.config().parsed;
  const missingEnvVars = new Set<DefaultEnvKeys>();

  ENV_KEYS.forEach((variableName) => {
    if (!result || !result[variableName]) {
      missingEnvVars.add(variableName as DefaultEnvKeys);
    }
  });

  if (missingEnvVars.size > 0) {
    console.log(
      '--- Missing environment variables ---' +
        '\n' +
        `${Array.from(missingEnvVars).join(', ')}`,
    );
    await populateEnvWithSomeDefaultVars(Array.from(missingEnvVars));
    console.log(
      `${
        missingEnvVars.has('CORD_APPLICATION_ID') ||
        missingEnvVars.has('CORD_API_SECRET')
          ? '\n' + CORD_CREDENTIALS_MESSAGE
          : ''
      }` +
        `${
          missingEnvVars.has('OPENAI_API_SECRET')
            ? '\n' + OPENAI_CREDENTIALS_MESSAGE
            : ''
        }`,
    );
  }
}

export async function populateEnvWithSomeDefaultVars(
  missingEnvVars: DefaultEnvKeys[],
) {
  const writeData: string[] = [];

  missingEnvVars.forEach(async (missingVar) => {
    writeData.push(generateEnvRow(missingVar));
  });

  appendFileSync(join(process.cwd(), '.env'), '\n' + writeData.join(''));
}

async function populateEnvWithDefaultVars() {
  await writeFileSync(
    join(process.cwd(), '.env'),
    ENV_KEYS.map((envVar) => generateEnvRow(envVar)).join(''),
  );
}

function generateEnvRow(envVar: DefaultEnvKeys) {
  return envVar + '=' + `'${defaultEnvValues[envVar]}'` + '\n';
}
