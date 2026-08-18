// Shared nock hygiene for the tests that mock Google's HTTP APIs. Require
// this instead of 'nock' directly in those files.
const nock = require('nock');

// Fail loudly if a request doesn't match a defined interceptor, instead of
// silently falling through to a real network call.
nock.disableNetConnect();

// Reset interceptors after every test so a test that fails before consuming
// its mock can't leak an unmatched interceptor into the next one.
afterEach(() => {
    nock.cleanAll();
});

// disableNetConnect() patches Node's http/https modules for the whole
// process, and Jest can run multiple test files in the same worker
// process. Without this, a later file in the same worker that makes real
// local requests (e.g. the supertest-based route tests) would get blocked
// too.
afterAll(() => {
    nock.enableNetConnect();
});

module.exports = nock;
