import i18next, {TFunction} from 'i18next';
import fetch from 'node-fetch';
import {Telegraf} from 'telegraf';
import {container} from 'tsyringe';
import {translationsRU} from './i18n/ru';
import {ConfigToken, FetchToken, TFunctionToken} from './misc/injection-tokens';
import {Config} from './models/config.model';
import {CommandsService} from './services/commands/commands.service';
import {LoggerService} from './services/logger/logger.service';
import {VkReposterService} from './services/vk-reposter/vk-reposter.service';
import {BaseService} from './services/base.service';
import {provideConfig} from './services/config/config.provider';

export class App {
  protected services: BaseService[] = [];

  protected get bot(): Telegraf {
    return container.resolve(Telegraf);
  }

  protected get logger(): LoggerService {
    return container.resolve(LoggerService);
  }

  constructor(
    //
    protected config: Config = provideConfig(process.env.ENVIRONMENT as any),
  ) {
    // Register config
    container.registerInstance(ConfigToken, config);

    // Init i18n
    i18next.init({lng: 'ru'}).then();
    i18next.addResourceBundle('ru', 'translation', translationsRU, true, true);
    container.registerInstance(TFunctionToken, i18next.t);

    // Create bot
    container.registerInstance(Telegraf, new Telegraf(config.botToken));

    // Create logger
    container.registerSingleton(LoggerService);

    // Register fetch
    container.registerInstance(FetchToken, fetch);

    // Register all services
    this.services.push(container.resolve(CommandsService));
    this.services.push(container.resolve(VkReposterService));
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
