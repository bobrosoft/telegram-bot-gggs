import {TFunction} from 'i18next';
import fetch, {FetchError} from 'node-fetch';
import {Telegraf} from 'telegraf';
import {autoInjectable, inject} from 'tsyringe';
import {URLSearchParams} from 'url';
import {ConfigToken, TFunctionToken} from '../../misc/injection-tokens';
import {Config} from '../../models/config.model';
import {VKAttachment, VkPost} from '../../models/vk-post.model';
import {BaseCommandService} from '../base-command.service';
import {LoggerService} from '../logger/logger.service';
import testData from './testData.json';
import {commonStopWords, groupStopWords, userStopWords} from './stop-words';

@autoInjectable()
export class VkReposterService extends BaseCommandService {
  protected name = 'VkReposterService';
  protected timer?: NodeJS.Timeout;
  protected accessToken: string;
  protected recentPostIds: number[] = [];

  constructor(
    //
    protected logger: LoggerService,
    @inject(TFunctionToken) protected t: TFunction,
    @inject(ConfigToken) protected config: Config,
    protected bot: Telegraf,
  ) {
    super(logger, bot);

    this.accessToken = this.config.vkAccessToken;
  }

  async start(): Promise<void> {
    this.checkForNewPosts(true).then();
    this.timer = setInterval(() => {
      this.checkForNewPosts().then();
    }, 5 * 60 * 1000);

    this.listenForCommand(['testrepost'], this.onTestRepost.bind(this));
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  protected async checkForNewPosts(isFirstRun = false) {
    this.log('checkForNewPosts');

    try {
      const data = await fetch('https://api.vk.com/method/wall.get', {
        method: 'POST',
        body: this.buildBody({
          owner_id: this.config.vkGroupsToCheck[0],
          extended: 1,
          count: 3,
        }),
      }).then(r => r.json());

      // Need to fill in recentPostIds for the first run to not post them after bot restart
      if (isFirstRun) {
        (data.response.items as VkPost[]).forEach(post => this.recentPostIds.push(post.id));
      }

      await this.processPostsData(data);
    } catch (e) {
      this.logFetchError(e as any);
    }
  }

  protected buildBody(payload: {[key: string]: any}): URLSearchParams {
    return new URLSearchParams({
      access_token: this.accessToken,
      v: '5.131',
      ...payload,
    });
  }

  protected async processPostsData(data: any, skipOldPosts = true) {
    const posts: VkPost[] = data.response.items.reverse() as any;

    const authors: Author[] = [
      ...(data.response.profiles || []).map((p: any) => ({
        id: p.id,
        name: (p.first_name + ' ' + p.last_name).trim(),
        isGroup: false,
      })),
      ...(data.response.groups || []).map((g: any) => ({
        id: -g.id,
        name: g.name,
        isGroup: true,
      })),
    ];

    const messages = posts
      .filter(post => (skipOldPosts ? this.isNewPost(post) : true))
      .filter(post => this.isPostAllowed(post))
      .map(post => this.convertPostToMessage(post, authors));

    for (const message of messages) {
      this.log(`Posting new message "${message.debugText}" (ID: ${message.postId})`);

      for (const chatId of this.config.chatsForVkReposts) {
        if (message.imageUrls?.length) {
          if (message.imageUrls?.length === 1) {
            await this.bot.telegram.sendPhoto(chatId, message.imageUrls[0], {
              caption: message.text.substr(0, 1010),
              parse_mode: 'HTML',
            });
          } else {
            await this.bot.telegram.sendMediaGroup(
              chatId,
              message.imageUrls.map((imageUrl, index) => ({
                type: 'photo',
                media: {url: imageUrl},
                caption: index === 0 ? message.text.substr(0, 1010) : undefined,
                parse_mode: index === 0 ? 'HTML' : undefined,
              })),
            );
          }
        } else {
          await this.bot.telegram.sendMessage(chatId, message.text.substr(0, 4000), {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
        }
      }

      this.recentPostIds.push(message.postId);
      this.recentPostIds.slice(-10);
    }
  }

  protected isNewPost(post: VkPost): boolean {
    return !this.recentPostIds.includes(post.id);
  }

  protected isPostAllowed(post: VkPost): boolean {
    const isGroupPost = post.from_id < 0;

    // Skip ads
    if (post.marked_as_ads) {
      return false;
    }

    // Skip reposts
    if (post.copy_history) {
      return false;
    }

    // Check for group stop-words
    const preparedPostText = post.text.toLocaleLowerCase('ru-RU').trim();
    if (commonStopWords.find(word => preparedPostText.match(word))) {
      return false;
    }

    // Check if that's a group post to apply special rules
    if (isGroupPost) {
      // Skip group posts without text
      if (preparedPostText === '') {
        return false;
      }

      // Check for group stop-words
      if (groupStopWords.find(word => preparedPostText.match(word))) {
        return false;
      }
    } else {
      if (userStopWords.find(word => preparedPostText.match(word))) {
        return false;
      }
    }

    return true;
  }

  protected convertPostToMessage(post: VkPost, authors: Author[]): Message {
    const author = authors.find(a => a.id === post.from_id) || authors.find(a => a.id === post.owner_id);
    const attachments: VKAttachment[] = (post.attachments || []).filter(a =>
      ['photo', 'video', 'doc'].includes(a.type),
    );
    const videoAttachment: VKAttachment | undefined = (post.attachments || []).find(a => a.type === 'video');

    let text = this.t('VkReposterService.messageBody', {
      author: author ? author.name : '',
      url: `https://vk.com/wall${post.owner_id}_${post.id}`,
      text: post.text,
    }).trim();

    if (videoAttachment?.type === 'video') {
      text += this.t('VkReposterService.messageVideo', {
        url: `https://vk.com/club${Math.abs(post.owner_id)}?z=video${post.owner_id}_${videoAttachment.video.id}`,
      });
    }

    const photoUrls: string[] = attachments
      .map(attachment => {
        let result: string | undefined;

        if (attachment?.type === 'photo') {
          result = attachment.photo.sizes[attachment.photo.sizes.length - 1].url;
        } else if (attachment?.type === 'video') {
          result = attachment.video.image[attachment.video.image.length - 1].url;

          if (result.match('thumbs/video_x.png')) {
            result = undefined;
          }
        } else if (attachment?.type === 'doc') {
          result = attachment.doc.preview.photo?.sizes.find(s => ['x', 'y', 'z'].includes(s.type))?.src;
        }

        return result || '';
      })
      .filter(a => !!a); // remove empty

    return {
      postId: post.id,
      text,
      debugText: post.text.substr(0, 20).replace(/[\n\t]/g, ''),
      imageUrls: photoUrls,
    };
  }

  protected async onTestRepost() {
    await this.processPostsData(testData, false);
  }

  protected logFetchError(e: FetchError) {
    this.log(`Error: status ${(e as FetchError).code}. ` + (e as FetchError).message);
  }
}

interface Author {
  id: number;
  name: string;
  isGroup: boolean;
}

interface Message {
  postId: number;
  text: string;
  debugText: string;
  imageUrls: string[];
}
