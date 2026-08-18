// Unlocks gm_routes.js's test-only export of process_route (see the
// NODE_DEV check at the bottom of src/controller/gm_routes.js). Harmless
// for every other test file, so it's set once here instead of being
// duplicated at the top of each test file.
process.env['NODE_DEV'] = 'TEST';
