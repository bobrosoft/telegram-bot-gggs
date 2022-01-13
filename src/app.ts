import i18next, {TFunction} from 'i18next';
import {Telegraf} from 'telegraf';
import {translationsRU} from './i18n/ru';
import {Config} from './models/config.model';
import {CommandsService} from './services/commands/commands.service';
import {LoggerService} from './services/logger/logger.service';
import {VkReposterService} from './services/vk-reposter/vk-reposter.service';
import {BaseService} from './services/common.service';
import {provideConfig} from './services/config/config.provider';

export class App {
  protected t: TFunction; // i18n translation function
  protected bot: Telegraf;
  protected services: BaseService[] = [];

  constructor(
    //
    protected config: Config = provideConfig(process.env.ENVIRONMENT as any),
  ) {
    // Init i18n
    i18next.init({lng: 'ru'}).then();
    i18next.addResourceBundle('ru', 'translation', translationsRU, true, true);
    this.t = i18next.t;

    // Create bot
    this.bot = new Telegraf(config.botToken);

    // Create logger
    const logger = new LoggerService();

    // Register all services
    this.services.push(new CommandsService(logger, this.t, this.config, this.bot));
    this.services.push(new VkReposterService(logger, this.t, this.config, this.bot));
  }

  async start(): Promise<void> {
    await this.bot.launch();
    await Promise.all(this.services.map(s => s.start()));
  }

  async stop(reason?: string) {
    this.bot.stop(reason);
    await Promise.all(this.services.map(s => s.stop()));
  }
}
