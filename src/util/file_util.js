const fs = require('fs');
const path = require('path');


const read_json_file = (relative_path) => {
    const fullPath = path.resolve(relative_path);
    const json = JSON.parse(fs.readFileSync(fullPath));
    return json;
};

exports.read_json_file = read_json_file;