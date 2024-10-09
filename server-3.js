const http = require('http');
const https = require('https');
const url = require('url');



// Function to fetch the title from a given address
const fetchTitle = (address) => {
  return new Promise((resolve) => {
    try {
      // Parse the URL to extract protocol and hostname
      let parsedUrl = url.parse(address.startsWith('http') ? address : 'http://' + address);
      
      // Select the appropriate module based on the protocol
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      if (!parsedUrl.protocol) {
        // If the protocol is missing or invalid, return an error message
        resolve(`<li>${address} - INVALID PROTOCOL</li>`);
        return;
      }

      // Make the HTTP or HTTPS request
      protocol.get(parsedUrl.href, (res) => {
        let data = '';

        // Collect the data chunks
        res.on('data', (chunk) => {
          data += chunk;
        });

        // Once all data is received
        res.on('end', () => {
          // Extract the title from the HTML
          const match = data.match(/<title>([^<]*)<\/title>/);
          if (match && match[1]) {
            resolve(`<li>${address} - ${match[1]}</li>`);
          } else {
            //console.log(data);
            resolve(`<li>${address} - NO RESPONSE</li>`);

          }
        });
      }).on('error', () => {
        resolve(`<li>${address} - NO RESPONSE</li>`);
      });
    } catch (err) {
      // Handle any unexpected errors
      resolve(`<li>${address} - ERROR: ${err.message}</li>`);
    }
  });
};



// function to fetch the title async

const getTitleOfWebPage = (webaddress) => {

  // validate webaddress is well formed
  // http or https is appended
  //
  if(webaddress.includes('https')||webaddress.includes('http')){
    const purl = new URL(webaddress).parsedUrl
    console.log(purl);
  }

  return new Promise((resolve,rejects)=>{
try {
  https.get(webaddress,(req,res)=>{

    let data = '';

    // rcving event
    res.on('data',(chunk)=>{ 
      data+=chunk;}
      );
    // end event
    res.on("end",()=>{

      const match = data.match(/<title>([^<]*)<\/title>/i);
        if (match && match[1]) {
          resolve(match[1]); // Resolve promise with title
        } else {
          reject('Title not found');
        }

    });

  }// call back function
  );

}catch(err){
 
  console.log(err);
}

  }// executor function
  );

};


// Create HTTP server
http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
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
    const titlePromises = addressArray.map(fetchTitle);
    const titles = await Promise.all(titlePromises);

    // Construct the HTML response
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<html><head><title>Titles</title></head><body><ul>');
    titles.forEach(title => res.write(title));
    res.write('</ul></body></html>');
    res.end();
  } else {
    // Handle 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1>');
  }
}).listen(4000, () => {
  console.log('Server is listening on port 3000');
});
