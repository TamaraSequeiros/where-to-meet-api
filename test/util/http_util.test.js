process.env['NODE_DEV'] = 'TEST';
const nock = require('nock');
const file_util = require('../../src/util/file_util');
const http_util = require('../../src/util/http_util');

const HOST = 'https://routes.googleapis.com';
const PATH = '/directions/v2:computeRoutes';

test('Mock post success', async() => {
    const json = file_util.read_json_file('./test/files/mock_route1-bycicle.json');
    
    nock(HOST).post(PATH)
    .reply(200, json);
    
    const options = {
        url: HOST + PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await http_util.post(options);
    expect(response.data).toEqual(json);
});

test('Mock post error', async() => {
    const json = file_util.read_json_file('./test/files/mock_error.json');
    
    nock(HOST).post(PATH)
    .reply(400, json);
    
    const options = {
        url: HOST + PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await http_util.post(options);
    expect(response.hasError).toBe(true);
    expect(response.status).toEqual(400);
    expect(response.code).toEqual('ERR_BAD_REQUEST');
    expect(response.message).toEqual('Request failed with status code 400');
    expect(response.error_data.error.status).toEqual('INVALID_ARGUMENT');
    expect(response.error_data.error.message).toEqual('Invalid JSON payload received. Unknown name \"origin\": Proto field is not repeating, cannot start list.\n + Invalid JSON payload received. Unknown name \"destination\": Proto field is not repeating, cannot start list.');
});