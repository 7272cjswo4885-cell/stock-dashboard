const path = require('path');
const handler = require(path.join(__dirname, 'pages', 'api', 'data.js')).default;
const req = { method: 'GET', query: {} };
const res = {
  status(code) { this._status = code; return this; },
  json(data) { console.log('HANDLER RESPONSE', this._status || 200, JSON.stringify(data)); },
};
(async()=>{
  try {
    await handler(req, res);
  } catch(e) {
    console.error('HANDLER ERR', e);
  }
})();
