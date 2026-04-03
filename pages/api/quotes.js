// pages/api/quotes.js
// 주식/ETF 실시간 시세 및 1년 히스토리를 가져옵니다.

const fetchSymbol = async (symbol) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&includePrePost=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Yahoo chart API ${symbol} returned ${response.status}`);
  }
  return response.json();
};

export default async function handler(req, res) {
  try {
    const symbols = req.query.symbols;
    if (!symbols) {
      return res.status(400).json({ error: "symbols 쿼리 파라미터가 필요합니다." });
    }

    const symbolList = String(symbols).split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!symbolList.length) {
      return res.status(400).json({ error: "유효한 symbols 값이 필요합니다." });
    }

    const quotes = {};

    await Promise.all(symbolList.map(async (symbol) => {
      try {
        const json = await fetchSymbol(symbol);
        const item = json?.chart?.result?.[0];
        if (!item?.meta) return;

        const closes = item?.indicators?.quote?.[0]?.close || [];
        const volumes = item?.indicators?.quote?.[0]?.volume || [];
        const timestamps = item?.timestamp || [];
        const history = [];
        const validVolumes = [];

        for (let i = 0; i < timestamps.length; i += 1) {
          const price = closes[i];
          const volume = volumes[i];
          if (typeof price === "number") {
            history.push({
              date: new Date(timestamps[i] * 1000).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }),
              price: Math.round(price * 100) / 100,
              volume: typeof volume === "number" ? volume : undefined,
            });
          }
          if (typeof volume === "number") {
            validVolumes.push(volume);
          }
        }

        const avgVolume = validVolumes.length ? Math.round(validVolumes.slice(-20).reduce((a, b) => a + b, 0) / validVolumes.slice(-20).length) : undefined;

        quotes[symbol] = {
          symbol,
          price: typeof item.meta?.regularMarketPrice === "number" ? item.meta.regularMarketPrice : history[history.length - 1]?.price,
          high52: typeof item.meta?.fiftyTwoWeekHigh === "number" ? item.meta.fiftyTwoWeekHigh : Math.max(...history.map(h => h.price)),
          low52: typeof item.meta?.fiftyTwoWeekLow === "number" ? item.meta.fiftyTwoWeekLow : Math.min(...history.map(h => h.price)),
          previousClose: typeof item.meta?.chartPreviousClose === "number" ? item.meta.chartPreviousClose : undefined,
          volume: typeof item.meta?.regularMarketVolume === "number" ? item.meta.regularMarketVolume : validVolumes[validVolumes.length - 1],
          avgVolume,
          currency: item.meta?.currency,
          history,
        };
      } catch (innerError) {
        console.warn(`quote fetch failed for ${symbol}:`, innerError.message);
      }
    }));

    res.status(200).json({ quotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
