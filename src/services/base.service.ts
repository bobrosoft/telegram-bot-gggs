import {LoggerService} from './logger/logger.service';

export abstract class BaseService {
  protected abstract name: string;

  protected constructor(protected logger: LoggerService) {}

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  protected log(...data: any[]) {
    this.logger.log(this.name, ...data);
  }

  protected logError(...data: any[]) {
    this.logger.error(this.name, ...data);
  }
}
