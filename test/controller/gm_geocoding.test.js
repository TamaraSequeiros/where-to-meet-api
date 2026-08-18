const nock = require('../setup/nock_setup');
const gm_geocoding = require('../../src/controller/gm_geocoding');

const HOST = 'https://maps.googleapis.com';
const PATH = '/maps/api/geocode/json';

test('get_coordinates returns the first result location on success', async () => {
    const json = {
        status: 'OK',
        results: [
            { geometry: { location: { lat: 52.3676, lng: 4.9041 } } }
        ]
    };

    nock(HOST).get(PATH).query(true).reply(200, json);

    const location = await gm_geocoding.get_coordinates('Dam Square, Amsterdam');
    expect(location).toEqual({ lat: 52.3676, lng: 4.9041 });
});

test('get_coordinates reports an error when the address has no results', async () => {
    nock(HOST).get(PATH).query(true).reply(200, { status: 'ZERO_RESULTS', results: [] });

    const result = await gm_geocoding.get_coordinates('not a real address');
    expect(result.hasError).toBe(true);
});

test('get_coordinates reports an error on upstream failure', async () => {
    nock(HOST).get(PATH).query(true).reply(500, { error: 'boom' });

    const result = await gm_geocoding.get_coordinates('Dam Square, Amsterdam');
    expect(result.hasError).toBe(true);
});

test('get_coordinates reports an error for a body-level failure (e.g. REQUEST_DENIED), not "no results found"', async () => {
    // A quota/auth error comes back as HTTP 200 with an empty results array,
    // so this must not be mistaken for a plain "address not found".
    nock(HOST).get(PATH).query(true).reply(200, {
        status: 'REQUEST_DENIED',
        error_message: 'The provided API key is invalid.',
        results: []
    });

    const result = await gm_geocoding.get_coordinates('Dam Square, Amsterdam');
    expect(result.hasError).toBe(true);
    expect(result.errorMessage).toEqual('Error geocoding address: Dam Square, Amsterdam');
});
