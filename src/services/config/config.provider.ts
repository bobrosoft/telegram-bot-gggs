import dotenv from 'dotenv';
import {Config} from '../../models/config.model';

export function provideConfig(environment = 'production'): Config {
  dotenv.config();

  return {
    botToken: String(process.env.BOT_TOKEN),
    chatLink: 'https://t.me/gggs_glazov',
  };
}
