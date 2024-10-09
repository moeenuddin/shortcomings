const http = require('http');
const https = require('https');
const urlModule = require('url');
const async = require('async');

const TIMEOUT = 10000; // 10 seconds timeout

const stringIsAValidUrl = (s, protocols) => {
  try {
    const url = new urlModule.URL(s);
    return protocols
      ? protocols.map(x => `${x.toLowerCase()}:`).includes(url.protocol)
      : true;
  } catch (err) {
    console.log('URL Error:', s, err);
    return false;
  }
};

// Function to fetch the title async with a callback
const getTitleOfWebPage = (webaddress, callbackFunc, maxRedirects = 5) => {
  if (maxRedirects === 0) {
    callbackFunc('Too many redirects');
    return;
  }

  if (!stringIsAValidUrl(webaddress, ['http', 'https'])) {
    console.log("Invalid URL:", webaddress);
    callbackFunc('Invalid URL');
    return;
  }

  console.log(`Fetching: ${webaddress}`);

  const req = https.get(webaddress, (res) => {
    let data = '';

    // Handle redirects
    if ([300, 301, 302].includes(res.statusCode)) {
      console.log("Redirecting...", res.statusCode, res.headers.location);
      getTitleOfWebPage(res.headers.location, callbackFunc, maxRedirects - 1);
      return; // Exit the current request
    }

    if (res.statusCode !== 200 && ![300, 301, 302].includes(res.statusCode)) {
      callbackFunc(`Request failed. Status code: ${res.statusCode}`);
      return;
    }

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const match = data.match(/<title>([^<]*)<\/title>/i);
      if (match && match[1]) {
        callbackFunc(null, match[1]);
      } else {
        callbackFunc('Title not found');
      }
    });
  }).on('error', (err) => {
    callbackFunc(err.message);
  });

  req.setTimeout(TIMEOUT, () => {
    req.abort(); // Abort the request after timeout
    //callbackFunc('Request timed out');
  });
};

// Function to fetch multiple titles using async.each
const getAllTitles = (addresses, callback) => {
  let results = [];

  async.each(
    addresses,
    (address, done) => {
      getTitleOfWebPage(address, (error, title) => {
        if (error) {
          results.push(`<li>${address} - NO RESPONSE (${error})</li>`);
        } else {
          results.push(`<li>${address} - ${title}</li>`);
        }
        done(); // Call done to proceed with the next address
      });
    },
    (err) => {
      if (err) {
        console.log('Error fetching titles:', err);
      }
      callback(results);
    }
  );
};

// Create HTTP server
http.createServer((req, res) => {
  const parsedUrl = urlModule.parse(req.url, true);
  const path = parsedUrl.pathname;

  if (path === '/I/want/title/') {
    const addresses = parsedUrl.query.address;
    if (!addresses) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - No address provided</h1>');
      return;
    }

    let addressArray = Array.isArray(addresses) ? addresses : [addresses];

    getAllTitles(addressArray, (results) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write('<html><head><title>Titles</title></head><body><ul>');
      res.write(results.join(''));
      res.write('</ul></body></html>');
      res.end();
    });

  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1>');
  }
}).listen(4000, () => {
  console.log('Server is listening on port 4000');
});
