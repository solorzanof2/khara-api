import { HttpStatus } from '../http/HttpContracts';


export class Exception extends Error {
  code: HttpStatus;
  log = "";

  constructor(message: string, code: HttpStatus = HttpStatus.Conflict, log: string = "") {
    super(message);
    this.log = log;
    this.code = code;
  }

  setLogMessage(value: string = ""): void {
    this.log = value;
  }

  setCode(value: HttpStatus = HttpStatus.Conflict): void {
    this.code = value;
  }
}

