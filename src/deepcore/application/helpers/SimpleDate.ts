//@ts-nocheck


export class SimpleDate {
  static readonly TIME_DELIMITER: string = 'T';

  static isValidYMDFormat(value: string = ''): boolean {
    if (!value) {
      return true;
    }

    return /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
  }

  static dateParse = function (data: Date): string {
    let [day, month, year] = data.toLocaleDateString().split('/');
    day = this.normalize(day);
    month = this.normalize(month);
    return `${day}/${month}/${year}`;
  }

  static normalize(value: number): string | number {
    return (value < 10) ? `0${value}` : `${value}`;
  }

  static setInitialHour(value: string): string {
    const [date] = value.split(SimpleDate.TIME_DELIMITER);
    return `${date}T00:00:00.000Z`;
  }

  static setLastHour(value: string): string {
    const [date] = value.split(SimpleDate.TIME_DELIMITER);
    return `${date}T23:59:59.000Z`;
  }

  static toDMYDateTime(value: string | Date): string {
    if (!value) {
      return "";
    }

    const datetime = (new Date(value)).toISOString();
    const [date, time] = datetime.replace('.000Z', '').split(SimpleDate.TIME_DELIMITER);
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${time}`;
  }

  static toUserDatetime(value: string | Date | number): string {
    if (!value) {
      return "";
    }

    const datetime = (new Date(value)).toISOString();
    const [date, time] = datetime.split('.')[0].split(SimpleDate.TIME_DELIMITER);
    const [hours, minutes, seconds] = time.split(':');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  static millisToLocalUserDatetime(value: number): string {
    if (!value) {
      return "";
    }

    const inputDate = new Date(value);

    const datetime = (new Date(inputDate.getTime() - (inputDate.getTimezoneOffset() * 60000))).toISOString();
    const [date, time] = datetime.split('.')[0].split(SimpleDate.TIME_DELIMITER);
    const [hours, minutes, seconds] = time.split(':');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  static toDatabaseDatetime(): string {
    const datetime = (new Date()).toISOString();
    const [date, time] = datetime.split('.')[0].split(SimpleDate.TIME_DELIMITER);
    const [hours, minutes, seconds] = time.split(':');
    const [year, month, day] = date.split('-');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Time is before now function
   * @param time
   * @return {boolean} true if time is expired
   */
  static timeIsBeforeNow(time: number): boolean {
    return Date.now() >= time;
  }

  static isValidTime(time: number): boolean {
    const now = SimpleDate.getPlainDate();
    return now > time;
  }

  static getPlainDate(): number {
    const date = new Date();
    const year = date.getFullYear();
    const month = SimpleDate.normalize(date.getMonth() + 1);
    const day = SimpleDate.normalize(date.getDate());

    const ymd = `${year}-${month}-${day}`;

    return new Date(ymd).getTime();
  }

  static getNowAndYesterdayFirstHour(holidays: string[]): number[] {
    const now = new Date();
    const lastDay = new Date();

    const currentDay = now.getDay();

    // Definir las constantes para los días de la semana
    const Week = {
      Monday: 1,
    };

    const minusDays = SimpleDate.holidaysCalculator(holidays);

    lastDay.setDate(now.getDate() + minusDays);

    now.setHours(0, 0, 0, 0);
    lastDay.setHours(0, 0, 0, 0);

    return [lastDay.getTime(), now.getTime()];
  }

  static getNowByHourAndYesterdayByHour(toHour: number, toMinutes: number, fromHour: number, fromMinutes: number): number[] {
    const now = new Date();
    const lastDay = new Date();
    lastDay.setDate(now.getDate() - 1);

    now.setHours(toHour, toMinutes, 0, 0);
    lastDay.setHours(fromHour, fromMinutes, 0, 0);

    return [lastDay.getTime(), now.getTime()];
  }

  static normalizeDate(date: Date, addZero: boolean = true): string {

    if(!addZero) {
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${day}/${month}/${date.getFullYear()}`;
    }

    const month = SimpleDate.normalize(date.getMonth() + 1);
    const day = SimpleDate.normalize(date.getDate());

    return `${day}/${month}/${date.getFullYear()}`;
  }

  static getYMDStringToMilliseconds(dateString: string): number {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // el mes en JS va de 0 a 11
    const day = parseInt(dateString.substring(6, 8), 10);

    const date = new Date(year, month, day);

    return date.getTime();
  }

  static getStringDateToNormalizedYMD(dateString: string): string {
    const [year, month, day] = dateString.split('-');

    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  static timezoneToMillis(value: string): number {
    const [
      date, timezone
    ] = value.split('T');

    const [
      time, _zone
    ] = timezone.split('+');

    const [
      cleanTime, millis
    ] = time.split('.');

    return (new Date(`${date} ${cleanTime}`)).getTime();
  }

  static getNowShortDateYMDFormat(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  static dateYMDToLocalMillis(value: string = ''): number {
    if (!value) {
      return 0;
    }

    const inputDate = new Date(`${value} 00:00:00.000`);

    return (new Date(inputDate.getTime() - (inputDate.getTimezoneOffset() * 60000))).getTime();
  }

  static millisecondsToYMD(milliseconds: number): string {
    const date = new Date(milliseconds);
    return date.toISOString().split('T')[0];
  }

  static nowTimezoneToMillis(): number {
    const now = new Date();

    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    const hours = `${now.getHours()}`.padStart(2, '0');
    const minutes = `${now.getMinutes()}`.padStart(2, '0');
    const seconds = `${now.getSeconds()}`.padStart(2, '0');

    const date = new Date(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`);

    return (new Date(date.getTime() - date.getTimezoneOffset() * 60000)).getTime();
  }

  static todayTimezoneToMillis(): number {
    const now = new Date();

    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    const hours = '00';
    const minutes = '00';
    const seconds = '00';

    const date = new Date(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`);

    return (new Date(date.getTime() - date.getTimezoneOffset() * 60000)).getTime();
  }

  static toShortDateString(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  static getCurrentMonthStartToNow(): number[] {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    const startTime = new Date(`${year}-${month}-01 00:00:00`).getTime();
    const endTime = new Date(`${year}-${month}-${day} 00:00:00`).getTime();

    return [startTime, endTime];
  }

}