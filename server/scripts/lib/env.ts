import axios from 'axios';
import * as dotenv from 'dotenv';
import { appendFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

export const defaultEnvValues = {
  HOST: 'http://localhost',
  PORT: 4000,
  CORD_SERVER: 'https://local.cord.com:8161',
  CORD_APPLICATION_ID: '',
  CORD_API_SECRET: '',
  CORD_USER_EMAIL: '<INSERT AN EMAIL ADDRESS FOR USER NOTIFICATIONS>',
  OPENAI_API_SECRET: '<INSERT YOUR OPEN API SECRET>',
};

export type DefaultEnvKeys = keyof typeof defaultEnvValues;

const ENV_KEYS = Object.keys(defaultEnvValues) as Array<DefaultEnvKeys>;

export async function generateDotEnv() {
  const envFile = existsSync(join(process.cwd(), '.env'));
  if (!envFile) {
    console.log('Creating .env with default values');
    await populateEnvWithDefaultVars();
    console.log('Please fill in the missing env variables in .env');
    return;
  }
  const result = dotenv.config().parsed;
  if (!result) {
    console.log('No envs found, populating with default values');
    await populateEnvWithDefaultVars();
    console.log('Please fill in the missing env variables in .env');
    return;
  }

  const missingEnvVars = new Set<DefaultEnvKeys>();

  ENV_KEYS.forEach((variableName) => {
    if (!result[variableName]) {
      missingEnvVars.add(variableName as DefaultEnvKeys);
    }
  });

  if (missingEnvVars.size > 0) {
    console.log(
      `Missing environment variables: ${Array.from(missingEnvVars).join(', ')}`,
    );
    console.log('Populating .env with some default fallback values');
    await populateEnvWithSomeDefaultVars(
      Array.from(missingEnvVars),
      result.HOST,
      result.PORT,
    );
    console.log('Please fill in the missing env variables in .env');
  }
}

export async function populateEnvWithSomeDefaultVars(
  missingEnvVars: DefaultEnvKeys[],
  host: string | undefined,
  port: string | undefined,
) {
  const writeData: string[] = [];
  if (
    missingEnvVars.includes('CORD_APPLICATION_ID') ||
    missingEnvVars.includes('CORD_API_SECRET')
  ) {
    await updateCordSampleAppIDAndSecretInDefaultValues(
      `${host ?? defaultEnvValues.HOST}:${port ?? defaultEnvValues.PORT}`,
    );
  }

  missingEnvVars.forEach(async (missingVar) => {
    writeData.push(generateEnvRow(missingVar));
  });

  appendFileSync(join(process.cwd(), '.env'), '\n' + writeData.join(''));
}

async function populateEnvWithDefaultVars() {
  await updateCordSampleAppIDAndSecretInDefaultValues(
    `${defaultEnvValues.HOST}:${defaultEnvValues.PORT}`,
  );
  await writeFileSync(
    join(process.cwd(), '.env'),
    ENV_KEYS.map((envVar) => generateEnvRow(envVar)).join(''),
  );
}

function generateEnvRow(envVar: DefaultEnvKeys) {
  return envVar + '=' + `'${defaultEnvValues[envVar]}'` + '\n';
}

async function updateCordSampleAppIDAndSecretInDefaultValues(hostname: string) {
  // If it is not found in .env we fetch for a
  // sample application id and secret
  const result = await getCordSampleAppIDAndSecret(hostname);
  if (result && 'applicationID' in result && 'applicationSecret' in result) {
    defaultEnvValues['CORD_APPLICATION_ID'] = result.applicationID;
    defaultEnvValues['CORD_API_SECRET'] = result.applicationSecret;
    return;
  }

  console.log('Could not get Cord sample app credentials');
}

async function getCordSampleAppIDAndSecret(hostname: string) {
  // Fetches a temporary application ID and secret, data in this application
  // will be erased in 7 days
  const CORD_SERVER = defaultEnvValues['CORD_SERVER'];
  try {
    const response = await axios.post(
      `${CORD_SERVER}/ai-chatbot-repo-sample-app`,
      {
        hostname,
      },
    );
    if (response.status !== 200) {
      throw new Error('Response not 200');
    }
    const { applicationID, secret } = response.data;
    return {
      applicationID,
      applicationSecret: secret,
    };
  } catch (error) {
    console.log('Something went wrong in getCordSampleAppIDAndSecret:', error);
  }
}
