require('dotenv').config();
const axios = require('axios');

const call = async (options) => {
    try {
        const response = await axios(options);
        return response;
    } catch (error) {
        error_response = {
            hasError: true,
            message: error.message,
            status: error.status,
            code: error.code
        }
        if (error.response) {
            error_response.error_data = error.response.data;
        }
        return error_response;
    }
}

exports.call = call;