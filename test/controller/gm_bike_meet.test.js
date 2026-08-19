process.env['NODE_DEV'] = 'TEST';
const nock = require('nock');
const gm_bike_meet = require('../../src/controller/gm_bike_meet');

const HOST = 'https://places.googleapis.com';
const NEARBY_PATH = '/v1/places:searchNearby';

const locationA = { lat: 52.3781275, lng: 4.899858 };
const locationB = { lat: 52.3605618, lng: 4.8859511 };

const originIsA = (body) => body.routingParameters.origin.latitude === locationA.lat;
const originIsB = (body) => body.routingParameters.origin.latitude === locationB.lat;

const place = (overrides = {}) => ({
    id: 'default-id',
    displayName: { text: 'Some Venue' },
    location: { latitude: 52.37, longitude: 4.89 },
    userRatingCount: 50,
    businessStatus: 'OPERATIONAL',
    rating: 4.5,
    ...overrides
});

const summary = (duration) => ({ legs: [{ duration }] });

afterEach(() => {
    nock.cleanAll();
});

describe('merge_and_rank', () => {
    test('ranks by a blend of fairness and rating, dropping closed and low-rated venues', () => {
        const fromA = {
            places: [
                place({ id: 'p1', displayName: { text: 'Fair, mediocre rating' }, rating: 3.5 }),
                place({ id: 'p2', displayName: { text: 'Less fair, great rating' }, rating: 4.9 }),
                place({ id: 'p3', displayName: { text: 'Too few ratings' }, userRatingCount: 5 }),
                place({ id: 'p4', displayName: { text: 'Closed' }, businessStatus: 'CLOSED_PERMANENTLY' })
            ],
            routingSummaries: [
                summary('600s'),
                summary('300s'),
                summary('300s'),
                summary('300s')
            ]
        };
        const fromB = {
            places: [
                place({ id: 'p1' }),
                place({ id: 'p2' }),
                place({ id: 'p3' }),
                place({ id: 'p4' })
            ],
            routingSummaries: [
                summary('660s'), // p1: 60s gap
                summary('900s'), // p2: 600s gap, but much better rated
                summary('300s'),
                summary('300s')
            ]
        };

        const ranked = gm_bike_meet.merge_and_rank(fromA, fromB);

        expect(ranked.map((v) => v.displayName)).toEqual(['Fair, mediocre rating', 'Less fair, great rating']);
        expect(ranked[0]).toMatchObject({
            bikeMinutesFromFirstLocation: 10,
            bikeMinutesFromSecondLocation: 11,
            fairnessGapMinutes: 1
        });
    });

    test('a lower-fairness venue can outrank a fairer one when its rating is high enough', () => {
        const fromA = {
            places: [
                place({ id: 'p1', displayName: { text: 'Very fair, bad rating' }, rating: 2.0 }),
                place({ id: 'p2', displayName: { text: 'Less fair, perfect rating' }, rating: 5.0 })
            ],
            routingSummaries: [summary('300s'), summary('300s')]
        };
        const fromB = {
            places: [
                place({ id: 'p1' }),
                place({ id: 'p2' })
            ],
            routingSummaries: [
                summary('300s'), // p1: 0s gap
                summary('360s')  // p2: 60s gap
            ]
        };

        const ranked = gm_bike_meet.merge_and_rank(fromA, fromB);

        // p1 score: 0 + (5-2)*2 = 6 minutes. p2 score: 1 + (5-5)*2 = 1 minute. p2 wins.
        expect(ranked.map((v) => v.displayName)).toEqual(['Less fair, perfect rating', 'Very fair, bad rating']);
    });

    test('drops candidates missing a duration from either origin', () => {
        const fromA = {
            places: [place({ id: 'p1' })],
            routingSummaries: [summary('300s')]
        };
        const fromB = { places: [], routingSummaries: [] };

        expect(gm_bike_meet.merge_and_rank(fromA, fromB)).toEqual([]);
    });
});

describe('haversine_distance_meters / search_radius_for', () => {
    test('computes a plausible distance between two nearby Amsterdam points', () => {
        const meters = gm_bike_meet.haversine_distance_meters(locationA, locationB);
        // These two points are roughly 2km apart in reality.
        expect(meters).toBeGreaterThan(1500);
        expect(meters).toBeLessThan(2500);
    });

    test('search radius grows with distance but has a floor', () => {
        const close = { lat: 52.370, lng: 4.895 };
        expect(gm_bike_meet.search_radius_for(close, close)).toBe(1500.0);

        const far = { lat: 52.5, lng: 5.2 };
        const radius = gm_bike_meet.search_radius_for(locationA, far);
        expect(radius).toBeGreaterThan(1500.0);
    });
});

describe('find_bike_meeting_venues', () => {
    test('returns several ranked options, not just one', async () => {
        // 5 candidates so the initial search already satisfies MAX_RESULTS
        // and the radius-expansion retry (covered separately below) doesn't fire.
        const names = ['One', 'Two', 'Three', 'Four', 'Five'];
        const fromA = {
            places: names.map((name, i) => place({ id: `p${i}`, displayName: { text: name }, rating: 4.0 })),
            routingSummaries: names.map((_, i) => summary(`${300 + i * 10}s`))
        };
        const fromB = {
            places: fromA.places,
            routingSummaries: names.map((_, i) => summary(`${320 + i * 10}s`))
        };

        nock(HOST).post(NEARBY_PATH, originIsA).reply(200, fromA);
        nock(HOST).post(NEARBY_PATH, originIsB).reply(200, fromB);

        const venues = await gm_bike_meet.find_bike_meeting_venues(locationA, locationB);

        expect(venues.length).toBe(5);
        expect(venues.map((v) => v.displayName)).toEqual(names);
    });

    test('expands the search radius when too few candidates are found', async () => {
        const narrow = {
            places: [place({ id: 'p1' })],
            routingSummaries: [summary('300s')]
        };
        const wide = {
            places: [
                place({ id: 'p1' }),
                place({ id: 'p2', displayName: { text: 'Farther but found on retry' } })
            ],
            routingSummaries: [summary('300s'), summary('400s')]
        };

        nock(HOST).post(NEARBY_PATH, originIsA).reply(200, narrow);
        nock(HOST).post(NEARBY_PATH, originIsB).reply(200, narrow);
        nock(HOST).post(NEARBY_PATH, originIsA).reply(200, wide);
        nock(HOST).post(NEARBY_PATH, originIsB).reply(200, wide);

        const venues = await gm_bike_meet.find_bike_meeting_venues(locationA, locationB);

        expect(venues.length).toBe(2);
    });

    test('throws when no venue is reachable by bicycle from both locations, even after expanding', async () => {
        const empty = { places: [], routingSummaries: [] };

        nock(HOST).post(NEARBY_PATH, originIsA).times(2).reply(200, empty);
        nock(HOST).post(NEARBY_PATH, originIsB).times(2).reply(200, empty);

        await expect(gm_bike_meet.find_bike_meeting_venues(locationA, locationB))
            .rejects.toThrow('Could not find any venues reachable by bicycle from both locations');
    });
});
