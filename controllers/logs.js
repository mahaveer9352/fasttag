const logger = require("../logs/logger");

function logApiCall({ url, requestData, responseData = null, error = null }) {
  if (responseData) {
    logger.info(`baseurl ${url} Request :`, requestData);
    logger.info(`baseurl ${url} Response:`, responseData);
  }
}

module.exports = logApiCall