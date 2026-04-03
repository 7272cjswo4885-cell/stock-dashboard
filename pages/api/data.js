// pages/api/data.js
// 사이트 접속 시 이 파일이 실데이터를 가져와요

const FRED_DEFAULT = "e12ea99978090833970a0d8e100a2ece";
const AV_DEFAULT   = "SXXY13T2V7VDIJOF";
const rawFRED      = process.env.NEXT_PUBLIC_FRED_KEY?.trim();
const rawAV        = process.env.NEXT_PUBLIC_AV_KEY?.trim();

const FRED = /^[a-z0-9]{32}$/.test(rawFRED || "") ? rawFRED : FRED_DEFAULT;
const AV   = /^[A-Z0-9]{16}$/.test(rawAV || "") ? rawAV : AV_DEFAULT;

if (rawFRED && rawFRED !== FRED) {
  console.warn("NEXT_PUBLIC_FRED_KEY가 유효하지 않습니다. 기본 FRED 키를 사용합니다.");
}
if (rawAV && rawAV !== AV) {
  console.warn("NEXT_PUBLIC_AV_KEY가 유효하지 않습니다. 기본 Alpha Vantage 키를 사용합니다.");
}

export default async function handler(req, res) {
  try {
    const defaultHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    };

    const fetchJson = async (url, init = {}) => {
      const response = await fetch(url, { ...init, headers: { ...defaultHeaders, ...(init.headers || {}) } });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(`${url} returned ${response.status}`);
      }
      return json;
    };

    const fetchText = async (url, init = {}) => {
      const response = await fetch(url, { ...init, headers: { ...defaultHeaders, ...(init.headers || {}) } });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${url} returned ${response.status}`);
      }
      return text;
    };

    const result = {};

    const fetchFredObservations = async (seriesId, limit = 1) => {
      const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED}&limit=${limit}&sort_order=desc&file_type=json`;
      const payload = await fetchJson(fredUrl);
      return payload?.observations || [];
    };

    const fetchFredSeries = async (seriesId) => {
      return (await fetchFredObservations(seriesId, 1))[0];
    };

    const fetchYahooQuote = async (symbol) => {
      const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`, {
        headers: {
          ...defaultHeaders,
          "Accept": "application/json,text/plain,*/*",
        },
      });
      const json = await response.json();
      if (!response.ok || !json?.quoteResponse?.result?.length) {
        throw new Error(`Yahoo quote API ${symbol} returned ${response.status}`);
      }
      return json.quoteResponse.result[0];
    };

    try {
      const fearGreed = await fetchJson("https://api.alternative.me/fng/?limit=1");
      const fearValue = parseInt(fearGreed?.data?.[0]?.value);
      if (!Number.isNaN(fearValue)) {
        result.fear_greed = fearValue;
      }
    } catch (innerError) {
      console.warn("fearGreed fetch failed:", innerError.message);
    }

    if (FRED) {
      let yield10y = null;

      try {
        const fredRates = await fetchFredSeries("DGS10");
        const rateValue = parseFloat(fredRates?.value);
        if (!Number.isNaN(rateValue)) {
          result.yield_10y = rateValue;
          yield10y = rateValue;
        }
      } catch (innerError) {
        console.warn("yield_10y fetch failed:", innerError.message);
      }

      try {
        const fred2y = await fetchFredSeries("DGS2");
        const rateValue = parseFloat(fred2y?.value);
        if (!Number.isNaN(rateValue) && yield10y != null) {
          result.yield_spread = parseFloat((yield10y - rateValue).toFixed(2));
        }
      } catch (innerError) {
        console.warn("yield_spread fetch failed:", innerError.message);
      }

      try {
        const fredVix = await fetchFredSeries("VIXCLS");
        const vixValue = parseFloat(fredVix?.value);
        if (!Number.isNaN(vixValue)) {
          result.vix = vixValue;
        }
      } catch (innerError) {
        console.warn("vix fetch failed:", innerError.message);
      }

      try {
        // AAII 데이터는 동적 로드되어 정규식으로 가져오기 어려움
        // 임시로 최신 값 설정 (실제로는 수동 업데이트 필요)
        result.aaii_bull = 33.6;
      } catch (innerError) {
        console.warn("aaii_bull fetch failed:", innerError.message);
      }

      try {
        const fredFedBs = await fetchFredSeries("WALCL");
        const fedBsValue = parseFloat(fredFedBs?.value);
        if (!Number.isNaN(fedBsValue)) {
          result.fed_bs = parseFloat((fedBsValue / 1000000).toFixed(2));
        }
      } catch (innerError) {
        console.warn("fed_bs fetch failed:", innerError.message);
      }

      try {
        let dxyValue = null;
        try {
          const yahooDxy = await fetchYahooQuote("DX-Y.NYB");
          dxyValue = parseFloat(yahooDxy.regularMarketPrice);
        } catch (innerError) {
          console.warn("dxy yahoo fetch failed:", innerError.message);
        }
        if (Number.isNaN(dxyValue) || dxyValue == null) {
          const fredDxy = await fetchFredSeries("DTWEXBGS");
          dxyValue = parseFloat(fredDxy?.value);
        }
        if (!Number.isNaN(dxyValue)) {
          result.dxy = parseFloat(dxyValue.toFixed(2));
        }
      } catch (innerError) {
        console.warn("dxy fetch failed:", innerError.message);
      }

      try {
        const fredOil = await fetchFredSeries("DCOILWTICO");
        const oilValue = parseFloat(fredOil?.value);
        if (!Number.isNaN(oilValue)) {
          result.oil_wti = parseFloat(oilValue.toFixed(2));
        }
      } catch (innerError) {
        console.warn("oil_wti fetch failed:", innerError.message);
      }

      try {
        const m2History = await fetchFredObservations("M2SL", 13);
        const m2Latest = parseFloat(m2History?.[0]?.value);
        const m2YearAgo = parseFloat(m2History?.[12]?.value);
        if (!Number.isNaN(m2Latest) && !Number.isNaN(m2YearAgo) && m2YearAgo !== 0) {
          result.m2_growth = parseFloat(((m2Latest - m2YearAgo) / m2YearAgo * 100).toFixed(1));
        }
      } catch (innerError) {
        console.warn("m2_growth fetch failed:", innerError.message);
      }

      try {
        const cpiHistory = await fetchFredObservations("CPIAUCSL", 13);
        const cpiLatest = parseFloat(cpiHistory?.[0]?.value);
        const cpiYearAgo = parseFloat(cpiHistory?.[12]?.value);
        if (!Number.isNaN(cpiLatest) && !Number.isNaN(cpiYearAgo) && cpiYearAgo !== 0) {
          result.cpi = parseFloat(((cpiLatest - cpiYearAgo) / cpiYearAgo * 100).toFixed(1));
        }
      } catch (innerError) {
        console.warn("cpi fetch failed:", innerError.message);
      }

      try {
        const fredCredit = await fetchFredSeries("BAMLH0A0HYM2");
        const creditValue = parseFloat(fredCredit?.value);
        if (!Number.isNaN(creditValue)) {
          result.credit_spread = parseFloat(creditValue.toFixed(2));
        }
      } catch (innerError) {
        console.warn("credit_spread fetch failed:", innerError.message);
      }

      try {
        const fredEY = await fetchFredSeries("Q13051USQ156NNBR");
        const eyValue = parseFloat(fredEY?.value);
        if (!Number.isNaN(eyValue) && yield10y != null) {
          result.yield_gap = parseFloat((eyValue - yield10y).toFixed(2));
        }
      } catch (innerError) {
        console.warn("yield_gap fetch failed:", innerError.message);
      }

      try {
        const coreCpiHistory = await fetchFredObservations("CPILFESL", 13);
        const coreCpiLatest = parseFloat(coreCpiHistory?.[0]?.value);
        const coreCpiYearAgo = parseFloat(coreCpiHistory?.[12]?.value);
        if (!Number.isNaN(coreCpiLatest) && !Number.isNaN(coreCpiYearAgo) && coreCpiYearAgo !== 0) {
          result.core_cpi = parseFloat(((coreCpiLatest - coreCpiYearAgo) / coreCpiYearAgo * 100).toFixed(1));
        }
      } catch (innerError) {
        console.warn("core_cpi fetch failed:", innerError.message);
      }

      try {
        const fredGDP = await fetchFredSeries("A191RL1Q225SBEA");
        const gdpValue = parseFloat(fredGDP?.value);
        if (!Number.isNaN(gdpValue)) {
          result.gdp_growth = parseFloat(gdpValue.toFixed(1));
        }
      } catch (innerError) {
        console.warn("gdp_growth fetch failed:", innerError.message);
      }

      try {
        const ismHtml = await fetchText("https://tradingeconomics.com/united-states/manufacturing-pmi");
        const ismMatch = ismHtml.match(/ISM Manufacturing PMI[^0-9]*(\d{1,2}(?:\.\d+)?)/i) || ismHtml.match(/S&P Global US Manufacturing PMI held at\s*([0-9]{1,2}(?:\.\d+)?)/i);
        const ismManufacturing = ismMatch ? parseFloat(ismMatch[1]) : NaN;
        if (!Number.isNaN(ismManufacturing)) {
          result.ism_pmi = parseFloat(ismManufacturing.toFixed(1));
        }
      } catch (innerError) {
        console.warn("ism_pmi fetch failed:", innerError.message);
      }

      try {
        const ismServicesHtml = await fetchText("https://tradingeconomics.com/united-states/services-pmi");
        const ismServicesMatch = ismServicesHtml.match(/Services PMI[^0-9]*(\d{1,2}(?:\.\d+)?)/i) || ismServicesHtml.match(/US Services PMI (?:fell to|rose to|climbed to|held at)\s*([0-9]{1,2}(?:\.\d+)?)/i);
        const ismServices = ismServicesMatch ? parseFloat(ismServicesMatch[1]) : NaN;
        if (!Number.isNaN(ismServices)) {
          result.ism_services = parseFloat(ismServices.toFixed(1));
        }
      } catch (innerError) {
        console.warn("ism_services fetch failed:", innerError.message);
      }

      try {
        const fredUnemp = await fetchFredSeries("UNRATE");
        const unempValue = parseFloat(fredUnemp?.value);
        if (!Number.isNaN(unempValue)) {
          result.unemployment = parseFloat(unempValue.toFixed(1));
        }
      } catch (innerError) {
        console.warn("unemployment fetch failed:", innerError.message);
      }

      try {
        const fredClaims = await fetchFredSeries("ICSA");
        const claimsValue = parseFloat(fredClaims?.value);
        if (!Number.isNaN(claimsValue)) {
          result.jobless_claims = parseFloat((claimsValue / 1000).toFixed(1));
        }
      } catch (innerError) {
        console.warn("jobless_claims fetch failed:", innerError.message);
      }

      try {
        const fredJolts = await fetchFredSeries("JTSJOL");
        const joltsValue = parseFloat(fredJolts?.value);
        if (!Number.isNaN(joltsValue)) {
          // JTSJOL은 천 건 단위이므로, 만 건으로 변환하려면 /10
          result.jolts = parseFloat((joltsValue / 10).toFixed(1));
        }
      } catch (innerError) {
        console.warn("jolts fetch failed:", innerError.message);
      }

      try {
        const fredSox = await fetchFredSeries("NASDAQSOX");
        const soxValue = parseFloat(fredSox?.value);
        if (!Number.isNaN(soxValue)) {
          result.sox_index = parseFloat(soxValue.toFixed(0));
        }
      } catch (innerError) {
        console.warn("sox_index fetch failed:", innerError.message);
      }

      try {
        const fredDj = await fetchFredSeries("DJTA");
        const djValue = parseFloat(fredDj?.value);
        if (!Number.isNaN(djValue)) {
          result.dj_transport = parseFloat(djValue.toFixed(0));
        }
      } catch (innerError) {
        console.warn("dj_transport fetch failed:", innerError.message);
      }

      // 52주 신저가 비율 (임시 값 - 실제로는 나스닥 전체 종목 스캔 필요)
      try {
        // 실제로는 외부 API나 계산 필요, 임시로 5% 설정
        result.new_lows = 5;
      } catch (innerError) {
        console.warn("new_lows fetch failed:", innerError.message);
      }

      try {
        let rutPrice = null;
        let nasPrice = null;
        try {
          // Use chart API instead of quote API for indices
          const rutChart = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/^RUT?range=1d&interval=1d`);
          rutPrice = parseFloat(rutChart?.chart?.result?.[0]?.meta?.regularMarketPrice);
        } catch (innerError) {
          console.warn("russell_ratio rut fetch failed:", innerError.message);
        }
        try {
          const nasChart = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/^IXIC?range=1d&interval=1d`);
          nasPrice = parseFloat(nasChart?.chart?.result?.[0]?.meta?.regularMarketPrice);
        } catch (innerError) {
          console.warn("russell_ratio nasdaq fetch failed:", innerError.message);
        }
        if (!Number.isNaN(rutPrice) && !Number.isNaN(nasPrice) && nasPrice !== 0) {
          result.russell_ratio = parseFloat((rutPrice / nasPrice).toFixed(3));
        }
      } catch (innerError) {
        console.warn("russell_ratio fetch failed:", innerError.message);
      }
    } else {
      console.warn("FRED API key is missing; skipping FRED-based fields.");
    }

    if (Object.keys(result).length === 0) {
      throw new Error("실데이터를 가져오지 못했습니다. API 키 또는 외부 API 연결을 확인하세요.");
    }

    res.status(200).json(result);

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}