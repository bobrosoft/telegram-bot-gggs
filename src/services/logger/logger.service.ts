export class LoggerService {
  log(service: string, message: string) {
    console.log(
      `${new Date()
        //
        .toLocaleString('ru-RU', {timeZone: 'Europe/Samara'})
        .replace(/,\s/g, ' ')} [${service}] ${message}`,
    );
  }
}
