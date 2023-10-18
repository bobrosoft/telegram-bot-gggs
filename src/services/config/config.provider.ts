import dotenv from 'dotenv';
import {Config} from '../../models/config.model';

export function provideConfig(environment: 'staging' | 'production' = 'staging'): Config {
  dotenv.config({path: '.env.' + environment});

  return {
    botToken: String(process.env.BOT_TOKEN),
    chatLink: 'https://t.me/gggs_glazov',
    vkAccessToken: String(process.env.VK_ACCESS_TOKEN),
    vkGroupsToCheck: ['-59783420'],
    chatsForVkReposts: environment === 'production' ? [-1001413709807] : [207309431],
  };
}
