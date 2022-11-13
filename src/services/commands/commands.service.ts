import {TFunction} from 'i18next';
import {Telegraf, Context} from 'telegraf';
import {autoInjectable, inject} from 'tsyringe';
import {ConfigToken, TFunctionToken} from '../../misc/injection-tokens';
import {Config} from '../../models/config.model';
import {BaseCommandService} from '../base-command.service';
import {LoggerService} from '../logger/logger.service';

@autoInjectable()
export class CommandsService extends BaseCommandService {
  protected name = 'CommandsService';

  constructor(
    //
    protected logger: LoggerService,
    @inject(TFunctionToken) protected t: TFunction,
    @inject(ConfigToken) protected config: Config,
    protected bot: Telegraf,
  ) {
    super(logger, bot);
    this.listenForCommand(['start'], this.onStart.bind(this));
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
