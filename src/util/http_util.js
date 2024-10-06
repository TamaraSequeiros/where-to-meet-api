require('dotenv').config();
const axios = require('axios');

const call = async (options) => {
    try {
        const response = await axios(options);
        if (response.error_message) {
            error_response = {
                hasError: true,
                message: response.error_message,
                status: response.status
            }
            return error_response;
        }
        return response;
    } catch (error) {
        console.dir(error, {depth: null})
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