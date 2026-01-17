const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const URL = 'https://slingshotsports.com/en-eu/products/ufo-v3';

async function verify() {
    console.log(`Checking: ${URL}`);
    const response = await fetch(URL);
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const videos = new Set();

    // IFRAMES
    doc.querySelectorAll('iframe').forEach(iframe => {
        if (iframe.src && (iframe.src.includes('youtube') || iframe.src.includes('youtu.be'))) {
            videos.add(iframe.src);
        }
    });

    // LINKS
    doc.querySelectorAll('a').forEach(a => {
        if (a.href && (a.href.includes('youtube.com') || a.href.includes('youtu.be'))) {
            // Filter out the common social link
            if (!a.href.includes('/user/slingshotsports')) {
                videos.add(a.href);
            }
        }
    });

    console.log('Videos found:', Array.from(videos));
}

verify();
