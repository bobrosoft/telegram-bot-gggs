import {Telegraf} from 'telegraf';
import {container} from 'tsyringe';
import {Message} from 'typegram/message';
import {TFunctionToken} from '../../misc/injection-tokens';
import {TelegrafContextMock, TelegrafMock} from '../../misc/telegraf-mocks';
import {LoggerService} from '../logger/logger.service';
import {LoggerServiceMock} from '../logger/logger.service.mock';
import {AntiSpamService} from './anti-spam.service';

describe('AntiSpamService', () => {
  let ctxMock: TelegrafContextMock;
  let telegrafMock: TelegrafMock;
  let antiSpamService: AntiSpamService;

  beforeEach(() => {
    container.clearInstances();

    container.registerInstance(TFunctionToken, (key, options?: any) => {
      switch (key) {
        default:
          return '';
      }
    });

    container.registerInstance(LoggerService, new LoggerServiceMock());

    ctxMock = new TelegrafContextMock();
    telegrafMock = new TelegrafMock(ctxMock);
    container.registerInstance(Telegraf, telegrafMock as any);

    antiSpamService = container.resolve(AntiSpamService);
  });

  function addNewChatMembers(): Promise<void[]> {
    return telegrafMock.triggerOn('new_chat_members', {
      new_chat_members: [
        {id: 1, username: 'test1'},
        {id: 2, username: 'test2'},
      ],
    } as Message.NewChatMembersMessage);
  }

  it('should remember new members', async () => {
    await addNewChatMembers();

    expect((antiSpamService as any).recentlyAddedMembers.length).toBe(2);
  });

  it('should ban new member who used @mention', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      text: 'test @somespam',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban new member who used @mention but keep old ones', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000);

    await addNewChatMembers();

    jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000 + 8 * 86400 * 1000);

    await telegrafMock.triggerOn('new_chat_members', {
      new_chat_members: [
        {id: 3, username: 'test3'},
        {id: 4, username: 'test4'},
      ],
    } as Message.NewChatMembersMessage);

    expect((antiSpamService as any).recentlyAddedMembers.length).toBe(4);

    await telegrafMock.triggerOn('message', {
      text: 'test @somespam',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(0);
    expect(ctxMock.banChatMember).toBeCalledTimes(0);

    await telegrafMock.triggerOn('message', {
      text: 'test @somespam',
      from: {id: 3, username: 'test3'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should not ban new member if he already sent several non-spam messages', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      text: 'test',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    await telegrafMock.triggerOn('message', {
      text: 'test2',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    await telegrafMock.triggerOn('message', {
      text: 'test @somespam',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(0);
    expect(ctxMock.banChatMember).toBeCalledTimes(0);
  });

  it('should ban new member who used restricted word', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      text: 'test invest into my stuff',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban new member who used restricted word #2', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      text:
        'Pабoта зaклaдками в день 9-11к рублeй в недeлю 80к рублей \n' +
        'Бecплатное oбучение, oплачивaемая стaжиpoвкa ПИШИ',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban a member who used malicious chars substitutions', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      text: 'Злoнaмepенное испoльзовaние микса латинских и русских букв',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban a member who used malicious chars substitutions #2', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      text: 'Злонамеpенное использование микса латинских и русских букв',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should NOT ban a member who used just a mix of Eng and Ru words', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      text: 'Простое usage of русских и English слов',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(0);
    expect(ctxMock.banChatMember).toBeCalledTimes(0);
  });

  it(`should ban new member who used links in attachment's caption`, async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      from: {id: 1, username: 'test1'},
      text: 'test',
      caption_entities: [{}, {}],
    });

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it(`should ban new member who used formatting`, async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerOn('message', {
      from: {id: 1, username: 'test1'},
      text: 'test',
      entities: [{}, {}],
    });

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });
});
