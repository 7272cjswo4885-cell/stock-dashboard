const fetch = globalThis.fetch || require('node-fetch');
(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/data');
    const txt = await res.text();
    console.log('LOCAL', res.status, txt);
  } catch (e) {
    console.error('LOCAL ERR', e.message);
  }
  const key = 'e12ea99978090833970a0d8e100a2ece';
  const urls = [
    'https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=' + key + '&limit=1&sort_order=desc&file_type=json',
    'https://api.stlouisfed.org/fred/series/observations?series_id=M2SL&api_key=' + key + '&limit=13&sort_order=desc&file_type=json',
    'https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=' + key + '&limit=13&sort_order=desc&file_type=json',
    'https://api.stlouisfed.org/fred/series/observations?series_id=VIXCLS&api_key=' + key + '&limit=1&sort_order=desc&file_type=json',
    'https://api.stlouisfed.org/fred/series/observations?series_id=BAMLH0A0HYM2&api_key=' + key + '&limit=1&sort_order=desc&file_type=json'
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u);
      const j = await r.json();
      console.log('FRED', u, 'STATUS', r.status, JSON.stringify(j).slice(0,320));
    } catch (e) {
      console.error('FRED ERR', u, e.message);
    }
  }
})();
