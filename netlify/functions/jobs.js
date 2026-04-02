export default async (req, context) => {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const apiUrl = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`;

  const response = await fetch(apiUrl, {
    headers: {
      'X-API-Key': 'jobboerse-app-v1',
      'User-Agent': 'Jobsuche/2.9.2 (de.arbeitsagentur.jobboerse; build:1077; iOS 15.1.0) Alamofire/5.4.4',
    }
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

export const config = { path: '/api/jobs' };
