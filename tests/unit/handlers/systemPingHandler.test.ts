import { SystemPingHandler } from '../../../src/adapters/handlers/system/PingHandler';


const mockEvent = {
  url: '',
  method: '',
  headers: {},
  pathParameters: {},
  queryStringParameters: {},
  body: {},
  clientIp: '',
  requestId: '',
  appVersion: '',
  platform: '',
  operatingSystem: '',
  webbrowser: '',
  principalUser: {},
  security: '',
  context: {},
  resourceName: '',
}


describe('SystemPingHandlerTest', () => {

  test('Debe retornar la descripción del Sistema', async () => {

    const response = await SystemPingHandler(mockEvent);

    expect(response.body.status).toBe(200);
  });

});

