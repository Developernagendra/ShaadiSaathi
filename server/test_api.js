const http = require('http');

const data = JSON.stringify({
  brideName: "Test",
  groomName: "Test",
  weddingDate: "2024-12-12",
  city: "Patna",
  budget: 500000,
  guestCount: 200,
  weddingType: "Traditional",
  servicesRequired: ["Venue"]
});

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/ai/wedding-planner',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('BODY:', body));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
