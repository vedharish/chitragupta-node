const { v4: uuidv4 } = require('uuid');

const cls = require('./cls');
const util = require('./util');
const constants = require('./constants');

function getUniqueLogId() {
  return uuidv4();
}

function setupInitialServerData(request, response, userId) {
  request.request_id = getUniqueLogId();
  cls.set('server', true);
  cls.set('request_start_time', new Date());
  cls.set('request', request);
  cls.set('response', response);
  cls.set('userId', userId);
}

function setupResponseOnFinishListener(logger, response) {
  response.on('finish', () => {
    response.duration = new Date() - cls.get('request_start_time');
    logger.log('info', 'Done', { log: { kind: constants.NODE_REQUEST_KIND } });
  });
}

function setupServerLogger(logger, request, response, userId, fn) {
  cls.ns.run(() => {
    setupInitialServerData(request, response, userId);
    setupResponseOnFinishListener(logger, response);
    fn(request, response);
  });
}

function setupInitialProcessData(name) {
  cls.set('process', true);
  cls.set('process_name', name);
  cls.set('execution_id', getUniqueLogId());
}

function setupProcessLogger(name, fn, ...args) {
  cls.ns.run(() => {
    setupInitialProcessData(name);
    fn(...args);
  });
}

function jsonLogFormatter(options) {
  return JSON.stringify(util.sanitizeKeys(options.level, options.message, options.meta));
}

module.exports = {
  setupServerLogger,
  setupProcessLogger,
  getUniqueLogId,
  jsonLogFormatter,
};