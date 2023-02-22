const { JSDOM } = require("jsdom");

// async function crawlPage(baseURL, currentURL, pages) {
//   // if this is an offsite URL, bail immediately
//   const currentUrlObj = new URL(currentURL);
//   const baseUrlObj = new URL(baseURL);
//   if (currentUrlObj.hostname !== baseUrlObj.hostname) {
//     return pages;
//   }

//   const normalizedURL = normalizeURL(currentURL);

//   // if we've already visited this page
//   // just increase the count and don't repeat
//   // the http request
//   if (pages[normalizedURL] > 0) {
//     pages[normalizedURL]++;
//     return pages;
//   }

//   // initialize this page in the map
//   // since it doesn't exist yet
//   pages[normalizedURL] = 1;

//   // fetch and parse the html of the currentURL
//   console.log(`crawling ${currentURL}`);
//   let htmlBody = "";
//   try {
//     const resp = await fetch(currentURL);
//     if (resp.status > 399) {
//       console.log(`Got HTTP error, status code: ${resp.status}`);
//       return pages;
//     }
//     const contentType = resp.headers.get("content-type");
//     if (!contentType.includes("text/html")) {
//       console.log(`Got non-html response: ${contentType}`);
//       return pages;
//     }
//     htmlBody = await resp.text();
//   } catch (err) {
//     console.log(err.message);
//   }

//   const nextURLs = getURLsFromHTML(htmlBody, baseURL);
//   for (const nextURL of nextURLs) {
//     pages = await crawlPage(baseURL, nextURL, pages);
//   }

//   return pages;
// }

async function crawlPage(baseURL, currentURL, pages) {
  // if external link, return
  const baseURLObj = new URL(baseURL);
  const currentURLObj = new URL(currentURL);
  if (baseURLObj.hostname !== currentURLObj.hostname) {
    return pages;
  }

  // if current page already crawled, return
  const normalizedCurrentURL = normalizeURL(currentURL);
  if (pages[normalizedCurrentURL] > 0) {
    pages[normalizedCurrentURL]++;
    return pages;
  }

  // if not, start crawling
  pages[normalizedCurrentURL] = 1;
  console.log(`actively crawling: ${currentURL}`);
  let htmlBody = "";
  try {
    const resp = await fetch(currentURL);
    if (resp.status > 399) {
      console.log(
        `Error in fetch with status code ${resp.status} on page ${currentURL}`
      );
      return pages;
    }

    const contentType = resp.headers.get("content-type");
    if (!contentType.includes("text/html")) {
      console.log(
        `Non-html response, content type: ${contentType} on page ${currentURL}`
      );
      return pages;
    }

    htmlBody = await resp.text();
  } catch (err) {
    console.log(`Error in fetch: ${err.message}, on page:${currentURL}`);
  }

  // recursively crawl the web

  const nextURLs = getURLsFromHTML(htmlBody, baseURL);

  for (const nextURL of nextURLs) {
    pages = await crawlPage(baseURL, nextURL, pages);
  }

  return pages;
}

function getURLsFromHTML(htmlBody, baseURL) {
  const urls = [];
  const dom = new JSDOM(htmlBody);
  const linkElements = dom.window.document.querySelectorAll("a");
  for (const linkElement of linkElements) {
    if (linkElement.href.slice(0, 1) === "/") {
      //reltaive
      try {
        const urlObj = new URL(`${baseURL}${linkElement.href}`);
        urls.push(urlObj.href);
      } catch (err) {
        console.log(`Error with relative url: ${err.message}`);
      }
    } else {
      //absolute
      try {
        const urlObj = new URL(linkElement.href);
        urls.push(urlObj.href);
      } catch (err) {
        console.log(`Error with absolute url: ${err.message}`);
      }
    }
  }

  return urls;
}

function normalizeURL(urlString) {
  const urlObj = new URL(urlString);

  const hostPath = `${urlObj.hostname}${urlObj.pathname}`;
  if (hostPath.length > 0 && hostPath.slice(-1) === "/") {
    return hostPath.slice(0, -1);
  }
  return hostPath;
}

module.exports = {
  normalizeURL,
  getURLsFromHTML,
  crawlPage,
};
