// Shared shaping/filtering for Places API results, used by both the plain
// nearby-venues flow and the bicycle-fairness meeting-venue flow.

const PRICE_LEVEL_SYMBOLS = {
    PRICE_LEVEL_INEXPENSIVE: '€',
    PRICE_LEVEL_MODERATE: '€€',
    PRICE_LEVEL_EXPENSIVE: '€€€',
    PRICE_LEVEL_VERY_EXPENSIVE: '€€€€'
};

const represent_price_level = (priceLevel) => PRICE_LEVEL_SYMBOLS[priceLevel] || null;

const is_closed = (place) => Boolean(place.businessStatus && place.businessStatus.startsWith('CLOSED'));

const has_enough_ratings = (place, minRatingCount = 10) =>
    Boolean(place.userRatingCount) && place.userRatingCount >= minRatingCount;

// Reshapes a raw Places API place into the flatter shape the app returns:
// displayName/primaryTypeDisplayName as plain strings, location as {lat,lng},
// priceLevel as a euro-sign symbol.
const format_place = (place) => {
    const formatted = { ...place };
    if (formatted.displayName) {
        formatted.displayName = formatted.displayName.text;
    }
    if (formatted.primaryTypeDisplayName) {
        formatted.primaryTypeDisplayName = formatted.primaryTypeDisplayName.text;
    }
    if (formatted.location) {
        formatted.location = {
            lat: formatted.location.latitude,
            lng: formatted.location.longitude
        };
    }
    formatted.priceLevel = represent_price_level(formatted.priceLevel);
    return formatted;
};

exports.is_closed = is_closed;
exports.has_enough_ratings = has_enough_ratings;
exports.format_place = format_place;
