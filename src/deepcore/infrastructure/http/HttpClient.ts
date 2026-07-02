import axios, { Axios, AxiosBasicCredentials, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';


export interface HttpHeaders {
  [name: string]: string;
}

export interface HttpResponse<T> {
  data: T;
  headers: HttpHeaders;
  status: number;
  statusText: string;
}

export class HttpClient {
  static readonly serialVersionUID = Symbol(HttpClient.name);

  private readonly DefaultHeaders: HttpHeaders = {
    'Content-Type': 'application/json; charset=UTF-8',
  }

  private client: Axios;

  private baseURL = '';

  private headers: HttpHeaders;

  private basicAuth!: AxiosBasicCredentials;

  private get hasBasicAuth(): boolean {
    return (
      this.basicAuth &&
      (
        'username' in this.basicAuth &&
        'password' in this.basicAuth
      )
    );
  }

  constructor(baseUrl: string = '') {
    this.baseURL = baseUrl;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": 'application/json',
      },
      timeout: 30000,
    });
    this.headers = {
      ...this.DefaultHeaders,
    }
  }

  setHeaders(headers: HttpHeaders): void {
    if (!Object.keys(headers).length) {
      return;
    }

    let property = '';
    for (property in headers) {
      this.addHeader(property, headers[property]);
    }
  }

  addHeader(property: string, value: string): void {
    this.headers[property] = value;
  }

  addBasicAuth(username: string, password: string): void {
    this.basicAuth = {
      username, password,
    } as AxiosBasicCredentials;
  }

  addAuthorizationBearer(token: string): void {
    this.addHeader('Authorization', `Bearer ${token}`);
  }

  private buildOptions(): AxiosRequestConfig<any> {
    const options = {
      headers: {
        ...this.headers,
      }
    } as AxiosRequestConfig;

    if (this.hasBasicAuth) {
      options.auth = this.basicAuth;
    }

    return options;
  }

  private resolve<T>(axiosResponse: AxiosResponse<any, any>): Promise<HttpResponse<T>> {
    const response = {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: axiosResponse.headers,
    } as HttpResponse<T>;

    if (axiosResponse.data) {
      response.data = axiosResponse.data;
    }

    return Promise.resolve(response);
  }

  private reject<T>(axiosError: AxiosError<any, any>): Promise<HttpResponse<T>> {
    console.log(`[ERR0] HttpClient.AxiosReject: ${JSON.stringify(axiosError)}`);

    if (!axiosError.response) {
      return Promise.reject(new Error(axiosError.message));
    }

    const response = {
      status: axiosError.response.status,
      statusText: axiosError.response.statusText,
      headers: axiosError.response.headers,
      data: axiosError.message,
    } as HttpResponse<T>;

    return Promise.resolve(response);
  }

  async get<T>(endpoint: string): Promise<HttpResponse<T>> {
    try {
      console.log(`[INF0] GET - ${this.baseURL}${endpoint}`);
      const response = await this.client.get(endpoint, this.buildOptions());

      return this.resolve<T>(response);
    }
    catch (error: any) {
      if (error instanceof AxiosError) {
        return this.reject<any>(error);
      }
      return Promise.reject(error);
    }
  }

  async post<T>(endpoint: string, payload: any): Promise<HttpResponse<T>> {
    try {
      console.log(`[INF0] POST - ${this.baseURL}${endpoint} Payload: ${JSON.stringify(payload)}`);
      const response = await this.client.post(endpoint, payload, this.buildOptions());
      console.log(`[INF0] POST Response - ${JSON.stringify(response.data)}`);

      return this.resolve<T>(response);
    }
    catch (error: any) {
      if (error instanceof AxiosError) {
        return this.reject<any>(error);
      }
      return Promise.reject(error);
    }
  }

  async put<T>(endpoint: string, payload: any): Promise<HttpResponse<T>> {
    try {
      console.log(`[INF0] PUT - ${this.baseURL}${endpoint} Payload: ${JSON.stringify(payload)}`);
      const response = await this.client.put(endpoint, payload, this.buildOptions());

      return this.resolve(response);
    }
    catch (error: any) {
      if (error instanceof AxiosError) {
        return this.reject<any>(error);
      }
      return Promise.reject(error);
    }
  }

  async patch<T>(endpoint: string, payload: any): Promise<HttpResponse<T>> {
    try {
      console.log(`[INF0] PATCH - ${this.baseURL}${endpoint}`);
      const response = await this.client.patch(endpoint, payload, this.buildOptions());

      return this.resolve(response);
    }
    catch (error: any) {
      if (error instanceof AxiosError) {
        return this.reject<any>(error);
      }
      return Promise.reject(error);
    }
  }

  async delete<T>(endpoint: string): Promise<HttpResponse<T>> {
    try {
      console.log(`[INF0] DELETE - ${this.baseURL}${endpoint}`);
      const response = await this.client.delete(endpoint, this.buildOptions());

      return this.resolve(response);
    }
    catch (error: any) {
      if (error instanceof AxiosError) {
        return this.reject<any>(error);
      }
      return Promise.reject(error);
    }
  }

}

