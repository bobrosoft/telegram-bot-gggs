import {TFunction} from 'i18next';
import {Telegraf, Context} from 'telegraf';
import {Message, Update, User} from 'telegraf/typings/core/types/typegram';
import {autoInjectable, inject} from 'tsyringe';
import {TFunctionToken} from '../../misc/injection-tokens';
import {BaseCommandService} from '../base-command.service';
import {LoggerService} from '../logger/logger.service';

@autoInjectable()
export class AntiSpamService extends BaseCommandService {
  protected name = 'AntiSpamService';
  protected members: MemberInfo[] = [];

  constructor(
    //
    protected logger: LoggerService,
    @inject(TFunctionToken) protected t: TFunction,
    protected bot: Telegraf,
  ) {
    super(logger, bot);

    this.bot.on('message', this.onNewMessage.bind(this));
    this.bot.on('edited_message', this.onEditMessage.bind(this));
  }

  async start(): Promise<void> {
    //
  }

  async stop(): Promise<void> {
    //
  }

  protected async banIfSpammer(ctx: Context<any>) {
    const user = ctx.message?.from;

    if (!user) {
      return;
    }

    if (await this.isSpammer(ctx, user)) {
      this.log(`ban ${user.username}(ID: ${user.id}) with banIfSpammer`);
      await ctx.banChatMember(user.id, undefined, {revoke_messages: true}).catch(e => console.error(e));
    }
  }

  protected async isAdmin(ctx: Context<any>, user: User): Promise<boolean> {
    const chatMember = await ctx.getChatMember(user.id);
    return (
      user.username === 'bobrosoft' ||
      (user.is_bot && user.username === 'GroupAnonymousBot') ||
      chatMember.status === 'administrator' ||
      chatMember.status === 'creator'
    );
  }

  protected async isSpammer(ctx: Context, user: User): Promise<boolean> {
    // Check if it in spammer list
    const member = this.findMember(user);
    console.log(member);

    return !!(
      member &&
      member.spamScore >= 2 &&
      member.spamScore >= member.messagesCount - member.spamMessagesCount && // check spam score
      true
    );
  }

  protected findMember(user: User): MemberInfo | undefined {
    return this.members.find(m => m.user.id === user.id);
  }

  protected updateMemberStats(user: User, spamScore: number) {
    const member = this.findMember(user);

    if (member) {
      member.messagesCount++;
      member.spamScore += spamScore;
      member.lastSpamMessageAt = spamScore ? Date.now() : member.lastSpamMessageAt;
      member.spamMessagesCount += spamScore ? 1 : 0;
    } else {
      this.members.push({
        user,
        createdAt: Date.now(),
        messagesCount: 1,
        lastSpamMessageAt: spamScore ? Date.now() : null,
        spamScore: spamScore,
        spamMessagesCount: spamScore ? 1 : 0,
      });
    }
  }

  protected isContainMaliciousSubstitutions(text: string): boolean {
    const words = text.split(/\s+/);
    if (
      words.find(word => {
        const ruMatches = [...word.toLowerCase().matchAll(/[а-я]/g)];
        const enMatches = [...word.toLowerCase().matchAll(/[a-z]/g)];

        // Check if word has a mix of RU and other chars
        if (ruMatches.length > 2 && enMatches.length > 1) {
          return true;
        }

        // Check if word has mix of RU and particular EN chars
        if (ruMatches.length > 2 && enMatches.find(match => match[0].match(/[aopecu]/))) {
          return true;
        }

        // Check if word has characters from "Greek and Coptic" Unicode block
        if (word.match(/[\u0370-\u03FF]/)) {
          return true;
        }
      })
    ) {
      return true;
    }

    return false;
  }

  protected async processNewMessage(message: Message, ctx: Context<Update.MessageUpdate<Message>>) {
    console.log('message', message);

    let spamScore = 0;
    let text = ((message as Message.TextMessage)?.text || '').toLowerCase().trim();

    if (this.isContainMaliciousSubstitutions(text)) {
      this.log('contains malicious chars substitutions');
      spamScore++;
    }

    // If bot repost
    if ((message as any).via_bot || (message as any).forward_from?.is_bot) {
      spamScore += 2;
    }

    // // Additional filtering
    text = text
      .replace('0', 'o') //
      .replace('o', 'о')
      .replace('a', 'а')
      .replace('p', 'р')
      .replace('c', 'с'); // to RUS "с"

    // Check if video with links attached or using formatting (unusual behavior)
    if ((message as any)?.caption_entities?.length || (message as any)?.entities?.length) {
      spamScore++;
      this.log(`matched caption_entities`);
    }

    // Check stop-words
    [
      //
      /@|http|httр|www/, // second is with RUS "р"
      /love|sex|секс|секас|попочку|интим|эроти|игривое/,
      /работ[аук].*cутк|работ[аук].*зп|работ[аук].*руб|работ[аук].*возраст|работ[аук].*\d+р|пла[чт].*\d+|на\s+карту|\d+\s+бакс|это\s+касается\s+каждого/,
      /рабоч|патент|оплата|денег|деньг|crypto|invest|зп|зарплат|заработн\.*плат|зарабат|заработать|город.*лс|заработк|заработо/,
      /нужны люди|национальноc/,
    ].forEach(regex => {
      if (text.match(regex)) {
        spamScore++;
        this.log(`matched ${regex}`);
      }
    });

    if (!message?.from) {
      return;
    }

    // A lot of spammers have premium accounts
    if (spamScore > 0) {
      if (message?.from.is_premium) {
        spamScore++;
      }
    }

    this.updateMemberStats(message?.from, spamScore);

    if (spamScore > 0) {
      // Check if admin
      if (await this.isAdmin(ctx, message?.from)) {
        return;
      }

      await (ctx as Context<any>).deleteMessage().catch();
      await this.banIfSpammer(ctx);
    }
  }

  protected async onNewMessage(ctx: Context<Update.MessageUpdate>) {
    return this.processNewMessage(ctx.message, ctx as any);
  }

  protected async onEditMessage(ctx: Context<Update.EditedMessageUpdate>) {
    return this.processNewMessage(ctx.editedMessage, ctx as any);
  }
}

interface MemberInfo {
  user: User;
  createdAt: number;
  messagesCount: number;
  lastSpamMessageAt: number | null;
  spamScore: number;
  spamMessagesCount: number;
}
