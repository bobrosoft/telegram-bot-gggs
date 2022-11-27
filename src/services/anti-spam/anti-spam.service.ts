import {TFunction} from 'i18next';
import {Telegraf, Context} from 'telegraf';
import {Message, Update} from 'telegraf/typings/core/types/typegram';
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

    this.bot.on('new_chat_members', this.onNewChatMembersJoin.bind(this));
    this.bot.on('message', this.onNewMessage.bind(this));
    this.bot.on('edited_message', this.onEditMessage.bind(this));
  }

  async start(): Promise<void> {
    //
  }

  async stop(): Promise<void> {
    //
  }

  protected async banIfNewMember(ctx: Context<any>) {
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
    const newMember = this.findNewMember(user);
    return !!(newMember && Date.now() - newMember.joinTimestamp < this.newMemberTimeLimit);
  }

  protected findNewMember(user: User): MemberInfo | undefined {
    return this.recentlyAddedMembers.find(m => m.user.id === user.id);
  }

  protected async onNewChatMembersJoin(ctx: Context<Update.MessageUpdate<Message.NewChatMembersMessage>>) {
    ctx.message?.new_chat_members.forEach(user => {
      this.recentlyAddedMembers.push({
        joinTimestamp: Date.now(),
        user,
      });
    });

    this.recentlyAddedMembers.slice(-100);
  }

  protected async onNewMessage(ctx: Context<Update.MessageUpdate<Message>>) {
    console.log('ctx.message', ctx.message);
    console.log('ctx.message?.from', ctx.message?.from);

    let isLookLikeSpam = false;

    const text = ((ctx.message as Message.TextMessage)?.text || '')
      .toLowerCase()
      .trim()
      .replace('0', 'o')
      .replace('c', 'с'); // to RUS "с"

    // Check if video with links attached (unusual behavior)
    if ((ctx.message as any)?.caption_entities?.length) {
      isLookLikeSpam = true;
      this.log(`matched caption_entities`);
    }

    // Check stop-words
    [
      //
      /@|http|www/,
      /love|sex|секс|секас|попочку|интим|эроти/,
      /pабот[aук]|денег|деньги|crypto|invest/,
    ].forEach(regex => {
      if (text.match(regex)) {
        isLookLikeSpam = true;
        this.log(`matched ${regex}`);
      }
    });

    if (isLookLikeSpam) {
      await this.banIfNewMember(ctx);
    }
  }

  protected async onEditMessage(ctx: Context<Update.EditedMessageUpdate>) {
    return this.onNewMessage(ctx as any);
  }
}

interface MemberInfo {
  joinTimestamp: number;
  user: User;
}
