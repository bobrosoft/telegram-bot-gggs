export class LoggerService {
  log(service: string, message: string) {
    console.log(`${new Date().toISOString().replace(/\.\d+Z$/, '')} [${service}] ${message}`);
  }
}
