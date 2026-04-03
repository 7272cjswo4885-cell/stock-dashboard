const queries = ['ISM Manufacturing PMI','ISM Non-Manufacturing PMI','ISM Services PMI','High Yield Spread','BAMLH0A0HYM2','VIXCLS','S&P 500 earnings yield','earnings yield','SP500 P/E','SP500 earnings'];
const key = 'e12ea99978090833970a0d8e100a2ece';
const fetch = globalThis.fetch || require('node-fetch');
async function run(){
  for(const q of queries){
    const url = 'https://api.stlouisfed.org/fred/series/search?search_text=' + encodeURIComponent(q) + '&api_key=' + key + '&limit=10&order_by=search_rank&file_type=json';
    const res = await fetch(url);
    const data = await res.json();
    console.log('QUERY', q, 'COUNT', data.count);
    if (Array.isArray(data.seriest)) {
      data.seriest.slice(0,5).forEach(s=>console.log(' ', s.id, s.title));
    }
  }
}
run().catch(e=>{ console.error(e); process.exit(1); });
