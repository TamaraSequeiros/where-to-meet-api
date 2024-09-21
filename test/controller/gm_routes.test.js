process.env['NODE_DEV'] = 'TEST';
const nock = require('nock');
const gm_routes = require('../../src/controller/gm_routes');
const file_util = require('../../src/util/file_util');

middle_route1 = {
    latitude: 52.367166999999995, 
    longitude: 4.8934659
}

const HOST = 'https://routes.googleapis.com';
const PATH = '/directions/v2:computeRoutes';

test('Mock success call', async() => {
    const json = file_util.read_json_file('./test/files/mock_route1-bycicle.json');

    nock(HOST).post(PATH)
    .reply(200, json);
    
    let middle_point = await gm_routes.calculate_middle([], []);
    expect(middle_point).toEqual(middle_route1);
});

test('Mock error call', async() => {
    const json = file_util.read_json_file('./test/files/mock_error.json');

    nock(HOST).post(PATH)
    .reply(400, json);

    const response = await gm_routes.calculate_middle([], []);
    expect(response).toEqual('Error retrieving routes');
});

test('Process route1 to return coordinates', async () => {
    const json = file_util.read_json_file('./test/files/mock_route1-bycicle.json');

    let response = gm_routes.process_route(json);
    expect(response).toEqual(middle_route1);
});