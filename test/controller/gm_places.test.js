process.env['NODE_DEV'] = 'TEST';
const nock = require('nock');
const gm_places = require('../../src/controller/gm_places');
const file_util = require('../../src/util/file_util');

const HOST = 'https://places.googleapis.com';
const NEARBY_PATH = '/v1/places:searchNearby';
const AUTOCOMPLETE_PATH = '/v1/places:autocomplete';

test('get_nearby_places returns places on success', async () => {
    const json = file_util.read_json_file('./test/files/mock_places.json');

    nock(HOST).post(NEARBY_PATH)
        .reply(200, json);

    const response = await gm_places.get_nearby_places(52.377, 4.891, 20);
    expect(response).toEqual(json);
});

test('get_nearby_places throws on upstream error', async () => {
    const json = file_util.read_json_file('./test/files/mock_error.json');

    nock(HOST).post(NEARBY_PATH)
        .reply(400, json);

    await expect(gm_places.get_nearby_places(52.377, 4.891, 20))
        .rejects.toThrow('Error retrieving nearby places');
});

test('complete_address returns suggestions on success', async () => {
    const json = { suggestions: [{ placePrediction: { text: { text: 'Dam Square, Amsterdam' } } }] };

    nock(HOST).post(AUTOCOMPLETE_PATH)
        .reply(200, json);

    const response = await gm_places.complete_address('Dam Squ', 52.377, 4.891);
    expect(response).toEqual(json);
});

test('complete_address throws on upstream error', async () => {
    const json = file_util.read_json_file('./test/files/mock_error.json');

    nock(HOST).post(AUTOCOMPLETE_PATH)
        .reply(400, json);

    await expect(gm_places.complete_address('Dam Squ', 52.377, 4.891))
        .rejects.toThrow('Error retrieving address suggestions');
});
