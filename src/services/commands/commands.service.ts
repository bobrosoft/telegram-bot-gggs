import {TFunction} from 'i18next';
import {Telegraf, Context} from 'telegraf';
import {Config} from '../../models/config.model';
import {BaseService} from '../common.service';
import {LoggerService} from '../logger/logger.service';

export class CommandsService extends BaseService {
  protected name = 'CommandsService';

  constructor(
    //
    protected logger: LoggerService,
    protected t: TFunction,
    protected config: Config,
    protected bot: Telegraf,
  ) {
    super(logger);
    this.bot.command('start', this.onStart.bind(this));
  }

  async start(): Promise<void> {
    //
  }

  async stop(): Promise<void> {
    //
  }

  protected async onStart(ctx: Context) {
    console.log(`chatId: ${ctx.chat?.id}`);
    await ctx.replyWithHTML(this.t('CommandsService.startMsg', {link: this.config.chatLink}));
  }
}
