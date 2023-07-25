import * as dotenv from 'dotenv';
import { appendFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

export const defaultEnvValues = {
  HOST: 'http://localhost',
  PORT: 4000,
  CORD_SERVER: 'https://api.cord.com',
  CORD_APPLICATION_ID: '<INSERT A CORD APPLICATION ID>',
  CORD_API_SECRET:
    '<INSERT THE CORD API SECRET ASSOCIATED WITH APPLICATION ID>',
  CORD_USER_EMAIL: '<INSERT AN EMAIL ADDRESS FOR USER NOTIFICATIONS>',
  OPENAI_API_SECRET: '<INSERT YOUR OPEN API SECRET>',
  OPENAI_API_MODEL: 'gpt-3.5-turbo',
  CORD_WEBHOOK_PATH: '/cord-webhook',
};

const CORD_CREDENTIALS_MESSAGE =
  '--- Cord Credentials ---' +
  '\n' +
  'This can be found in the Cord Console https://console.cord.com.' +
  '\n' +
  'If you do not have an account you can sign up here: https://console.cord.com/signup.' +
  '\n\n';

const OPENAI_CREDENTIALS_MESSAGE =
  '--- OpenAI Credentials ---' +
  '\n' +
  'This can be found once you have signed up to OpenAI https://platform.openai.com/account/api-keys.' +
  '\n\n';

export type DefaultEnvKeys = keyof typeof defaultEnvValues;

const ENV_KEYS = Object.keys(defaultEnvValues) as Array<DefaultEnvKeys>;

export function generateDotEnv() {
  const envFile = existsSync(join(process.cwd(), '.env'));
  if (!envFile) {
    console.log('--- Creating .env with default values ---' + '\n\n');

    writeFileSync(
      join(process.cwd(), '.env'),
      ENV_KEYS.map((envVar) => generateEnvRow(envVar)).join(''),
    );

    console.log(
      'Please fill in the missing env variables in .env' +
        '\n\n' +
        CORD_CREDENTIALS_MESSAGE +
        OPENAI_CREDENTIALS_MESSAGE,
    );
    return;
  }

  const result = dotenv.config().parsed;
  checkForMissingVariables(result);
}

export async function checkEnvVars() {
  console.log('--- Checking Env ---' + '\n\n');
  const envFile = existsSync(join(process.cwd(), '.env'));
  if (!envFile) {
    generateDotEnv();
  }

  const result = dotenv.config().parsed;
  checkForMissingVariables(result, () => {
    throw new Error('Fill in missing variables.');
  });

  // Check if credentials are default values
  if (
    result &&
    result['CORD_APPLICATION_ID'] === defaultEnvValues['CORD_APPLICATION_ID']
  ) {
    throw new Error('Update Cord application id');
  }
  if (
    result &&
    result['CORD_API_SECRET'] === defaultEnvValues['CORD_API_SECRET']
  ) {
    throw new Error('Update Cord application api secret');
  }
  if (
    result &&
    result['OPENAI_API_SECRET'] === defaultEnvValues['OPENAI_API_SECRET']
  ) {
    throw new Error('Update openAI api secret');
  }
  if (
    result &&
    result['CORD_USER_EMAIL'] === defaultEnvValues['CORD_USER_EMAIL']
  ) {
    throw new Error('Update Cord user email');
  }
}

function populateEnvWithSomeDefaultVars(missingEnvVars: DefaultEnvKeys[]) {
  const writeData: string[] = [];

  missingEnvVars.forEach((missingVar) =>
    writeData.push(generateEnvRow(missingVar)),
  );
  appendFileSync(join(process.cwd(), '.env'), '\n' + writeData.join(''));
}

function generateEnvRow(envVar: DefaultEnvKeys) {
  return envVar + '=' + `'${defaultEnvValues[envVar]}'` + '\n';
}

function checkForMissingVariables(
  env: dotenv.DotenvParseOutput | undefined,
  onMissingVariables?: (missingEnvVars: Set<DefaultEnvKeys>) => void,
) {
  const missingEnvVars = new Set<DefaultEnvKeys>();

  ENV_KEYS.forEach((variableName) => {
    if (!env || !env[variableName]) {
      missingEnvVars.add(variableName as DefaultEnvKeys);
    }
  });

  if (missingEnvVars.size > 0) {
    console.log(
      '--- Missing environment variables ---' +
        '\n' +
        `${Array.from(missingEnvVars).join(', ')}` +
        '\n\n',
    );
    populateEnvWithSomeDefaultVars(Array.from(missingEnvVars));
    console.log(
      `${
        missingEnvVars.has('CORD_APPLICATION_ID') ||
        missingEnvVars.has('CORD_API_SECRET')
          ? CORD_CREDENTIALS_MESSAGE + '\n\n'
          : ''
      }` +
        `${
          missingEnvVars.has('OPENAI_API_SECRET')
            ? OPENAI_CREDENTIALS_MESSAGE + '\n\n'
            : ''
        }`,
    );
    onMissingVariables?.(missingEnvVars);
    return;
  }
  console.log('--- No environment variables missing ---' + '\n\n');
}
