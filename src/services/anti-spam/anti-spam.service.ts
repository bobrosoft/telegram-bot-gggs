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
  protected newMemberTimeLimit: number = 7 * 86400 * 1000;
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
    console.log(`banIfNewMember`);
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
    console.log(`isNewMember`);

    // Check if admin
    const chatMember = await ctx.getChatMember(user.id);
    console.log(`chatMember`, chatMember);
    if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
      return false;
    }

    // Check if it is a new member
    const newMember = this.findNewMember(user);
    console.log('user', user);
    console.log('this.recentlyAddedMembers', this.recentlyAddedMembers);
    console.log(`newMember`, newMember);

    return !!(
      newMember &&
      Date.now() - newMember.joinTimestamp < this.newMemberTimeLimit && // check when joined
      newMember.messagesCount <= 2 && // check messages count
      true
    );
  }

  protected findNewMember(user: User): MemberInfo | undefined {
    return this.recentlyAddedMembers.find(m => m.user.id === user.id);
  }

  protected isContainMaliciousSubstitutions(text: string): boolean {
    const words = text.split(/\s+/);
    if (
      words.find(word => {
        const ruMatches = [...word.toLowerCase().matchAll(/[а-я]/g)];
        const enMatches = [...word.toLowerCase().matchAll(/[a-z]/g)];

        // Check if word has a mix of RU and other chars
        if (ruMatches.length > 2 && word.length - ruMatches.length > 2) {
          return true;
        }

        // Check if word has mix of RU and particular EN chars
        if (ruMatches.length > 2 && enMatches.find(match => match[0].match(/[aopecu]/))) {
          return true;
        }
      })
    ) {
      return true;
    }

    return false;
  }

  protected async onNewChatMembersJoin(ctx: Context<Update.MessageUpdate<Message.NewChatMembersMessage>>) {
    console.log('onNewChatMembersJoin', ctx);
    console.log('ctx.message', ctx.message);
    console.log('ctx.message.new_chat_member', (ctx.message as any)?.new_chat_member);
    console.log('ctx.message.new_chat_members', (ctx.message as any)?.new_chat_members);
    
    ctx.message?.new_chat_members.forEach(user => {
      this.recentlyAddedMembers.push({
        user,
        joinTimestamp: Date.now(),
        messagesCount: 0,
      });
    });

    console.log('this.recentlyAddedMembers', this.recentlyAddedMembers);
    this.recentlyAddedMembers.slice(-100);
    console.log('this.recentlyAddedMembers after slice', this.recentlyAddedMembers);
  }

  protected async onNewMessage(ctx: Context<Update.MessageUpdate<Message>>) {
    console.log('ctx.message', ctx.message);
    console.log('ctx.message?.from', ctx.message?.from);

    // Increase message counter
    const newMember = ctx.message?.from && this.findNewMember(ctx.message?.from);
    if (newMember) {
      newMember.messagesCount++;
    }

    let isLookLikeSpam = false;
    let text = ((ctx.message as Message.TextMessage)?.text || '').toLowerCase().trim();

    if (this.isContainMaliciousSubstitutions(text)) {
      this.log('contains malicious chars substitutions');
      isLookLikeSpam = true;
    }

    // Additional filtering
    text = text
      .replace('0', 'o') //
      .replace('o', 'о')
      .replace('a', 'а')
      .replace('p', 'р')
      .replace('c', 'с'); // to RUS "с"

    // Check if video with links attached or using formatting (unusual behavior)
    if ((ctx.message as any)?.caption_entities?.length || (ctx.message as any)?.entities?.length) {
      isLookLikeSpam = true;
      this.log(`matched caption_entities`);
    }

    // Check stop-words
    [
      //
      /@|http|www/,
      /love|sex|секс|секас|попочку|интим|эроти/,
      /работ[аук]|рабоч|оплата|денег|деньги|crypto|invest|зп\s/,
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
  user: User;
  joinTimestamp: number;
  messagesCount: number;
}
