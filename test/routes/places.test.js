const express = require('express');
const request = require('supertest');

jest.mock('../../src/controller/gm_places');

const gm_places = require('../../src/controller/gm_places');
const placesRouter = require('../../src/routes/places');

const app = express();
app.use(express.json());
app.use('/places', placesRouter);

const LAT = 52.377;
const LNG = 4.891;

// Builds a place shaped like a real Places API result, with sane defaults
// that pass the route's filters (open, enough ratings) unless overridden.
const makePlace = (overrides = {}) => ({
    id: 'place-id',
    formattedAddress: '123 Main St',
    displayName: { text: 'Some Venue' },
    userRatingCount: 50,
    ...overrides
});

beforeEach(() => {
    jest.clearAllMocks();
});

test('rejects a request without numeric lat/lng', async () => {
    const res = await request(app).post('/places/nearby').send({ lat: 'x', lng: LNG });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'lat and lng are required and must be numbers' });
    expect(gm_places.get_nearby_places).not.toHaveBeenCalled();
});

test('excludes closed businesses', async () => {
    gm_places.get_nearby_places.mockResolvedValue({
        places: [
            makePlace({ displayName: { text: 'Shuttered Bar' }, businessStatus: 'CLOSED_PERMANENTLY' }),
            makePlace({ displayName: { text: 'Open Bar' }, businessStatus: 'OPERATIONAL' })
        ]
    });

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.status).toBe(200);
    expect(res.body.places.map((p) => p.displayName)).toEqual(['Open Bar']);
});

test('excludes venues with fewer than 10 ratings, including missing counts', async () => {
    gm_places.get_nearby_places.mockResolvedValue({
        places: [
            makePlace({ displayName: { text: 'Too few ratings' }, userRatingCount: 5 }),
            makePlace({ displayName: { text: 'No rating count' }, userRatingCount: undefined }),
            makePlace({ displayName: { text: 'Exactly at threshold' }, userRatingCount: 10 })
        ]
    });

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.status).toBe(200);
    expect(res.body.places.map((p) => p.displayName)).toEqual(['Exactly at threshold']);
});

test('caps results at 5 even when more valid venues are returned', async () => {
    const sevenPlaces = Array.from({ length: 7 }, (_, i) => makePlace({ displayName: { text: `Venue ${i}` } }));
    gm_places.get_nearby_places.mockResolvedValue({ places: sevenPlaces });

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(5);
    expect(res.body.places.map((p) => p.displayName)).toEqual(['Venue 0', 'Venue 1', 'Venue 2', 'Venue 3', 'Venue 4']);
});

test('returns all venues when exactly 5 are valid', async () => {
    const fivePlaces = Array.from({ length: 5 }, (_, i) => makePlace({ displayName: { text: `Venue ${i}` } }));
    gm_places.get_nearby_places.mockResolvedValue({ places: fivePlaces });

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(5);
});

test('maps priceLevel to euro-sign symbols, and unknown/missing levels to null', async () => {
    gm_places.get_nearby_places.mockResolvedValue({
        places: [
            makePlace({ displayName: { text: 'Cheap' }, priceLevel: 'PRICE_LEVEL_INEXPENSIVE' }),
            makePlace({ displayName: { text: 'Moderate' }, priceLevel: 'PRICE_LEVEL_MODERATE' }),
            makePlace({ displayName: { text: 'Expensive' }, priceLevel: 'PRICE_LEVEL_EXPENSIVE' }),
            makePlace({ displayName: { text: 'Very expensive' }, priceLevel: 'PRICE_LEVEL_VERY_EXPENSIVE' }),
            makePlace({ displayName: { text: 'Unspecified' }, priceLevel: 'PRICE_LEVEL_UNSPECIFIED' })
        ]
    });

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.body.places.map((p) => p.priceLevel)).toEqual(['€', '€€', '€€€', '€€€€', null]);
});

test('reshapes displayName, primaryTypeDisplayName and location', async () => {
    gm_places.get_nearby_places.mockResolvedValue({
        places: [
            makePlace({
                displayName: { text: 'Cafe De Dam' },
                primaryTypeDisplayName: { text: 'Cafe' },
                location: { latitude: 52.373, longitude: 4.893 }
            })
        ]
    });

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.body.places[0]).toMatchObject({
        displayName: 'Cafe De Dam',
        primaryTypeDisplayName: 'Cafe',
        location: { lat: 52.373, lng: 4.893 }
    });
});

test('returns an empty list when every venue is filtered out', async () => {
    gm_places.get_nearby_places.mockResolvedValue({
        places: [makePlace({ businessStatus: 'CLOSED_TEMPORARILY' }), makePlace({ userRatingCount: 1 })]
    });

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ places: [] });
});

test('returns 500 when the controller throws', async () => {
    gm_places.get_nearby_places.mockRejectedValue(new Error('Error retrieving nearby places'));

    const res = await request(app).post('/places/nearby').send({ lat: LAT, lng: LNG });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error retrieving nearby places' });
});
