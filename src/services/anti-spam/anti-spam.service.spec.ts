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
    return telegrafMock.triggerUpdate('new_chat_members', {
      new_chat_members: [
        {id: 1, username: 'test1'},
        {id: 2, username: 'test2'},
      ],
    } as Message.NewChatMembersMessage);
  }

  it('should ban spammer who used @mention', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'test @somespam',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who used restricted word', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'test invest into my stuff',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who used restricted word #2', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerUpdate('message', {
      text:
        'Pабoта зaклaдками в день 9-11к рублeй в недeлю 80к рублей \n' +
        'Бecплатное oбучение, oплачивaемая стaжиpoвкa ПИШИ',
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who used restricted word #3', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'Любая вакансия в любом городе РФ КЗ РБ УЗ КРГ ГРУЗИЯ МОНГОЛИЯ ЛДНР КРЫМ.ЗП 80000рубнеделя',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who used restricted word #4', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text:
          'Нужны разнорабочие, подходят как мужчины  так и женщины, высокая ЗП в день(оплата по факту сделанной работы\n' +
          'За подробностями пишите в Лс',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who used restricted word #5', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: `Требуются :
1. Водителя на личном легковом автомобиле , так же приветствуется арендованные авто 
Плачу 5500 рублей в день 
2. Разнорабочие 
Оплата 2800 рублей в день 
Все вопросы в ЛС`,
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who used restricted word #6', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: `Кто свободен сегодня, есть работа для всех 14+ и без патента, оплата от 3500 в день + проезд.`,
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who has premium account after single message', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerUpdate('message', {
      text: `Кто свободен сегодня, есть работа для всех 14+ и без патента, оплата от 3500 в день + проезд.`,
      from: {id: 1, username: 'test1', is_premium: true},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban spammer who used 2 suspicious thing in message', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerUpdate('message', {
      text: `Кто свободен сегодня, есть работа для всех 14+ и без патента, оплата от 3500 в день + проезд.`,
      caption_entities: [{}, {}],
      from: {id: 1, username: 'test1'},
    });

    expect(ctxMock.deleteMessage).toBeCalledTimes(1);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should NOT ban a user #1', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: `Работают на Свободе`,
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(0);
    expect(ctxMock.banChatMember).toBeCalledTimes(0);
  });

  it('should NOT ban a user #2', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    await telegrafMock.triggerUpdate('message', {
      text: `Работают на Свободе`,
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);
    await telegrafMock.triggerUpdate('message', {
      text: `что-то холодно стало`,
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);
    await telegrafMock.triggerUpdate('message', {
      text: `вот тут какая-то ссылка http`,
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);
    await telegrafMock.triggerUpdate('message', {
      text: `что-то холодно стало`,
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);
    await telegrafMock.triggerUpdate('message', {
      text: `вот тут какая-то ссылка http`,
      from: {id: 1, username: 'test1'},
    } as Message.TextMessage);

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(0);
  });

  it('should ban a member who used malicious chars substitutions', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'Злoнaмepенное испoльзовaние микса латинских и русских букв',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban a member who used malicious chars substitutions #2', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'Злонамеpенное использование микса латинских и русских букв',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should ban a member who used malicious chars substitutions #3', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'Зᴀпоʍиʜающиᴇся cʜиӎҝᴎ бoёɞыx cpaжeнᴎй',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it('should NOT ban a member who used just a mix of Eng and Ru words', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'Простое usage of русских и English слов',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(0);
    expect(ctxMock.banChatMember).toBeCalledTimes(0);
  });

  it('should NOT ban a member who used mix of words and Emojis', async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        text: 'Кто в ближайший час едет с\nГлазова в Ижевск нужно передать конверт🙏🙏🙏',
        from: {id: 1, username: 'test1'},
      } as Message.TextMessage);
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(0);
    expect(ctxMock.banChatMember).toBeCalledTimes(0);
  });

  it(`should ban spammer who used links in attachment's caption`, async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        from: {id: 1, username: 'test1'},
        text: 'test',
        caption_entities: [{}, {}],
      });
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });

  it(`should ban spammer who used formatting`, async () => {
    jest.spyOn(ctxMock, 'deleteMessage');
    jest.spyOn(ctxMock, 'banChatMember');

    await addNewChatMembers();

    for (let i = 0; i < 2; i++) {
      await telegrafMock.triggerUpdate('message', {
        from: {id: 1, username: 'test1'},
        text: 'test',
        entities: [{}, {}],
      });
    }

    expect(ctxMock.deleteMessage).toBeCalledTimes(2);
    expect(ctxMock.banChatMember).toBeCalledTimes(1);
  });
});
