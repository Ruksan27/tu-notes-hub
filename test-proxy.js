const http = require('http');

http.get('http://localhost:3000/api/drive-proxy?url=https%3A%2F%2Fdrive.google.com%2Ffile%2Fd%2F1WpO5Z8fHy0JSJ5ssRT4oFQvxhtek8540%2Fpreview', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body (first 500 chars):', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
