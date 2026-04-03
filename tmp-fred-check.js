const ids = ['NAPM','NAPMFG','ISMFG','ISM','PMI','PMI_MAN','PMI_MANUFACTURING','IMPM','ISM_MANUFACTURING','ISM_MAN','ISM_NAPM','PMI_US','PMI_US_MAN','ISM_US','ISM_IND','ISM_PMI','ISM_MAN_PMI','ISMFG', 'ISM/PMI'];
const key = 'e12ea99978090833970a0d8e100a2ece';
const fetch = globalThis.fetch || require('node-fetch');
(async()=>{
  for(const id of ids){
    const url = 'https://api.stlouisfed.org/fred/series/observations?series_id=' + encodeURIComponent(id) + '&api_key=' + key + '&limit=1&sort_order=desc&file_type=json';
    try{
      const res = await fetch(url);
      const data = await res.json();
      console.log(id, res.status, JSON.stringify(data).slice(0,120));
    }catch(e){
      console.log(id, 'ERR', e.message);
    }
  }
})();
