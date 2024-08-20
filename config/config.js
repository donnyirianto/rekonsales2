import dotenv from 'dotenv';
import Joi from 'joi';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import { dirname } from 'path'; 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const envVarsSchema = Joi.object()
  .keys({
    REDIS_HOST: Joi.string().required().description('REDIS HOST'),
    REDIS_PASS: Joi.string().required().description('REDIS PASS'),
    REDIS_PORT: Joi.number().required().description('REDIS PORT'),
    PROSES: Joi.number().default(300),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  proses: envVars.PROSES,
  prosesInsert: envVars.PROSESINSERT,
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    pass: envVars.REDIS_PASS
  }
};
