import {autoInjectable} from 'tsyringe';
import {BaseService} from '../base.service';
import {connect, HydratedDocument, Mongoose} from 'mongoose';
import {LoggerService} from '../logger/logger.service';
import {ChatMember, ChatMemberModel} from './models/chat-member.mongo-model';

@autoInjectable()
export class DbService extends BaseService {
  protected name = 'DbService';
  protected db!: Mongoose;

  constructor(
    //
    protected logger: LoggerService,
  ) {
    super(logger);
  }

  async start(): Promise<void> {
    try {
      this.db = await connect('');
    } catch (e) {
      this.log(String(e));
      throw e;
    }
  }

  async stop(): Promise<void> {
    await this.db.disconnect();
  }

  async getMemberById(id: number): Promise<HydratedDocument<ChatMember> | null> {
    const member = await ChatMemberModel.findOne({id});
    // member.toObject();

    return member;
  }
}
