import {TFunction} from 'i18next';
import {Telegraf, Context} from 'telegraf';
import {Message} from 'telegraf/typings/core/types/typegram';
import {autoInjectable, inject} from 'tsyringe';
import {User} from 'typegram';
import {TFunctionToken} from '../../misc/injection-tokens';
import {BaseCommandService} from '../base-command.service';
import {LoggerService} from '../logger/logger.service';

@autoInjectable()
export class AntiSpamService extends BaseCommandService {
  protected name = 'AntiSpamService';
  protected newMemberTimeLimit: number = 2 * 86400 * 1000;
  protected recentlyAddedMembers: MemberInfo[] = [];

  constructor(
    //
    protected logger: LoggerService,
    @inject(TFunctionToken) protected t: TFunction,
    protected bot: Telegraf,
  ) {
    super(logger, bot);

    this.bot.on('new_chat_members', async ctx => {
      await this.onNewChatMembersJoin(ctx, ctx.message?.new_chat_members);
    });

    this.bot.on('message', async ctx => {
      await this.onNewMessage(ctx);
    });

    this.bot.on('edited_message', async ctx => {
      await this.onNewMessage(ctx);
    });
  }

  async start(): Promise<void> {
    //
  }

  async stop(): Promise<void> {
    //
  }

  protected async banIfNewMember(ctx: Context) {
    const user = ctx.message?.from;

    if (!user) {
      return;
    }

    if (await this.isNewMember(ctx, user)) {
      this.log(`ban ${user.username}(ID: ${user.id}) with banIfNewMember`);
      await ctx.deleteMessage();
      await ctx.banChatMember(user.id, undefined, {revoke_messages: true});
    }
  }

  protected async isNewMember(ctx: Context, user: User): Promise<boolean> {
    // Check if admin
    const chatMember = await ctx.getChatMember(user.id);
    if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
      return false;
    }

    // Check if it is a new member
    return !!this.recentlyAddedMembers.find(
      m => m.user.id === user.id && Date.now() - m.joinTimestamp < this.newMemberTimeLimit,
    );
  }

  protected async onNewChatMembersJoin(ctx: Context, newChatMembers: User[]) {
    newChatMembers.forEach(user => {
      this.recentlyAddedMembers.push({
        joinTimestamp: Date.now(),
        user,
      });
    });

    this.recentlyAddedMembers.slice(-100);
  }

  protected async onNewMessage(ctx: Context) {
    const text = ((ctx.message as Message.TextMessage)?.text || '').toLowerCase().trim().replace('0', 'o');

    [
      //
      /@|http|www/,
      /pаботa|денег|деньги|crypto|invest/,
    ].forEach(regex => {
      if (text.match(regex)) {
        this.log(`matched ${regex}`);
        this.banIfNewMember(ctx).then();
      }
    });
  }
}

interface MemberInfo {
  joinTimestamp: number;
  user: User;
}
