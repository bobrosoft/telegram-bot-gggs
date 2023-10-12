import {Context} from 'telegraf';
import {ChatMember} from 'telegraf/typings/core/types/typegram';
import {ContextWithMatch} from '../models/context-with-match.model';

export class TelegrafContextMock {
  match?: {groups?: {command?: string; params?: string}};
  message?: any;

  async replyWithHTML(html: string) {
    // noop
  }

  async getChatMember(userId: number): Promise<ChatMember> {
    return {} as any;
  }

  async deleteMessage(messageId?: number): Promise<true> {
    return true;
  }

  async banChatMember(userId: number, untilDate?: number | undefined, extra?: any): Promise<true> {
    return true;
  }
}

export class TelegrafMock {
  protected onListeners: Array<{updateType: string; callback: (ctx: Context & any) => Promise<void>}> = [];
  protected commandListeners: Array<{command: string; callback: (ctx: Context) => Promise<void>}> = [];
  protected hearsListeners: Array<{matcher: RegExp; callback: (ctx: ContextWithMatch) => Promise<void>}> = [];

  constructor(public ctxMock: TelegrafContextMock) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  start(callback: (ctx: Context) => Promise<void>) {}

  on(updateType: string, callback: (ctx: Context) => Promise<void>) {
    this.onListeners.push({updateType, callback});
  }

  command(command: string, callback: (ctx: Context) => Promise<void>) {
    this.commandListeners.push({command, callback});
  }

  hears(matcher: RegExp, callback: (ctx: ContextWithMatch) => Promise<void>) {
    this.hearsListeners.push({matcher, callback});
  }

  triggerUpdate(updateType: string, messageData?: any): Promise<void[]> {
    this.ctxMock.message = messageData;

    return Promise.all(
      this.onListeners
        //
        .filter(cl => cl.updateType === updateType)
        .map(cl => Promise.resolve(cl.callback(this.ctxMock))),
    );
  }

  triggerCommand(command: string): Promise<void[]> {
    return Promise.all(
      this.commandListeners
        //
        .filter(cl => cl.command === command)
        .map(cl => Promise.resolve(cl.callback(this.ctxMock as any))),
    );
  }

  triggerHears(text: string): Promise<void[]> {
    return Promise.all(
      this.hearsListeners
        //
        .filter(cl => cl.matcher.test(text))
        .map(cl => {
          this.ctxMock.match = cl.matcher.exec(text) as any;
          return Promise.resolve(cl.callback(this.ctxMock as any));
        }),
    );
  }
}
