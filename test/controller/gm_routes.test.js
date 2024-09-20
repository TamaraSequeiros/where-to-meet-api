process.env['NODE_DEV'] = 'TEST';
const nock = require('nock');
const gm_routes = require('../../src/controller/gm_routes');
const file_util = require('../../src/util/file_util');

middle_route1 = {
    latitude: 52.367166999999995, 
    longitude: 4.8934659
}

test('Mock call', async() => {
    const json = file_util.read_json_file('./test/files/mock_route1-bycicle.json');

    nock("https://routes.googleapis.com")
    .post("/directions/v2:computeRoutes")
    .reply(200, json);
    
    // doesn't matter
    const location1 = [0, 0]; 
    const location2 = [0, 0];

    let middle_point = await gm_routes.call(location1, location2)
    expect(middle_point).toEqual(middle_route1);
});

test('Process route1 to return coordinates', async () => {
    const json = file_util.read_json_file('./test/files/mock_route1-bycicle.json');

    let response = gm_routes.process_route(json);
    expect(response).toEqual(middle_route1);
});