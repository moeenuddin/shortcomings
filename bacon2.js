const http = require('http');
const https = require('https');
const url = require('url');
const Bacon = require('baconjs');

const TIMEOUT = 10000; // 10 seconds timeout

// Function to fetch the title of a given URL
const fetchTitle = (address) => {
  return new Promise((resolve) => {
    const parsedUrl = url.parse(address.startsWith('http') ? address : `http://${address}`);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.get(parsedUrl.href, (res) => {
      let data = '';

      // Handle redirects
      if ([300, 301, 302].includes(res.statusCode)) {
        console.log(`Redirecting to: ${res.headers.location}`);
        resolve(fetchTitle(res.headers.location)); // Recursively fetch the title from the new location
        return;
      }

      if (res.statusCode !== 200) {
        resolve({ url: address, error: `Request failed. Status code: ${res.statusCode}` });
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const match = data.match(/<title>([^<]*)<\/title>/i);
        if (match && match[1]) {
          resolve({ url: address, title: match[1] });
        } else {
          resolve({ url: address, error: 'Title not found' });
        }
      });
    }).on('error', (err) => {
      resolve({ url: address, error: `Error: ${err.message}` });
    });

    req.setTimeout(TIMEOUT, () => {
      req.abort(); // Abort the request after timeout
      resolve({ url: address, error: 'Request timed out' });
    });
  });
};

// Create HTTP server
http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  if (path === '/fetch-titles') {
    const addresses = parsedUrl.query.address;

    console.log(addresses);

    if (!addresses) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No addresses provided' }));
      return;
    }

    let addressArray = Array.isArray(addresses) ? addresses : [addresses];

    // Set the response header to keep the connection open
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // Create a stream for each address
    const streams = addressArray.map(address =>
      Bacon.fromPromise(fetchTitle(address)).map(result => {
        return JSON.stringify(result);
      })
    );

    // Merge all streams into one
    const mergedStream = Bacon.mergeAll(streams);

    // For each result emitted from the stream, write it to the response
    mergedStream.onValue((result) => {
      res.write(result + '\n'); // Send the result immediately
    });

    // When all streams have completed, end the response
    mergedStream.onEnd(() => {
      res.end(); // Close the response
    });

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
}).listen(4000, () => {
  console.log('Server is listening on port 4000');
});
