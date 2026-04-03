const ids = ['SP500PE','SP500EARN','SP500EARNY','SP500PE10','SP500_P_E','SP500EY','PE','EARNINGSYIELD','SIGMA','ISM','ISM_MFG','ISM_MAN_PMI','ISMMS','ISM/MAN_PMI','ISM/PMI'];
const fetch = globalThis.fetch || require('node-fetch');
async function run(){
  for(const id of ids){
    const url = 'https://fred.stlouisfed.org/series/' + id;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(id, res.status);
    } catch(e) {
      console.error(id, e.message);
    }
  }
}
run().catch(e=>{ console.error(e); process.exit(1); });
