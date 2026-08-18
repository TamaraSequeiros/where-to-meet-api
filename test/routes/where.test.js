const express = require('express');
const request = require('supertest');

jest.mock('../../src/controller/gm_geocoding');
jest.mock('../../src/controller/gm_routes');

const gm_geocoding = require('../../src/controller/gm_geocoding');
const gm_routes = require('../../src/controller/gm_routes');
const whereRouter = require('../../src/routes/where');

const app = express();
app.use(express.json());
app.use('/where', whereRouter);

const location1 = { lat: 52.3781275, lng: 4.899858 };
const location2 = { lat: 52.3605618, lng: 4.8859511 };

beforeEach(() => {
    jest.clearAllMocks();
});

describe('geographical method', () => {
    test('averages two given locations', async () => {
        const res = await request(app)
            .post('/where/geographical')
            .send({ method: 'geographical', locations: [location1, location2] });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            middle_point: {
                lat: (location1.lat + location2.lat) / 2,
                lng: (location1.lng + location2.lng) / 2
            }
        });
        expect(gm_geocoding.get_coordinates).not.toHaveBeenCalled();
    });

    test('geocodes two given addresses before averaging', async () => {
        gm_geocoding.get_coordinates.mockImplementation(async (address) => {
            return address === 'Address A' ? location1 : location2;
        });

        const res = await request(app)
            .post('/where/geographical')
            .send({ method: 'geographical', addresses: ['Address A', 'Address B'] });

        expect(res.status).toBe(200);
        expect(res.body.middle_point).toEqual({
            lat: (location1.lat + location2.lat) / 2,
            lng: (location1.lng + location2.lng) / 2
        });
    });
});

describe('route method', () => {
    test('delegates to gm_routes and returns its result', async () => {
        const routeMiddle = { lat: 52.37, lng: 4.89 };
        gm_routes.calculate_middle.mockResolvedValue(routeMiddle);

        const res = await request(app)
            .post('/where/route')
            .send({ method: 'route', locations: [location1, location2] });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ middle_point: routeMiddle });
        expect(gm_routes.calculate_middle).toHaveBeenCalledWith(location1, location2);
    });

    test('wraps a gm_routes failure as a 502', async () => {
        gm_routes.calculate_middle.mockRejectedValue(new Error('No bicycle route found between these locations'));

        const res = await request(app)
            .post('/where/route')
            .send({ method: 'route', locations: [location1, location2] });

        expect(res.status).toBe(502);
        expect(res.body).toEqual({ error: 'No bicycle route found between these locations' });
    });
});

describe('validation', () => {
    test('rejects an unsupported method', async () => {
        const res = await request(app)
            .post('/where/foo')
            .send({ method: 'foo', locations: [location1, location2] });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Method foo not supported' });
    });

    test('rejects locations that are not a two-element array', async () => {
        const res = await request(app)
            .post('/where/geographical')
            .send({ method: 'geographical', locations: [location1] });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Expected exactly two locations' });
    });

    test('rejects addresses that are not a two-element array', async () => {
        const res = await request(app)
            .post('/where/geographical')
            .send({ method: 'geographical', addresses: ['Only one'] });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Expected exactly two addresses' });
    });

    test('rejects a request with neither locations nor addresses', async () => {
        const res = await request(app)
            .post('/where/geographical')
            .send({ method: 'geographical' });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Missing input: locations or addresses' });
    });

    test('returns 422 naming the address that failed to geocode', async () => {
        gm_geocoding.get_coordinates.mockImplementation(async (address) => {
            return address === 'Bad address' ? { hasError: true } : location1;
        });

        const res = await request(app)
            .post('/where/geographical')
            .send({ method: 'geographical', addresses: ['Good address', 'Bad address'] });

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: 'Could not geocode address 2: "Bad address"' });
    });
});
