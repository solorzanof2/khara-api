//@ts-nocheck

export class Dates {
  static readonly TIME_DELIMITER: string = 'T';

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
    const [date] = value.split(Dates.TIME_DELIMITER);
    return `${date}T00:00:00.000Z`;
  }

  static setLastHour(value: string): string {
    const [date] = value.split(Dates.TIME_DELIMITER);
    return `${date}T23:59:59.000Z`;
  }

  static nowToDatabaseDatetime(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const dateBuilder = [
      year, month, day,
    ];

    const timeBuilder = [
      hours, minutes, seconds,
    ];

    const datetimeBuilder = [
      `${dateBuilder.join('-')}`,
      `${timeBuilder.join(':')}`,
    ];

    return `${datetimeBuilder.join(' ')}`;
  }

  static nowToDatabaseDate(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const dateBuilder = [
      year, month, day,
    ];

    return `${dateBuilder.join('-')}`;
  }

  static toDMYDateTime(value: string | Date): string {
    if (!value) {
      return "";
    }

    const datetime = (new Date(value)).toISOString();
    const [date, time] = datetime.replace('.000Z', '').split(Dates.TIME_DELIMITER);
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${time}`;
  }

  static toUserDatetime(value: string | Date | number): string {
    if (!value) {
      return "";
    }

    const datetime = (new Date(value)).toISOString();
    const [date, time] = datetime.split('.')[0].split(Dates.TIME_DELIMITER);
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
    const [date, time] = datetime.split('.')[0].split(Dates.TIME_DELIMITER);
    const [hours, minutes, seconds] = time.split(':');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  static toDatabaseDatetime(): string {
    const datetime = (new Date()).toISOString();
    const [date, time] = datetime.split('.')[0].split(Dates.TIME_DELIMITER);
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
    const now = Dates.getPlainDate();
    return now > time;
  }

  static getPlainDate(): number {
    const date = new Date();
    const year = date.getFullYear();
    const month = Dates.normalize(date.getMonth() + 1);
    const day = Dates.normalize(date.getDate());

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

    const minusDays = Dates.holidaysCalculator(holidays);

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

  static getRangeByHours(start: string, end: string): number[] {
    const [dbStartHour, dbStartMinutes] = start.split(':');
    const [dbEndHour, dbEndMinutes] = end.split(':');

    // define la fecha actual;
    const now = new Date();
    const hours = now.getHours();

    let startTime = 0;
    let endTime = 0;

    const today = new Date();

    // si hora es menor a 11 (madrugada)
    if (hours <= +dbEndHour) {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(+dbStartHour, +dbStartMinutes, 0, 0);
      startTime = yesterday.getTime();

      today.setHours(+dbEndHour, +dbEndMinutes);
      endTime = today.getTime();

      return [startTime, endTime];
    }

    today.setHours(+dbStartHour, +dbStartMinutes);
    startTime = today.getTime();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(+dbEndHour, +dbEndMinutes, 0, 0);
    endTime = tomorrow.getTime();

    return [startTime, endTime];
  }

  static getBusinessDaysByHours(hourInitInput: string, hourEndInput: string): number[] {
    const [hourInit, minutesInit] = hourInitInput.split(':');
    const [hourEnd, minutesEnd] = hourEndInput.split(':');

    const now = new Date();
    const currentDay = now.getDay();

    // Definir las constantes para los días de la semana
    const Week = {
      Sunday: 0,
      Monday: 1,
      Friday: 5,
      Saturday: 6
    } as const;

    const getDay = (days: number, hours: number, minutes: number): number => {
      const day = new Date();
      day.setDate(now.getDate() + days);
      day.setHours(hours, minutes, 0, 0);
      return day.getTime();
    }

    const getRange = (init: number, end: number): number[] => [
      getDay(init, +hourInit, +minutesInit), getDay(end, +hourEnd, +minutesEnd)
    ];

    if (currentDay === Week.Sunday) {
      return getRange(-2, 1); // friday - monday
    }

    if (currentDay === Week.Saturday) {
      return getRange(-1, 2); // friday - monday
    }

    const currentHour = now.getHours();

    if (currentDay === Week.Friday) {
      // viernes menor a 10/11hs
      if (currentHour <= +hourEnd) {
        return getRange(-1, 0); // thursday - friday
      }

      return getRange(0, 3); // friday - monday
    }

    if (currentDay === Week.Monday) {
      if (currentHour <= +hourEnd) {
        return getRange(-3, 0); // friday - monday
      }

      // monday >= hourInit
      return getRange(0, 1); // monday - tuesday
    }

    // tuesday, wednesday, thursday < hourEnd
    if (currentHour <= +hourEnd) {
      return getRange(-1, 0);
    }

    // tuesday, wednesday, thursday
    return getRange(0, 1);
  };

  static getParkingBusinessDaysByHours(hourInitInput: string, hourEndInput: string, holidays: string[]): number[] {
    const [hourInit, minutesInit] = hourInitInput.split(':');
    const [hourEnd, minutesEnd] = hourEndInput.split(':');

    const now = new Date();
    const currentDay = now.getDay();

    // Definir las constantes para los días de la semana
    const Week = {
      Sunday: 0,
      Monday: 1,
      Friday: 5,
      Saturday: 6
    } as const;

    const getDay = (days: number, hours: number, minutes: number): number => {
      const day = new Date();
      day.setDate(now.getDate() + days);
      day.setHours(hours, minutes, 0, 0);
      return day.getTime();
    }

    const getRange = (init: number, end: number): number[] => [
      getDay(init, +hourInit, +minutesInit), getDay(end, +hourEnd, +minutesEnd)
    ];

    const minusDays = Dates.holidaysCalculator(holidays)

    return getRange(minusDays, 0);
  };

  static holidaysCalculator = (holidays: string[]) => {
    let now = new Date();
    now.setDate(now.getDate() - 1)
    let currentDate = Dates.normalizeDate(now);
    let currentDay = now.getDay();

    const Week = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }
    let accumulator = 1

    while (holidays.includes(currentDate) ||
      [Week.Saturday, Week.Sunday].includes(currentDay)) {
      accumulator++;
      let [day, month, year] = currentDate.split('/');
      now = new Date(year, month - 1, day);
      now.setDate(now.getDate() - 1);
      currentDate = Dates.normalizeDate(now)
      currentDay = now.getDay()
    }

    return accumulator * -1;
  }

  static nextBusinessDayCalculator = (holidays: string[]): Date => {
    let now = new Date();
    now.setDate(now.getDate() + 1)
    let currentDate = Dates.normalizeDate(now);
    let currentDay = now.getDay();

    const Week = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }

    while (holidays.includes(currentDate) ||
      [Week.Saturday, Week.Sunday].includes(currentDay)) {
      let [day, month, year] = currentDate.split('/');
      now = new Date(year, month - 1, day);
      now.setDate(now.getDate() + 1);
      currentDate = Dates.normalizeDate(now);
      currentDay = now.getDay();
    }

    now.setHours(0, 0, 0, 0);

    return now
  }

  static normalizeDate = (date: Date, addZero: boolean = true) => {

    if (!addZero) {
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${day}/${month}/${date.getFullYear()}`;
    }

    const month = Dates.normalize(date.getMonth() + 1);
    const day = Dates.normalize(date.getDate());

    return `${day}/${month}/${date.getFullYear()}`;
  }

  static getYMDStringToMilliseconds = (dateString: string) => {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // el mes en JS va de 0 a 11
    const day = parseInt(dateString.substring(6, 8), 10);

    const date = new Date(year, month, day);

    return date.getTime();
  }

  static getStringDateToNormalizedYMD = (dateString: string): string => {
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

}

