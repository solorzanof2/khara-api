export class CUITHelper {
  static readonly NONE: string = 'none';
  static readonly EMPTY: string = 'empty';
  static readonly INVALID: string = 'invalid';
  static readonly INCOMPLETE: string = 'incomplete';
  static readonly VALID: string = 'valid';
  static readonly ALL: string = 'all';

  static readonly LENGTH: number = 11;

  static async resolve(value: string): Promise<string> {
    const length = value.length;
    let response = "";
    switch (true) {
      case (length == CUITHelper.LENGTH):
        response = (await CUITHelper.validate(value)) ? CUITHelper.VALID : CUITHelper.INVALID;
        break;
      case (length == 0):
        response = CUITHelper.EMPTY;
        break;
      case (length > 0 && length < CUITHelper.LENGTH):
        response = CUITHelper.INCOMPLETE;
        break;
    }
    return Promise.resolve(response);
  }

  static validate(cuit: string): boolean {
    // sanitiza el cuit
    cuit = cuit.replace(/\-|\./g, '');

    if (cuit.length !== 11) {
      return false;
    }

    let accumulated = 0;
    let digitsCollection = cuit.split("");
    let digit = `${digitsCollection.pop()}`;
    let cuitLength = digitsCollection.length;
    let currentDigit = 0;

    for (let index = 0; index < cuitLength; index++) {
      currentDigit = +digitsCollection[9 - index];
      accumulated += currentDigit * (2 + (index % 6));
    }

    let verificator = 11 - (accumulated % 11);
    if (verificator == 11) {
      verificator = 0;
    }

    if (verificator == 10) {
      verificator = 9;
    }

    return (+digit == verificator);
  }

  static format(value: string): string {
    const normalizedValue = value.replace(/\D/g, '');

    if (normalizedValue.length !== CUITHelper.LENGTH) {
      return value;
    }

    return `${normalizedValue.slice(0, 2)}-${normalizedValue.slice(2, 10)}-${normalizedValue.slice(10)}`;
  }

}