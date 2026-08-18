module.exports = {
    // Runs before the test framework is installed, so it's the right place
    // for plain env vars (as opposed to nock/afterEach-based setup, which
    // needs Jest globals and lives alongside the tests that use it instead
    // -- see test/setup/nock_setup.js).
    setupFiles: ['<rootDir>/test/setup/env.js'],
    // Don't pick up test files from nested git worktrees (e.g.
    // .claude/worktrees/...) checked out inside this repo.
    testPathIgnorePatterns: ['/node_modules/', '/.claude/']
};
