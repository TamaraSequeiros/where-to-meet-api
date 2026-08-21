// Finds real venues that are a fair, good bicycle meeting point for two
// people, replacing the old two-step "compute an abstract midpoint, then
// separately search for venues near it" flow.
//
// Real venues near the geographic midpoint are used as the candidate set
// directly. For each candidate we ask the Places API for a bicycle routing
// summary (real travel time) from both locations in parallel, then rank by
// a blend of fairness (how close the two travel times are) and venue
// quality (rating). We always return several ranked options rather than
// collapsing to a single "best" spot -- the app should let people choose.

const gm_places = require('./gm_places');
const venue_format = require('../util/venue_format');

const MAX_CANDIDATES = 20;
const MAX_RESULTS = 5;
const BASE_RADIUS_METERS = 1500.0;
const RADIUS_DISTANCE_FACTOR = 0.15; // bike routes detour, so search wider than a straight line would suggest
const RADIUS_EXPANSION_MULTIPLIER = 2;
const EARTH_RADIUS_METERS = 6371000;

// How many minutes of fairness gap we're willing to trade for one extra star
// of rating when ranking candidates. Tunable -- not derived from anything.
const RATING_PENALTY_MINUTES_PER_MISSING_STAR = 2;

const to_radians = (degrees) => degrees * Math.PI / 180;

// Great-circle distance between two {lat,lng} points, in meters.
const haversine_distance_meters = (a, b) => {
    const dLat = to_radians(b.lat - a.lat);
    const dLng = to_radians(b.lng - a.lng);
    const lat1 = to_radians(a.lat);
    const lat2 = to_radians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
};

const geographic_midpoint = (a, b) => ({
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2
});

const search_radius_for = (locationA, locationB) => {
    const straightLineDistance = haversine_distance_meters(locationA, locationB);
    return Math.max(BASE_RADIUS_METERS, straightLineDistance * RADIUS_DISTANCE_FACTOR);
};

const parse_duration_seconds = (durationString) => {
    if (typeof durationString !== 'string' || !durationString.endsWith('s')) {
        return null;
    }
    const seconds = parseFloat(durationString.slice(0, -1));
    return Number.isFinite(seconds) ? seconds : null;
};

const extract_duration_seconds = (summary) => {
    if (!summary || !Array.isArray(summary.legs)) {
        return null;
    }
    return summary.legs.reduce((total, leg) => {
        const legSeconds = leg && parse_duration_seconds(leg.duration);
        return legSeconds == null ? total : total + legSeconds;
    }, 0);
};

// Builds a { placeId: durationSeconds } map from a searchNearby+routingSummaries
// response, where routingSummaries[i] corresponds to places[i].
const index_durations_by_place_id = (searchResult) => {
    const places = (searchResult && searchResult.places) || [];
    const summaries = (searchResult && searchResult.routingSummaries) || [];
    const durations = {};
    places.forEach((place, i) => {
        const seconds = extract_duration_seconds(summaries[i]);
        if (seconds != null) {
            durations[place.id] = seconds;
        }
    });
    return durations;
};

// Lower is "better". Blends the fairness gap (in minutes) with a penalty for
// venues rated below 5 stars, so a slightly less fair option can still win
// if it's meaningfully better rated.
const combined_score = (fairnessGapSeconds, rating) => {
    const fairnessGapMinutes = fairnessGapSeconds / 60;
    const ratingPenalty = (5 - (rating || 0)) * RATING_PENALTY_MINUTES_PER_MISSING_STAR;
    return fairnessGapMinutes + ratingPenalty;
};

// Ranks venues by a blend of fairness (bike time from A vs from B) and
// rating. Only includes venues we have a real bicycle duration for from
// both origins, that are open, and that have enough ratings to trust.
const merge_and_rank = (fromA, fromB) => {
    const durationsB = index_durations_by_place_id(fromB);
    const placesA = (fromA && fromA.places) || [];
    const summariesA = (fromA && fromA.routingSummaries) || [];

    const candidates = [];
    placesA.forEach((place, i) => {
        if (venue_format.is_closed(place) || !venue_format.has_enough_ratings(place)) {
            return;
        }
        const durationA = extract_duration_seconds(summariesA[i]);
        const durationB = durationsB[place.id];
        if (durationA == null || durationB == null) {
            return;
        }
        const fairnessGapSeconds = Math.abs(durationA - durationB);
        candidates.push({
            place,
            durationA,
            durationB,
            fairnessGapSeconds,
            score: combined_score(fairnessGapSeconds, place.rating)
        });
    });

    candidates.sort((x, y) => x.score - y.score);
    return candidates.map(({ place, durationA, durationB, fairnessGapSeconds, score }) => ({
        ...venue_format.format_place(place),
        bikeMinutesFromFirstLocation: Math.round(durationA / 60),
        bikeMinutesFromSecondLocation: Math.round(durationB / 60),
        fairnessGapMinutes: Math.round(fairnessGapSeconds / 60),
        score
    }));
};

const search_and_rank = async (center, radius, locationA, locationB) => {
    const [fromA, fromB] = await Promise.all([
        gm_places.get_nearby_places_routed(center.lat, center.lng, MAX_CANDIDATES, radius, locationA),
        gm_places.get_nearby_places_routed(center.lat, center.lng, MAX_CANDIDATES, radius, locationB)
    ]);
    return merge_and_rank(fromA, fromB);
};

// Finds up to MAX_RESULTS real venues, reachable by bike from both
// locations, ranked by a blend of fairness and rating. Always returns a set
// of ranked options -- never collapses to a single "best" point -- so the
// app can let two people choose between them.
const find_bike_meeting_venues = async (locationA, locationB) => {
    const center = geographic_midpoint(locationA, locationB);
    const radius = search_radius_for(locationA, locationB);

    let ranked = await search_and_rank(center, radius, locationA, locationB);
    if (ranked.length < MAX_RESULTS) {
        const expanded = await search_and_rank(center, radius * RADIUS_EXPANSION_MULTIPLIER, locationA, locationB);
        if (expanded.length > ranked.length) {
            ranked = expanded;
        }
    }
    if (ranked.length === 0) {
        throw new Error('Could not find any venues reachable by bicycle from both locations');
    }
    return ranked.slice(0, MAX_RESULTS);
};

exports.find_bike_meeting_venues = find_bike_meeting_venues;
if (process.env['NODE_DEV'] == 'TEST') {
    module.exports.merge_and_rank = merge_and_rank;
    module.exports.haversine_distance_meters = haversine_distance_meters;
    module.exports.search_radius_for = search_radius_for;
    module.exports.combined_score = combined_score;
}
