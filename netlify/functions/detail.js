/**
 * Netlify serverless function: proxy for the BA job detail endpoint.
 *
 * The BA API requires the job reference number (refnr) to be Base64-encoded
 * in the URL path. This function handles that encoding and forwards the request,
 * keeping the API key off the client side.
 *
 * Route: GET /api/detail?refnr=<refnr>
 * Returns: full job detail JSON, including `stellenangebotsBeschreibung`
 */
export default async (req, context) => {
  const url = new URL(req.url);
  const refnr = url.searchParams.get('refnr');

  // Guard: refnr is required
  if (!refnr) {
    return new Response(JSON.stringify({ error: 'Missing refnr parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // The BA API expects the refnr Base64-encoded in the URL path.
  // btoa() is available in modern Node/Netlify Edge runtimes.
  const encoded = btoa(refnr);
  const apiUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobdetails/${encoded}`;

  let rawText = '';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': 'jobboerse-jobsuche',
        'User-Agent': 'Jobsuche/2.9.2 (de.arbeitsagentur.jobboerse; build:1077; iOS 15.1.0) Alamofire/5.4.4',
        'Accept': 'application/json',
        'Accept-Language': 'de-DE,de;q=0.9',
      }
    });

    rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      return new Response(JSON.stringify({
        error: 'BA API returned non-JSON response',
        status: response.status,
        statusText: response.statusText,
        body: rawText.slice(0, 500),
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Proxy fetch failed',
      message: err.message,
      raw: rawText.slice(0, 500),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/detail' };
