const nock = require('../setup/nock_setup');
const gm_routes = require('../../src/controller/gm_routes');
const file_util = require('../../src/util/file_util');

const middle_route1 = {
    lat: 52.367166999999995,
    lng: 4.8934659
}

const origin = { lat: 52.3781275, lng: 4.899858 };
const destination = { lat: 52.3605618, lng: 4.8859511 };

const HOST = 'https://routes.googleapis.com';
const PATH = '/directions/v2:computeRoutes';

test('Mock success call', async() => {
    const json = file_util.read_json_file('./test/files/mock_route1-bycicle.json');

    nock(HOST).post(PATH)
    .reply(200, json);

    let middle_point = await gm_routes.calculate_middle(origin, destination);
    expect(middle_point).toEqual(middle_route1);
});

test('Mock error call', async() => {
    const json = file_util.read_json_file('./test/files/mock_error.json');

    nock(HOST).post(PATH)
    .reply(400, json);

    await expect(gm_routes.calculate_middle(origin, destination))
        .rejects.toThrow('Error retrieving routes');
});

test('Process route1 to return coordinates', async () => {
    const json = file_util.read_json_file('./test/files/mock_route1-bycicle.json');

    let response = gm_routes.process_route(json);
    expect(response).toEqual(middle_route1);
});

test('Process route with no routes throws', async () => {
    expect(() => gm_routes.process_route({ routes: [] })).toThrow('No bicycle route found between these locations');
});

test('Process route where no step reaches the halfway point throws', async () => {
    const route_data = {
        routes: [{
            staticDuration: '1000s',
            legs: [{
                steps: [
                    { staticDuration: '100s', endLocation: { latLng: { latitude: 1, longitude: 1 } } },
                    { staticDuration: '200s', endLocation: { latLng: { latitude: 2, longitude: 2 } } }
                ]
            }]
        }]
    };

    expect(() => gm_routes.process_route(route_data)).toThrow('Could not determine a halfway point along the route');
});
