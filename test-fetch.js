const http = require('http');

http.get('http://localhost:3000/api/admin/pricing', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
