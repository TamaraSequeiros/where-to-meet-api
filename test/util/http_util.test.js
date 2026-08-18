const nock = require('../setup/nock_setup');
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

    const response = await http_util.call(options);
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

    const response = await http_util.call(options);
    expect(response.hasError).toBe(true);
    expect(response.status).toEqual(400);
    expect(response.code).toEqual('ERR_BAD_REQUEST');
    expect(response.message).toEqual('Request failed with status code 400');
    expect(response.error_data.error.status).toEqual('INVALID_ARGUMENT');
    expect(response.error_data.error.message).toEqual('Invalid JSON payload received. Unknown name \"origin\": Proto field is not repeating, cannot start list.\n + Invalid JSON payload received. Unknown name \"destination\": Proto field is not repeating, cannot start list.');
});

test('Mock post success with a body-level error_message (e.g. REQUEST_DENIED) is reported as an error', async() => {
    // Some Google APIs (e.g. the legacy Geocoding API) signal errors like an
    // invalid API key or exceeded quota with an HTTP 200 and the error
    // encoded in the response body, not the HTTP status.
    const json = { status: 'REQUEST_DENIED', error_message: 'The provided API key is invalid.', results: [] };

    nock(HOST).post(PATH)
    .reply(200, json);

    const options = {
        url: HOST + PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await http_util.call(options);
    expect(response.hasError).toBe(true);
    expect(response.status).toEqual(200);
    expect(response.message).toEqual('The provided API key is invalid.');
});

test('Mock connection-level failure (no HTTP response at all)', async() => {
    // Unlike a 4xx/5xx reply, a connection failure never gets an
    // error.response, so error_data must stay unset -- a different branch
    // of the catch block than "Mock post error" above exercises.
    nock(HOST).post(PATH)
    .replyWithError({ message: 'connect ECONNREFUSED', code: 'ECONNREFUSED' });

    const options = {
        url: HOST + PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await http_util.call(options);
    expect(response.hasError).toBe(true);
    expect(response.code).toEqual('ECONNREFUSED');
    expect(response.message).toEqual('connect ECONNREFUSED');
    expect(response.error_data).toBeUndefined();
});