export abstract class BaseService {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
