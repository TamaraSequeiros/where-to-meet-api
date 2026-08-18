// Verbose request/response logging, silenced in production (NODE_ENV=production).
// Error diagnostics (console.error, or console.dir on a failure path) are
// left as regular console calls elsewhere -- those should always be logged.
const enabled = process.env.NODE_ENV !== 'production';

const log = (...args) => {
    if (enabled) {
        console.log(...args);
    }
};

const dir = (obj, options) => {
    if (enabled) {
        console.dir(obj, options);
    }
};

exports.log = log;
exports.dir = dir;
