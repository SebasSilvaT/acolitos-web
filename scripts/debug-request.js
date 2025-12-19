
const http = require('http');

const req = http.request('http://localhost:3000/api/setup', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', data);
    });
});

req.on('error', (e) => {
    console.error('REQUEST ERROR:', e);
});

req.end();
