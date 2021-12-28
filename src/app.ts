import {Telegraf} from 'telegraf';
import {Config} from './models/config.model';
import {provideConfig} from './services/config/config.provider';

export class App {
  protected bot: Telegraf;

  constructor(
    //
    protected config: Config = provideConfig(),
  ) {
    this.bot = new Telegraf(config.botToken);
    this.bot.start(ctx => ctx.reply('Welcome'));
    this.bot.help(ctx => ctx.reply('Send me a sticker'));
    this.bot.on('sticker', ctx => ctx.reply('👍'));
    this.bot.hears('hi', ctx => ctx.reply('Hey there'));
  }

  launch(): Promise<void> {
    return this.bot.launch();
  }

  stop(reason?: string) {
    this.bot.stop(reason);
  }
}
