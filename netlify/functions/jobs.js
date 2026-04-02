export default async (req, context) => {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const apiUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`;

  let rawText = '';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': 'jobboerse-app-v1',
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
      // Return debug info so we can see what the BA API actually sent back
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

export const config = { path: '/api/jobs' };