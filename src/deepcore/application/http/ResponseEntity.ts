import { Exception } from '../core/Exception';
import { ApiProxyResult, AppResponse, HttpCodes, HttpStatus, ResponseHeader } from './HttpContracts';


const DefaultError = 'No se pudo completar la solicitud, por favor intenta más tarde.';


export class ResponseEntity {

  private static response(payload: any, statusCode: number, headers: ResponseHeader, log: string = ''): Promise<ApiProxyResult> {
    if (log) console.log(`[ERR0] API > ${log}`);
    return Promise.resolve(new ApiProxyResult(payload, statusCode, headers));
  }

  public static ok(payload: any = {}, headers: ResponseHeader = {}): Promise<ApiProxyResult> {
    return ResponseEntity.response(payload, HttpStatus.Ok, headers);
  }

  public static created(payload: any = {}, headers: ResponseHeader = {}): Promise<ApiProxyResult> {
    return ResponseEntity.response(payload, HttpStatus.Created, headers);
  }

  public static accepted(message: any = {}, log: string = ''): Promise<ApiProxyResult> {
    return ResponseEntity.response(message, HttpStatus.Accepted, {}, log);
  }

  public static noContent(): Promise<ApiProxyResult> {
    return ResponseEntity.response(null, HttpStatus.NoContent, {});
  }

  public static conflict(message: any = {}, log: string = ''): Promise<ApiProxyResult> {
    return ResponseEntity.response(message, HttpStatus.Conflict, {}, log);
  }

  public static badRequest(log: string = ''): Promise<ApiProxyResult> {
    return ResponseEntity.response(HttpCodes[400], HttpStatus.BadRequest, {}, log);
  }

  public static notFound(log: string = ''): Promise<ApiProxyResult> {
    return ResponseEntity.response(HttpCodes[404], HttpStatus.NotFound, {}, log);
  }

  public static forbidden(log: string = ''): Promise<ApiProxyResult> {
    return ResponseEntity.response(HttpCodes[403], HttpStatus.Forbidden, {}, log);
  }

  public static unauthorized(log: string = ''): Promise<ApiProxyResult> {
    return ResponseEntity.response(HttpCodes[401], HttpStatus.Unauthorized, {}, log);
  }

  public static serverError(message: any = {}, log: string = ''): Promise<ApiProxyResult> {
    return ResponseEntity.response(message, HttpStatus.ServerError, {}, log);
  }

  public static error(error: Exception | Error): Promise<ApiProxyResult> {
    if (error instanceof Exception) {
      const exception = <Exception>error;
      return ResponseEntity.response(exception.message, exception.code, {}, exception.log);
    }

    // return ResponseEntity.serverError(error.message, error.message);
    return ResponseEntity.serverError(DefaultError, error.message);
  }

}

export class CallbackResponse {

  private static mapHeaders(headers: ResponseHeader): ResponseHeader {
    const merge = {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': `${process.env.APP_HTTP_ORIGIN}`,
      'Content-Type': 'application/json',
      ...headers,
    };
    return merge;
  }

  private static mapAPIResponse(status: number, data?: any): AppResponse {
    const body = { status } as AppResponse;
    if (data) {
      body.payload = data;
    }
    return body;
  }

  private static mapResponse(body: any, headers: ResponseHeader, statusCode: HttpStatus = HttpStatus.Ok): ApiProxyResult {
    return {
      statusCode: HttpStatus.Ok,
      headers: CallbackResponse.mapHeaders(headers),
      body: CallbackResponse.mapAPIResponse(statusCode, body),
    } as ApiProxyResult;
  }

  static ok(data: any, headers: ResponseHeader = {}): ApiProxyResult {
    return CallbackResponse.mapResponse(data, headers);
  }

  static noContent(headers: ResponseHeader = {}): ApiProxyResult {
    return CallbackResponse.mapResponse(null, headers, HttpStatus.NoContent);
  }

  static conflict(message: string, headers: ResponseHeader = {}): ApiProxyResult {
    return CallbackResponse.mapResponse(message, headers, HttpStatus.Conflict);
  }

  static error(error: Error): ApiProxyResult {
    // cloudWatchLogger(`${error.message}`, 'API ResponseEntity', 'error');
    // return CallbackResponse.mapResponse(error.message, {}, HttpStatus.ServerError);
    console.log(`[ERR0] API > ${error.message}`);
    return CallbackResponse.mapResponse(DefaultError, {}, HttpStatus.ServerError);
  }

  static badRequest(): ApiProxyResult {
    return CallbackResponse.mapResponse(HttpCodes[400], {}, HttpStatus.BadRequest);
  }

  static notFound(): ApiProxyResult {
    return CallbackResponse.mapResponse(HttpCodes[404], {}, HttpStatus.NotFound);
  }

  static forbidden(): ApiProxyResult {
    return CallbackResponse.mapResponse(HttpCodes[403], {}, HttpStatus.Forbidden);
  }

  static unauthorized(): ApiProxyResult {
    return CallbackResponse.mapResponse(HttpCodes[401], {}, HttpStatus.Unauthorized);
  }

  static customError(message: any, status: HttpStatus): ApiProxyResult {
    // cloudWatchLogger(message, null, 'error');
    return CallbackResponse.mapResponse(message, {}, status);
  }

  static errorByStatus(status: HttpStatus): ApiProxyResult {
    const message = HttpCodes[status] ?? HttpCodes['500'];
    // cloudWatchLogger(`${message}`, 'API ResponseEntity', 'error');
    return CallbackResponse.mapResponse(message, {}, status);
  }
}