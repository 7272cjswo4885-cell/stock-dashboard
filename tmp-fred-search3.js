const queries = ['NAPM','ISM','ISM Manufacturing','ISM PMI','ISM NAPM','ISM Services','ISM Non-Manufacturing','SP500 PE ratio','SP500 earnings yield','SP500 P/E','SP500'];
const key = 'e12ea99978090833970a0d8e100a2ece';
const fetch = globalThis.fetch || require('node-fetch');
async function run(){
  for(const q of queries){
    const url = 'https://api.stlouisfed.org/fred/series/search?search_text=' + encodeURIComponent(q) + '&api_key=' + key + '&limit=10&order_by=search_rank&file_type=json';
    const res = await fetch(url);
    const data = await res.json();
    console.log('QUERY', q, 'COUNT', data.count);
    if (Array.isArray(data.seriest)) {
      data.seriest.slice(0,10).forEach(s=>console.log(' ', s.id, s.title));
    }
  }
}
run().catch(e=>{ console.error(e); process.exit(1); });
