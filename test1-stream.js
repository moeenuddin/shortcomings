const http = require('http');

// List of 25 URLs (some good, some bad)
const urlList = [
  'https://www.google.com',
  'https://www.github.com',
  'https://www.stackoverflow.com',
  'https://www.example.com',
  'https://www.npmjs.com',
  'https://www.microsoft.com',
  'https://www.linkedin.com',
  'https://www.apple.com',
  'https://www.medium.com',
  'https://www.cnn.com',
  'https://www.fakeurl12345.com',   // bad URL
  'https://www.nonexistenturl.xyz', // bad URL
  'https://www.twitter.com',
  'https://www.facebook.com',
  'https://www.reddit.com',
  'https://www.quora.com',
  'https://www.wikipedia.org',
  'https://www.mozilla.org',
  'https://www.nonexistent-site.com', // bad URL
  'https://www.doesnotexist123.com',  // bad URL
  'https://www.netflix.com',
  'https://www.amazon.com',
  'https://www.bing.com',
  'https://www.yahoo.com',
  'https://www.spotify.com'
];

// Function to create the query string from the URL list
const createQueryString = (urlList) => {
  return urlList.map((webAddress) => `address=${(webAddress)}`).join('&');
};

// Function to call the service with multiple addresses appended
const testServiceWithUrls = (urlList) => {
  const queryString = createQueryString(urlList);
  const serviceUrl = `http://localhost:4000/fetch-titles?${queryString}`; // Adjust service URL/port if needed
  console.log(serviceUrl);
  http.get(serviceUrl, (res) => {
    let data = '';

    // Collect the response data
    res.on('data', (chunk) => {
      data += chunk;
    });

    // When the response ends, log the result
    res.on('end', () => {
      console.log(`Response for URLs:\n`, data);
    });

  }).on('error', (err) => {
    console.log(`Error:`, err.message);
  });
};

// Call the function to test the service
testServiceWithUrls(urlList);