export class EventDate {
  static readonly Now: number = Date.now();
  static readonly DayMillis: number = 24 * 60 * 60 * 1000;

  static addMinutes(value: number): Date {
    const minutes = value * 60 * 1000;
    return new Date(EventDate.Now + minutes);
  }

  static addDay(): Date {
    return new Date(EventDate.Now + EventDate.DayMillis);
  }

  static getOneDayExpirationMillis(): number {
    return EventDate.addDay().getTime();
  }

  static getMinutesMillis(value: number): number {
    return value * 60 * 1000;
  }
}

export class SimpleDate {
  private dayMillis = 86400000;
  private hourMillis = 3600000;

  current: Date;

  get millis(): number {
    return this.current.getTime();
  }

  get year(): number {
    return this.current.getFullYear();
  }

  get month(): number {
    return this.current.getMonth() + 1;
  }

  get normalMonth(): string {
    return (this.month < 10) ? `0${this.month}` : `${this.month}`;
  }

  get day(): number {
    return this.current.getDate();
  }

  get normalDay(): string {
    return (this.day < 10) ? `0${this.day}` : `${this.day}`;
  }

  constructor(millis: number = 0) {
    if (!millis) {
      this.current = new Date();
      return;
    }

    this.current = new Date(millis);
  }

  addDays(value: number): number {
    if (!value) return;
    return this.millis + (this.dayMillis * value);
  }

  addHours(value: number): number {
    if (!value) return;
    return this.millis + (this.hourMillis * value);
  }

  substractDays(value: number): number {
    if (!value) return;
    return this.millis - (this.dayMillis * value);
  }

  substractHours(value: number): number {
    if (!value) return;
    return this.millis - (this.hourMillis * value);
  }

  substractDaysToString(value: number): string {
    if (!value) return;
    // 2023-09-06T19:43:40.911Z
    const result = this.substractDays(15);
    const date = new Date(result);
    const year = date.getFullYear();
    const month = this.normalize(date.getMonth() + 1);
    const day = this.normalize(date.getDate());
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  firstDayOfCurrentWeek(): number {
    const current = new Date();
    const day = this.current.getDay();
    return (new Date(current.setDate((this.day - day) + 1))).getTime();
  }

  private normalize(value: number): string {
    return (value < 10) ? `0${value}` : `${value}`;
  }

  toString(): string {
    return `${this.year}-${this.normalMonth}-${this.normalDay}T00:00:00.000Z`;
  }

  getDateMillis(): string {
    const year = this.current.getFullYear();
    const month = this.current.getMonth() + 1;
    const day = this.current.getDate();

    const now = new Date(`${year}-${month}-${day}`);

    return now.getTime();
  }

}

