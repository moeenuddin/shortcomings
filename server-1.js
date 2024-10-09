const http = require('http');
const https = require('https');
const urlModule = require('url');
//const {url,URL = require('url');

const stringIsAValidUrl = (s, protocols) => {
    try {
      console.log('URL:',s);
        const url = new urlModule.URL(s);
        return protocols
            ? url.protocol
                ? protocols.map(x => `${x.toLowerCase()}:`).includes(url.protocol)
                : false
            : true;
    } catch (err) {
      console.log('URL Error',s,err);
        return false;
    }
};

// Function to fetch the title async with a callback
const getTitleOfWebPage = (webaddress, callbackFunc, maxRedirects = 5) => {
  // terminal for maxRedirect logic
  if (maxRedirects === 0) {
    callback('Too many redirects');
    return;
  }

  // Check if the web address starts with http or https
  // it turns out that urls needs to be checked for the validity

  //if (!webaddress.includes('https') && !webaddress.includes('http')) {
    //callbackFunc('Invalid URL');
    if(!stringIsAValidUrl(webaddress,['http','https'])){
      console.log("inside: [stringIsAValidUrl]",webaddress)
      callbackFunc('Invalid URL');
      return;
    }
    //return;
  //}

  https.get(webaddress, (res) => {
    let data = '';

    console.log(res.headers.location);

    // test list i choose many has redirects, so they need to be set again for the another fetch

    if(res.statusCode==300 || res.statusCode==301 || res.statusCode==302){

      console.log("... Redirecting..", res.statusCode);
      console.log("...Location..", res.statusCode);
      getTitleOfWebPage(res.headers.location,callbackFunc, maxRedirects-1);

      return;
    }

    if (res.statusCode !== 200) {
      callbackFunc(`Request failed. Status code: ${res.statusCode}`);
      return;
    }

    res.on('data', (chunk) => {
      data += chunk;
      console.log('reving data...');
    });

    res.on('end', () => {
      console.log('rcving has ended');
      const match = data.match(/<title>([^<]*)<\/title>/i);
      //console.log("Matched title: ",match[0]);
      console.log(res.statusCode);
      console.log('redirect location:',res.location);
      if (match && match[1]) {
        callbackFunc(null, match[1]);
      } else {
        callbackFunc('Title not found');
      }
    });
  }).on('error', (err) => {
    console.log(".... error",webaddress);
    callbackFunc(err.message);
  });
};

// Function to fetch multiple titles and call back when all are done
const getAllTitles = (addresses, callback) => {
  let results = [];
  let completedRequests = 0;

  addresses.forEach((address, index) => {
    getTitleOfWebPage(address, (error, title) => {
      if (error) {
        results[index] = `<li>${address} - NO RESPONSE (${error})</li>`;
      } else {
        results[index] = `<li>${address} - ${title}</li>`;
      }

      completedRequests++;

      // When all requests are done, call the final callback
      if (completedRequests === addresses.length) {
        callback(results);
      }
    });
  });
};

// Create HTTP server
http.createServer((req, res) => {
  const parsedUrl = urlModule.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Handle the "/I/want/title/" route
  if (path === '/I/want/title/') {
    const addresses = parsedUrl.query.address;
    if (!addresses) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - No address provided</h1>');
      return;
    }

    let addressArray = Array.isArray(addresses) ? addresses : [addresses];

    // Fetch titles for all provided addresses
    getAllTitles(addressArray, (results) => {
      // Construct the HTML response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write('<html><head><title>Titles</title></head><body><ul>');
      res.write(results.join(''));
      res.write('</ul></body></html>');
      res.end();
    });

  } else {
    // Handle 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1>');
  }
}).listen(4000, () => {
  console.log('Server is listening on port 4000');
});
