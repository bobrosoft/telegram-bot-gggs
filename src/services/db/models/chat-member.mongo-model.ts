import {Schema, model} from 'mongoose';

export interface ChatMember {
  userId: number;
  username?: string;
  createdAt: number;
  messagesCount: number;
  lastSpamMessageAt?: number;
  spamScore: number;
  spamMessagesCount: number;
}

const schema = new Schema<ChatMember>({
  userId: {type: Number, required: true},
  username: {type: String},
  createdAt: {type: Number, required: true},
  messagesCount: {type: Number, required: true},
  lastSpamMessageAt: {type: Number},
  spamScore: {type: Number, required: true},
  spamMessagesCount: {type: Number, required: true},
});

export const ChatMemberModel = model<ChatMember>('ChatMember', schema);
