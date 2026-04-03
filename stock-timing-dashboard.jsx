import { useState, useRef, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── 종목 목록 ───────────────────────────────────────────────────
const DEFAULT_STOCKS = [
  { id:"QQQM", label:"나스닥 ETF",  color:"#00d4ff", icon:"◈" },
  { id:"NVDA", label:"엔비디아",    color:"#76b900", icon:"◆" },
  { id:"AAPL", label:"애플",        color:"#a8a8a8", icon:"◉" },
  { id:"GOOGL",label:"구글",        color:"#fbbc04", icon:"◎" },
  { id:"META", label:"메타",        color:"#0082fb", icon:"◐" },
  { id:"TSLA", label:"테슬라",      color:"#e82127", icon:"◑" },
];
const STOCK_DB = [
  {id:"QQQM",label:"나스닥100 ETF",type:"ETF"},{id:"QQQ",label:"나스닥100 ETF(대형)",type:"ETF"},
  {id:"SPY",label:"S&P500 ETF",type:"ETF"},{id:"VOO",label:"뱅가드 S&P500",type:"ETF"},
  {id:"SCHD",label:"배당성장 ETF",type:"ETF"},{id:"SOXX",label:"반도체 ETF",type:"ETF"},
  {id:"ARKK",label:"ARK 이노베이션",type:"ETF"},{id:"VTI",label:"뱅가드 전체시장",type:"ETF"},
  {id:"NVDA",label:"엔비디아",type:"주식"},{id:"AAPL",label:"애플",type:"주식"},
  {id:"GOOGL",label:"구글(알파벳)",type:"주식"},{id:"META",label:"메타",type:"주식"},
  {id:"TSLA",label:"테슬라",type:"주식"},{id:"MSFT",label:"마이크로소프트",type:"주식"},
  {id:"AMZN",label:"아마존",type:"주식"},{id:"AMD",label:"AMD",type:"주식"},
  {id:"NFLX",label:"넷플릭스",type:"주식"},{id:"PLTR",label:"팔란티어",type:"주식"},
  {id:"COIN",label:"코인베이스",type:"주식"},{id:"CRWD",label:"크라우드스트라이크",type:"주식"},
  {id:"AVGO",label:"브로드컴",type:"주식"},{id:"TSM",label:"TSMC",type:"주식"},
  {id:"SMCI",label:"슈퍼마이크로",type:"주식"},{id:"CRM",label:"세일즈포스",type:"주식"},
];
const COLORS=["#00d4ff","#76b900","#a8a8a8","#fbbc04","#0082fb","#e82127","#ff6b6b","#c678dd","#56b6c2","#e5c07b","#98c379","#d19a66","#61afef","#e06c75","#528bff","#ff9a3c"];
const ICONS=["◈","◆","◉","◎","◐","◑","▣","▤","▥","▦","◍","◌","○","●","◔","◕"];

// ─── 지표 설명 (클릭 팝업용) ────────────────────────────────────
const INDICATOR_INFO = {
  // 거시 지표
  fear_greed:    { title:"공포탐욕지수 (Fear & Greed)", body:"CNN이 발표하는 시장 심리 지수. 0~100으로 측정되며 0에 가까울수록 극도의 공포, 100에 가까울수록 극도의 탐욕을 의미합니다.\n\n📌 투자 활용법: '공포에 사고, 탐욕에 팔아라'는 워런 버핏의 명언처럼, 지수가 20 이하 극도의 공포일 때가 역사적으로 최고의 매수 타이밍이었습니다. 75 이상 탐욕 구간에서는 신규 매수를 자제하세요." },
  vix:           { title:"VIX (변동성 지수)", body:"시카고옵션거래소(CBOE)가 발표하는 S&P500의 30일 예상 변동성. '공포 지수'라고도 불립니다.\n\n📌 투자 활용법: VIX 30 이상은 시장 공포가 극대화된 시점으로 역발상 매수 기회입니다. VIX 15 이하는 과도한 안도감 구간으로 조정 가능성을 경계해야 합니다. 2020년 코로나 폭락 시 VIX는 85까지 치솟았습니다." },
  aaii_bull:     { title:"AAII 투자심리 설문 (강세 비율)", body:"미국 개인투자자협회(AAII)가 매주 발표하는 강세(Bullish) 비율. 개인투자자들의 6개월 후 시장 전망을 조사합니다.\n\n📌 투자 활용법: 강세 비율이 25% 미만이면 개인투자자들이 극도로 비관적이라는 뜻으로, 역발상 매수 신호입니다. 역사적으로 이 구간에서 매수 시 수익률이 높았습니다. 반대로 55% 이상이면 과도한 낙관으로 주의가 필요합니다." },
  m2_growth:     { title:"M2 통화량 증가율", body:"연준(Fed)이 발표하는 광의통화량(M2)의 전년 대비 증가율. 시중에 돈이 얼마나 풀리고 있는지를 나타냅니다.\n\n📌 투자 활용법: M2가 빠르게 증가하면 시중 유동성이 늘어 주식시장에 긍정적입니다. 2020~2021년 M2가 폭발적으로 증가하며 나스닥도 급등했습니다. 반대로 M2 감소(마이너스)는 역사적으로 주식시장 하락과 동반했습니다." },
  fed_bs:        { title:"연준 대차대조표 (Fed Balance Sheet)", body:"미국 연방준비은행이 보유한 자산 총액. 채권 매입(QE, 양적완화) 시 늘어나고, 채권 매각(QT, 양적긴축) 시 줄어듭니다.\n\n📌 투자 활용법: 대차대조표가 늘어나는 QE 시기는 시중에 달러가 공급되어 주식·자산 가격이 오르는 경향이 있습니다. 2020년 코로나 이후 연준이 9조 달러까지 대차대조표를 늘리며 나스닥이 3배 급등했습니다. 반대로 QT 시기엔 유동성이 줄어 주가 하락 압력이 생깁니다." },
  credit_spread: { title:"크레딧 스프레드 (High Yield Spread)", body:"정크본드(투기등급 회사채) 금리와 미국 국채 금리의 차이. HYG/LQD 비율로도 측정합니다.\n\n📌 투자 활용법: 크레딧 스프레드가 벌어지면 기업 부도 위험이 높아진다는 뜻으로, 주식시장 하락을 2~4주 앞서 신호를 줍니다. 2008년 금융위기, 2020년 코로나 때 스프레드가 급격히 확대되었습니다. 1.5% 이하는 크레딧 시장 안정을 의미합니다." },
  dxy:           { title:"달러인덱스 (DXY)", body:"유로, 엔, 파운드 등 주요 6개국 통화 대비 달러의 가치를 나타내는 지수. 기준값은 100입니다.\n\n📌 투자 활용법: 달러 강세(DXY 상승)는 일반적으로 위험자산(주식, 원자재)에 부정적입니다. 달러 약세 시 글로벌 유동성이 풍부해져 나스닥 등 위험자산에 우호적입니다. 특히 해외 매출 비중이 높은 빅테크 기업들은 달러 강세 시 환산 실적이 악화됩니다." },
  oil_wti:       { title:"WTI 원유 가격", body:"서부 텍사스산 원유(WTI) 1배럴의 달러 가격. 글로벌 경기의 바로미터 역할을 합니다.\n\n📌 투자 활용법: 유가가 너무 높으면(90달러 이상) 인플레이션 우려가 재점화되어 연준이 금리를 더 올릴 가능성이 있어 주식에 부정적입니다. 반대로 너무 낮으면(65달러 이하) 경기침체 우려를 반영합니다. 적정 구간(60~85달러)이 주식시장에 가장 우호적입니다." },
  yield_10y:     { title:"미국 10년물 국채금리", body:"미국 정부가 발행하는 10년 만기 국채의 연간 수익률. 장기 금리의 기준이자 경기 기대감을 반영합니다.\n\n📌 투자 활용법: 금리가 높을수록 미래 현금흐름의 현재가치가 낮아져 성장주(나스닥)의 밸류에이션이 압박받습니다. 2022년 금리가 0→5%로 치솟으며 나스닥이 -33% 폭락한 것이 대표 사례입니다. 금리 하락(피벗) 신호가 나스닥 반등의 핵심 촉매입니다." },
  yield_gap:     { title:"일드 갭 (Yield Gap)", body:"주식 기대수익률(나스닥 PER의 역수, 예: PER 25 → 4%)에서 10년물 국채금리를 뺀 값.\n\n📌 투자 활용법: 일드 갭이 클수록 채권 대비 주식의 매력이 높습니다. 마이너스가 되면 '굳이 주식 위험을 감수할 필요 없다'는 의미로 주식 매도 압력이 생깁니다. 현재 금리 4.35%에 나스닥 PER 25배면 기대수익률 4%로 일드갭이 마이너스에 가까워 부담스러운 상황입니다." },
  yield_spread:  { title:"장단기 금리차 (10년-2년)", body:"10년물 국채금리와 2년물 국채금리의 차이. 경기침체의 대표적 선행지표입니다.\n\n📌 투자 활용법: 정상적으로는 장기금리>단기금리이나, 이것이 역전(마이너스)되면 금융위기의 전조로 해석됩니다. 1990년 이후 미국의 모든 경기침체는 금리차 역전 후 6~24개월 사이에 발생했습니다. 역전 후 정상화(재역전)되는 시점이 오히려 위험한 시점입니다." },
  new_lows:      { title:"52주 신저가 종목 비율", body:"나스닥 전체 상장 종목 중 52주 신저가를 기록한 종목의 비율.\n\n📌 투자 활용법: 비율이 30% 이상이면 시장 전체가 바닥권임을 의미하는 역발상 매수 신호입니다. 개별 종목이 아닌 시장 전체의 건강도를 측정하는 지표입니다. 반대로 5% 미만이면 대부분 종목이 고점 근처에 있다는 뜻입니다." },
  // 경기사이클
  ism_pmi:       { title:"ISM 제조업 PMI", body:"미국 공급관리협회(ISM)가 매월 발표하는 제조업 구매관리자지수. 제조업체 구매담당자들의 경기 체감을 조사합니다.\n\n📌 투자 활용법: 50이 기준선으로, 50 이상이면 제조업 경기 확장, 이하면 수축을 의미합니다. 주식시장보다 2~3개월 앞서 경기 방향을 알려주는 강력한 선행지표입니다. ISM이 48 이하로 떨어지면 경기침체 가능성이 높아지며 나스닥도 조정받는 경향이 있습니다." },
  ism_services:  { title:"ISM 서비스업 PMI", body:"ISM이 발표하는 서비스업 구매관리자지수. 미국 경제의 80%를 차지하는 서비스업의 경기를 측정합니다.\n\n📌 투자 활용법: 제조업 PMI와 함께 보면 경기 전반을 파악할 수 있습니다. 서비스업 PMI가 50 이상을 유지하면 빅테크 기업들의 광고·클라우드 수요가 견조하다는 신호로 나스닥에 긍정적입니다." },
  unemployment:  { title:"실업률 (Unemployment Rate)", body:"미국 노동부가 매월 발표하는 실업자 비율. 경제 건강도의 핵심 지표입니다.\n\n📌 투자 활용법: 실업률이 낮을수록 소비가 활발하고 기업 실적이 좋아 주식에 긍정적입니다. 다만 실업률이 갑자기 상승하기 시작하면 연준이 금리 인하에 나서는 신호로, 단기적으로는 하락이지만 중장기적으로는 매수 기회가 될 수 있습니다." },
  jobless_claims:{ title:"신규 실업수당 청구건수", body:"매주 발표되는 처음으로 실업급여를 신청한 건수. 고용 시장의 실시간 체온계입니다.\n\n📌 투자 활용법: 주당 25만 건 이하는 고용 시장 건전, 30만 건 이상이면 고용 악화 신호입니다. 4주 이동평균으로 추세를 보는 것이 중요하며, 급격히 증가하는 추세가 나타나면 경기침체 우려가 높아집니다." },
  cpi:           { title:"소비자물가지수 (CPI)", body:"미국 노동부가 발표하는 소비자 물가 상승률. 인플레이션의 대표 지표입니다.\n\n📌 투자 활용법: CPI가 높을수록 연준이 금리를 올릴 가능성이 높아져 나스닥에 부정적입니다. 반대로 CPI가 하락 추세로 접어들면 연준의 금리 인하(피벗)에 대한 기대가 높아져 성장주가 강세를 보입니다. 2022~2023년 CPI 고점 이후 하락 과정에서 나스닥이 급반등했습니다." },
  core_cpi:      { title:"근원 CPI (Core CPI)", body:"식품과 에너지처럼 변동성이 큰 항목을 제외한 소비자물가지수. 연준이 가장 중요하게 보는 인플레이션 지표입니다.\n\n📌 투자 활용법: 연준의 인플레이션 목표는 2%입니다. 근원 CPI가 2%에 가까워질수록 연준이 금리 인하를 고려하게 되어 나스닥에 호재입니다. 식품·에너지 가격의 일시적 충격을 제외하기 때문에 연준의 금리 방향을 예측하는 데 CPI보다 신뢰도가 높습니다." },
  gdp_growth:    { title:"실질 GDP 성장률", body:"미국의 물가 상승분을 제거한 실질 경제 성장률. 분기별로 발표됩니다.\n\n📌 투자 활용법: GDP 성장률이 높을수록 기업 매출과 이익이 늘어 주식에 긍정적입니다. 2분기 연속 마이너스 성장은 기술적 경기침체로 정의됩니다. 성장률이 너무 높으면(4% 이상) 인플레이션 우려로 연준이 금리를 올릴 수도 있습니다." },
  jolts:         { title:"구인건수 (JOLTS)", body:"미국 노동부가 발표하는 잡오프닝(Job Openings and Labor Turnover Survey). 기업들이 채용 중인 일자리 수입니다.\n\n📌 투자 활용법: 구인건수가 많다는 것은 기업들이 인력을 적극 채용하고 있다는 뜻으로 경기 확장 신호입니다. 반대로 구인건수가 빠르게 줄어들기 시작하면 기업들이 채용을 줄이는 초기 경기둔화 신호로 해석됩니다. 연준이 금리 결정 시 참고하는 핵심 지표 중 하나입니다." },
  sox_index:     { title:"필라델피아 반도체지수 (SOX)", body:"필라델피아 거래소의 반도체 관련 30개 기업으로 구성된 지수. 엔비디아, TSMC, AMD 등이 포함됩니다.\n\n📌 투자 활용법: 반도체는 스마트폰, 서버, 자동차 등 전방산업의 수요를 반영하여 경기의 선행지표 역할을 합니다. SOX가 나스닥보다 먼저 오르면 기술주 랠리의 신호, 먼저 빠지면 경고 신호입니다. NVDA, AMD를 보유한 분께 특히 중요한 지표입니다." },
  russell_ratio: { title:"러셀2000 / 나스닥 비율", body:"소형주 지수(러셀2000)를 나스닥으로 나눈 비율. 시장의 위험 선호도를 측정합니다.\n\n📌 투자 활용법: 비율이 상승하면 소형주가 대형주보다 강세로 '리스크온' 환경, 즉 투자자들이 더 많은 위험을 기꺼이 감수하고 있다는 신호입니다. 나스닥 투자자에게는 이 비율이 오를 때 시장 전반의 상승 탄력이 강하다는 신호로 활용할 수 있습니다." },
  dj_transport:  { title:"다우 운송지수 (DJTA)", body:"트럭, 항공, 철도 등 운송 관련 20개 기업으로 구성된 지수. '다우 이론'의 핵심 지표입니다.\n\n📌 투자 활용법: 다우 이론에 따르면 산업지수(다우존스)와 운송지수가 함께 상승해야 진정한 강세장입니다. 물건이 생산되면 운송되어야 하므로, 운송지수는 실물경기의 선행지표입니다. 운송지수가 나스닥보다 먼저 꺾이면 경기 둔화의 경고 신호로 봐야 합니다." },
  // 기술 지표
  rsi:           { title:"RSI (상대강도지수, Relative Strength Index)", body:"14일 동안의 상승폭과 하락폭의 비율로 계산되는 모멘텀 지표. 0~100 사이의 값을 가집니다.\n\n📌 투자 활용법: 30 이하는 과매도(매수 신호), 70 이상은 과매수(매도 신호)입니다. 단, 강한 추세에서는 오랫동안 과매수/과매도 상태가 지속될 수 있으므로 다른 지표와 함께 활용하세요. 적립식 투자자에게는 RSI 35 이하에서 추가 매수하는 전략이 유효합니다." },
  macd:          { title:"MACD (이동평균수렴확산)", body:"12일 지수이동평균에서 26일 지수이동평균을 뺀 값. 추세의 방향과 강도를 측정합니다.\n\n📌 투자 활용법: MACD가 마이너스에서 플러스로 전환(골든크로스)될 때 매수 신호, 반대는 매도 신호입니다. MACD가 음수이면서 점점 0에 가까워지는 것은 하락 모멘텀이 약화되고 있다는 신호로 바닥 형성의 초기 신호일 수 있습니다." },
  bb_pos:        { title:"볼린저밴드 위치 (%B)", body:"현재 가격이 볼린저밴드(20일 이동평균 ±2표준편차) 내에서 어느 위치에 있는지를 나타냅니다. 0%=하단, 100%=상단입니다.\n\n📌 투자 활용법: 20% 이하(하단 근처)는 통계적으로 가격이 평균으로 회귀할 가능성이 높아 매수에 유리합니다. 80% 이상(상단 근처)은 반대로 조정 가능성이 높습니다. 볼린저밴드가 좁아지는 구간(스퀴즈)은 큰 움직임 직전 신호입니다." },
  ma50:          { title:"50일 이동평균선", body:"최근 50거래일의 종가 평균. 중기 추세를 나타내는 지표입니다.\n\n📌 투자 활용법: 현재가가 50일선 위에 있으면 중기 상승추세, 아래면 중기 하락추세입니다. 50일선이 지지선으로 작동하다 무너지면 하락 신호이고, 무너진 후 다시 돌파하면 매수 신호입니다. 기관투자자들이 많이 참고하는 지표입니다." },
  ma200:         { title:"200일 이동평균선", body:"최근 200거래일(약 1년)의 종가 평균. 장기 추세의 기준선입니다.\n\n📌 투자 활용법: 현재가가 200일선 위에 있으면 장기 강세장, 아래면 장기 약세장입니다. '데스크로스'(50일선이 200일선 아래로 내려오는 것)는 장기 하락의 신호이고, '골든크로스'(50일선이 200일선 위로 올라오는 것)는 장기 상승의 신호입니다." },
  ma200_slope:   { title:"200일선 기울기", body:"200일 이동평균선이 현재 우상향인지 우하향인지를 나타냅니다. 30일 전 대비 변화율(%)로 표시됩니다.\n\n📌 투자 활용법: 200일선 자체가 우상향이면 장기 트렌드가 살아있다는 의미로 조정 시 매수 기회입니다. 200일선이 우하향으로 전환되면 단순히 현재가가 200일선 위에 있어도 안심할 수 없습니다. 적립식 투자자는 200일선 기울기가 우상향일 때 더 적극적으로 매수하는 전략이 유효합니다." },
  mdd:           { title:"고점 대비 낙폭 (MDD, Maximum Drawdown)", body:"52주 최고가 대비 현재가의 하락률(%). 현재 가격이 고점에서 얼마나 내려와 있는지를 나타냅니다.\n\n📌 투자 활용법: 나스닥은 역사적으로 -10% 조정, -20% 약세장 진입, -30% 이상 대형 하락을 반복했습니다. 낙폭이 클수록 역발상 매수 기회입니다. 2022년 나스닥 -33% 당시를 돌아보면, MDD가 -30%를 초과할 때 분할 매수한 투자자들은 이후 큰 수익을 거뒀습니다." },
  vol_ratio:     { title:"거래량 비율 (Volume Ratio)", body:"최근 5일 평균 거래량을 20일 평균 거래량으로 나눈 값.\n\n📌 투자 활용법: 1.5 이상이면 최근 거래가 평소보다 50% 이상 많다는 뜻입니다. 주가가 하락하는데 거래량이 폭발적으로 증가하면 '공포 매도 클라이맥스'로, 역발상 매수의 강력한 신호입니다. 반대로 주가 상승에 거래량이 증가하면 상승의 신뢰도가 높고, 거래량 없이 오르면 가짜 반등일 가능성이 있습니다." },
  week52_pos:    { title:"52주 가격대 위치", body:"현재가가 52주 최저가와 최고가 사이에서 어느 위치에 있는지를 나타냅니다. 0%=52주 최저가, 100%=52주 최고가.\n\n📌 투자 활용법: 25% 이하이면 1년 저점 근처로 매수에 유리한 구간입니다. 80% 이상이면 1년 고점 근처로 신중한 접근이 필요합니다. 단, 강한 성장주는 52주 신고가를 갱신하며 계속 오르는 경우도 있으므로 다른 지표와 종합적으로 판단하세요." },
  rs_vs_qqqm:    { title:"QQQM 대비 상대강도 (Relative Strength)", body:"개별 종목의 수익률과 QQQM(나스닥100 ETF) 수익률의 차이. 플러스이면 QQQM보다 강세, 마이너스이면 약세입니다.\n\n📌 투자 활용법: 시장 전체가 빠질 때 덜 빠지고, 오를 때 더 오르는 종목이 강한 상대강도를 가집니다. 상대강도가 지속적으로 플러스인 종목은 섹터 내 선도주로, 조정 시 먼저 반등하는 경향이 있어 매수 우선순위를 높게 두는 것이 좋습니다." },
  insider:       { title:"내부자 매수 (Insider Buying)", body:"CEO, CFO, 이사 등 회사 내부 정보를 가진 경영진이 자기 회사 주식을 매수한 현황.\n\n📌 투자 활용법: 내부자들은 회사 상황을 가장 잘 알기 때문에, 이들이 자기 돈으로 주식을 살 때는 강한 저평가 신호입니다. 특히 여러 임원이 동시에 매수하거나, 대규모 매수가 발생할 때 신뢰도가 높습니다. 반대로 대규모 내부자 매도는 경고 신호이지만, 개인 재정 이유일 수도 있어 매도는 덜 신뢰합니다." },
  // 펀더멘털
  pe:            { title:"P/E 비율 (주가수익비율)", body:"주가를 주당순이익(EPS)으로 나눈 값. 현재 주가가 1년 순이익의 몇 배인지를 나타냅니다.\n\n📌 투자 활용법: P/E가 낮을수록 이익 대비 저렴한 주식입니다. 5년 평균 P/E와 비교하는 것이 중요합니다. P/E가 5년 평균보다 30% 이상 낮으면 저평가 신호입니다. 단, 나스닥 성장주는 미래 성장 기대로 P/E가 높아도 정당화될 수 있으므로 PEG도 함께 확인하세요." },
  peg:           { title:"PEG 비율 (주가수익성장비율)", body:"P/E 비율을 EPS 성장률로 나눈 값. P/E만으로 부족한 성장주 평가에 적합한 지표입니다.\n\n📌 투자 활용법: 피터 린치가 창안한 지표로, PEG 1 이하면 성장 대비 저평가, 2 이상이면 고평가로 봅니다. 예를 들어 P/E 50에 EPS 성장률 50%이면 PEG는 1로 적정 평가입니다. NVDA처럼 P/E가 높아 비싸 보이는 종목도 PEG가 1 이하면 성장 대비 합리적인 가격일 수 있습니다." },
  eps_growth:    { title:"EPS 성장률 (주당순이익 성장률)", body:"전년도 대비 주당순이익(EPS)의 증가율. 기업의 실제 수익성 개선을 나타냅니다.\n\n📌 투자 활용법: EPS 성장률이 15% 이상이면 고성장 기업입니다. 매출만 늘고 EPS가 안 늘면 수익성에 문제가 있다는 신호입니다. 연속적인 EPS 성장이 이어지는 기업이 장기 주가 상승의 기반이 됩니다." },
  analyst_target:{ title:"애널리스트 목표주가", body:"주요 증권사 애널리스트들의 12개월 목표주가 컨센서스(평균).\n\n📌 투자 활용법: 현재가 대비 목표주가 업사이드가 15% 이상이면 시장 전문가들이 긍정적으로 보는 것입니다. 단, 애널리스트들은 낙관적인 경향이 있으므로 맹신은 금물입니다. 여러 애널리스트가 동시에 목표주가를 상향할 때는 강한 매수 신호로 볼 수 있습니다." },
};

// ─── 거시 지표 정의 ──────────────────────────────────────────────
const MACRO_DEFS = {
  심리: [
    {id:"fear_greed",  label:"공포탐욕지수",        unit:"/100",range:[0,100],  good:[20,45],   icon:"🧠", val:38},
    {id:"vix",         label:"VIX 변동성지수",       unit:"",    range:[10,60],  good:[12,22],   icon:"📈", val:24.3},
    {id:"aaii_bull",   label:"AAII 강세 비율",       unit:"%",   range:[10,60],  good:[25,38],   icon:"📊", val:29.4},
  ],
  유동성: [
    {id:"m2_growth",   label:"M2 증가율",            unit:"%",   range:[-2,15],  good:[3,9],     icon:"💵", val:4.2},
    {id:"fed_bs",      label:"연준 대차대조표",       unit:"$T",  range:[4,10],   good:[5,8.5],   icon:"🏦", val:7.1},
    {id:"credit_spread",label:"크레딧 스프레드",     unit:"%",   range:[0.5,6],  good:[0.5,2],   icon:"📉", val:1.8},
    {id:"yield_gap",   label:"일드 갭",               unit:"%",   range:[-3,5],   good:[0.5,3],   icon:"⚖️", val:0.6},
  ],
  금리통화: [
    {id:"yield_10y",   label:"10년물 국채금리",       unit:"%",   range:[0,6],    good:[1.5,3.5], icon:"🏛️", val:4.35},
    {id:"yield_spread",label:"장단기 금리차(10y-2y)", unit:"%",   range:[-2,3],   good:[0.2,2],   icon:"📐", val:-0.12},
    {id:"dxy",         label:"달러인덱스 (DXY)",      unit:"",    range:[90,115], good:[95,104],  icon:"💲", val:103.8},
    {id:"oil_wti",     label:"WTI 원유",              unit:"$",   range:[50,120], good:[60,85],   icon:"🛢️", val:78.4},
  ],
  경기사이클: [
    {id:"gdp_growth",  label:"실질 GDP 성장률",       unit:"%",   range:[-3,8],   good:[1.5,4],   icon:"📈", val:2.8},
    {id:"ism_pmi",     label:"ISM 제조업 PMI",         unit:"",    range:[35,65],  good:[50,60],   icon:"🏭", val:48.7},
    {id:"ism_services",label:"ISM 서비스업 PMI",       unit:"",    range:[35,65],  good:[50,60],   icon:"🏢", val:53.4},
    {id:"cpi",         label:"CPI (소비자물가)",       unit:"%",   range:[0,10],   good:[1,3],     icon:"🛒", val:2.9},
    {id:"core_cpi",    label:"근원 CPI",               unit:"%",   range:[0,8],    good:[1,2.5],   icon:"📦", val:3.2},
    {id:"unemployment",label:"실업률",                 unit:"%",   range:[2,12],   good:[3,5],     icon:"👷", val:4.1},
    {id:"jobless_claims",label:"신규 실업수당 청구",   unit:"만건", range:[15,60],  good:[15,28],   icon:"📋", val:22},
    {id:"jolts",       label:"구인건수 (JOLTS)",        unit:"만건", range:[400,1200],good:[700,1000],icon:"💼", val:760},
  ],
  시장구조: [
    {id:"new_lows",    label:"52주 신저가 비율",       unit:"%",   range:[0,50],   good:[0,15],    icon:"📉", val:18},
    {id:"sox_index",   label:"필라델피아 반도체(SOX)", unit:"",    range:[2000,6000],good:[3000,5500],icon:"💻", val:4820},
    {id:"russell_ratio",label:"러셀2000/나스닥 비율",  unit:"",    range:[0.1,0.4],good:[0.2,0.35],icon:"📊", val:0.22},
    {id:"dj_transport",label:"다우 운송지수 (DJTA)",   unit:"",    range:[10000,20000],good:[13000,18000],icon:"🚛", val:15340},
  ],
};

// ─── 투자 모드 ───────────────────────────────────────────────────

// 모드별 핵심 지표 강조 (별표 표시)
const KEY_INDICATORS = {
  dca:   ["mdd","yield_gap","yield_spread","fed_bs","m2_growth","credit_spread","pe","peg","eps_growth","ism_pmi","cpi","core_cpi","ma200","ma200_slope","jolts"],
  swing: ["rsi","macd","bb_pos","vol_ratio","vix","fear_greed","ma50","mdd","rs_vs_qqqm","week52_pos","aaii_bull"],
};

const INVEST_MODES = {
  dca: {
    id:"dca", label:"적립식 장기투자", emoji:"🌱", color:"#00d4ff",
    desc:"펀더멘털·거시 중심. 꾸준한 분할매수.",
    weights:{tech:0.25,sent:0.20,macro:0.30,fund:0.25},
    wLabel:{tech:"25%",sent:"20%",macro:"30%",fund:"25%"},
    chartDays:365, chartLabel:"1년",
    tips:[
      "매수점수 75↑ (강력매수) → 정기 적립금의 2배 투자",
      "매수점수 60~74 (매수우세) → 정기 적립금의 1.5배 투자",
      "매수점수 45~59 (중립관망) → 정기 적립금 그대로 유지",
      "매수점수 30~44 (매수주의) → 정기 적립금의 0.5배로 줄이기",
      "매수점수 29↓ (고점경계) → 이번 달 추가 매수 보류",
    ],
    scoreDesc:{
      "강력 매수":"펀더멘털 건전 + 거시 유동성 우호. 이번 달 적립금 2배 투입 적극 고려.",
      "매수 우세":"장기 관점 좋은 진입 구간. 적립금 1.5배 투입 고려.",
      "중립 관망":"정기 적립금 그대로 유지. 추가 매수는 관망.",
      "매수 주의":"거시·펀더 불안. 적립금 절반으로 줄이고 현금 비중 확대.",
      "고점 경계":"밸류에이션 고점. 이번 달 추가 매수 보류, 다음 기회 대기.",
    }
  },
  swing: {
    id:"swing", label:"단기 스윙", emoji:"⚡", color:"#ff9a3c",
    desc:"차트·심리 중심. 단기 모멘텀 포착.",
    weights:{tech:0.60,sent:0.25,macro:0.10,fund:0.05},
    wLabel:{tech:"60%",sent:"25%",macro:"10%",fund:"5%"},
    chartDays:30, chartLabel:"1개월",
    tips:[
      "매수점수 75↑ (강력매수) → 계획 포지션의 100% 진입. 손절선 -7% 설정",
      "매수점수 60~74 (매수우세) → 계획 포지션의 50~70% 분할 진입",
      "매수점수 45~59 (중립관망) → 관망 또는 포지션 25% 이하 소량만",
      "매수점수 30~44 (매수주의) → 신규 진입 금지. 기존 포지션 축소",
      "매수점수 29↓ (고점경계) → 기존 포지션 청산 또는 헤지 검토",
    ],
    scoreDesc:{
      "강력 매수":"RSI 과매도 + 공포 극대. 단기 반등 가능성 높음. 전체 포지션 진입, 손절선 필수.",
      "매수 우세":"기술적 지표 매수 우위. 50~70% 분할 진입 후 추가 확인.",
      "중립 관망":"방향성 불명확. 25% 이하 소량 또는 완전 관망 권장.",
      "매수 주의":"기술 지표 약세. 추격 매수 절대 금지. 기존 포지션 점검.",
      "고점 경계":"과매수 신호 다수. 차익 실현 또는 헤지 적극 검토.",
    }
  },
};

// ─── 모의 데이터 생성 ────────────────────────────────────────────
function mockStock(id) {
  const s = id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  // salt 값을 더 다양하게 — 극단값이 더 잘 나오도록
  const r = (mn,mx,salt=7) => mn + ((s*salt + mn*17 + salt*3) % (mx - mn + 1));
  const price   = Math.round(r(40,820,11)*10)/10;
  const high52  = Math.round(price * (1.08 + r(0,40,19)/100) * 10)/10;
  const low52   = Math.round(price * (0.50 + r(0,35,23)/100) * 10)/10;
  const ma50    = Math.round(price * (0.90 + r(0,20,5)/100) * 10)/10;
  const ma200   = Math.round(price * (0.82 + r(0,25,3)/100) * 10)/10;
  const ma200_30d = Math.round(ma200 * (0.96 + r(0,8,37)/100) * 10)/10;
  const ma200_slope = Math.round(((ma200-ma200_30d)/ma200_30d)*100*10)/10;
  const peAvg   = Math.round(r(15,55,17));
  const pe      = Math.round(peAvg*(0.70+r(0,60,11)/100));
  const eps_growth = Math.round((r(0,60,29)-15)*10)/10;  // -15~+45 더 넓은 범위
  const peg     = eps_growth>0 ? Math.round((pe/eps_growth)*100)/100 : null;
  const mdd     = Math.round(((price-high52)/high52)*100*10)/10;
  const vol_ratio = Math.round((0.4+r(0,22,13)/10)*100)/100;  // 0.4~2.6 더 넓은 범위
  const vol_signal = vol_ratio>1.5&&price<ma50?"공포 매도 감지":vol_ratio>1.3?"거래량 급증":vol_ratio<0.7?"거래량 감소":"정상";
  const rs_vs_qqqm = Math.round((r(0,60,31)-30)*10)/10;  // -30~+30 더 넓은 범위
  const insider = r(0,9,41) < 2 ? 2 : r(0,9,43) < 3 ? 1 : 0;  // 분포 조정
  const history = [];
  let p = price*(0.65+r(0,40,23)/100);
  for(let i=365;i>=0;i--){
    const date=new Date(); date.setDate(date.getDate()-i);
    p=Math.max(p*(1+(Math.random()-0.49)*0.024),1);
    history.push({date:date.toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),price:Math.round(p*100)/100});
  }
  history[history.length-1].price=price;
  return {price,high52,low52,ma50,ma200,ma200_slope,
    rsi:Math.round(r(20,80,9)),        // 20~80 더 넓은 범위
    macd:Math.round((r(0,30,7)-18)*10)/10,  // -18~+12 더 넓은 범위
    bb_pos:Math.round(r(5,95,13)),     // 5~95 더 넓은 범위
    week52_pos:Math.round(((price-low52)/(high52-low52))*100),
    mdd,vol_ratio,vol_signal,rs_vs_qqqm,insider,pe,peAvg,eps_growth,peg,
    analyst_target:Math.round(price*(1.05+r(0,35,31)/100)*10)/10,
    history};
}

function genData(stocks) {
  const s={};
  stocks.forEach(st=>{s[st.id]=mockStock(st.id);});
  return s;
}

// ─── 점수 알고리즘 ───────────────────────────────────────────────
const MD = {fear_greed:38,vix:24.3,aaii_bull:29.4,m2_growth:4.2,fed_bs:7.1,credit_spread:1.8,dxy:103.8,oil_wti:78.4,yield_10y:4.35,yield_spread:-0.12,yield_gap:0.6,new_lows:18,ism_pmi:48.7,ism_services:53.4,gdp_growth:2.8,cpi:2.9,core_cpi:3.2,unemployment:4.1,jobless_claims:22,jolts:760,sox_index:4820,russell_ratio:0.22,dj_transport:15340};

function calcScore(sd, w) {
  const weights = w || INVEST_MODES.dca.weights;
  let tech=50;
  if(sd.rsi<30)tech+=18; else if(sd.rsi<40)tech+=10; else if(sd.rsi<50)tech+=4; else if(sd.rsi>70)tech-=18;
  if(sd.macd<-5)tech+=8; else if(sd.macd<0)tech+=4; else if(sd.macd>5)tech-=8;
  if(sd.bb_pos<20)tech+=13; else if(sd.bb_pos<35)tech+=7; else if(sd.bb_pos>80)tech-=13;
  if(sd.price<sd.ma50*0.95)tech+=10; else if(sd.price<sd.ma50)tech+=5; else if(sd.price>sd.ma50*1.1)tech-=10;
  if(sd.ma200_slope>0.3)tech+=6; else if(sd.ma200_slope<-0.5)tech-=8;
  if(sd.week52_pos<25)tech+=8; else if(sd.week52_pos>80)tech-=8;
  if(sd.mdd<-30)tech+=12; else if(sd.mdd<-20)tech+=7; else if(sd.mdd<-10)tech+=3; else if(sd.mdd>-5)tech-=5;
  if(sd.vol_ratio>1.5&&sd.price<sd.ma50)tech+=10; else if(sd.vol_ratio>1.3&&sd.price>sd.ma50)tech-=5;
  if(sd.rs_vs_qqqm>10)tech+=5; else if(sd.rs_vs_qqqm<-15)tech-=5;

  let sent=50;
  if(MD.fear_greed<25)sent+=18; else if(MD.fear_greed<40)sent+=9; else if(MD.fear_greed>75)sent-=18;
  if(MD.vix>30)sent+=14; else if(MD.vix>25)sent+=7; else if(MD.vix<15)sent-=7;
  if(MD.aaii_bull<25)sent+=10; else if(MD.aaii_bull<32)sent+=5; else if(MD.aaii_bull>50)sent-=10;
  if(sd.insider===2)sent+=12; else if(sd.insider===1)sent+=6;

  let macro=50;
  if(MD.m2_growth>3&&MD.m2_growth<9)macro+=10; else if(MD.m2_growth<0)macro-=14;
  if(MD.yield_10y>4.5)macro-=12; else if(MD.yield_10y<3)macro+=8;
  if(MD.dxy>107)macro-=9; else if(MD.dxy<97)macro+=7;
  if(MD.oil_wti>90)macro-=7; else if(MD.oil_wti<65)macro-=5;
  if(MD.fed_bs>8)macro+=10; else if(MD.fed_bs>7)macro+=5; else if(MD.fed_bs<5)macro-=8;
  if(MD.credit_spread<1.5)macro+=8; else if(MD.credit_spread>3)macro-=15; else if(MD.credit_spread>2)macro-=7;
  if(MD.yield_gap>2)macro+=10; else if(MD.yield_gap>0.5)macro+=5; else if(MD.yield_gap<0)macro-=12;
  if(MD.new_lows>30)macro+=10; else if(MD.new_lows>20)macro+=5; else if(MD.new_lows<5)macro-=5;
  if(MD.ism_pmi>55)macro+=8; else if(MD.ism_pmi>50)macro+=4; else if(MD.ism_pmi<45)macro-=10;
  if(MD.yield_spread<-0.5)macro-=10; else if(MD.yield_spread>0.5)macro+=6;
  if(MD.cpi<2.5)macro+=8; else if(MD.cpi>4)macro-=10;
  if(MD.unemployment<4)macro+=5; else if(MD.unemployment>5)macro-=8;

  let fund=50;
  if(sd.pe<sd.peAvg*0.8)fund+=18; else if(sd.pe<sd.peAvg)fund+=9; else if(sd.pe>sd.peAvg*1.3)fund-=14;
  if(sd.eps_growth>15)fund+=14; else if(sd.eps_growth>5)fund+=7; else if(sd.eps_growth<0)fund-=14;
  const up=((sd.analyst_target-sd.price)/sd.price)*100;
  if(up>20)fund+=9; else if(up>10)fund+=5; else if(up<0)fund-=9;
  if(sd.peg&&sd.peg<1)fund+=12; else if(sd.peg&&sd.peg<1.5)fund+=6; else if(sd.peg&&sd.peg>3)fund-=12;

  // ✅ Fix: weights 변수 일관되게 사용
  const total=Math.round(tech*weights.tech+sent*weights.sent+macro*weights.macro+fund*weights.fund);
  return {total:Math.max(0,Math.min(100,total)),tech:Math.max(0,Math.min(100,tech)),sent:Math.max(0,Math.min(100,sent)),macro:Math.max(0,Math.min(100,macro)),fund:Math.max(0,Math.min(100,fund))};
}

function sig(score){
  if(score>=75)return{label:"강력 매수",color:"#00ff88",bg:"rgba(0,255,136,0.12)",emoji:"🟢"};
  if(score>=60)return{label:"매수 우세",color:"#7bff5e",bg:"rgba(123,255,94,0.1)",emoji:"🟩"};
  if(score>=45)return{label:"중립 관망",color:"#ffd700",bg:"rgba(255,215,0,0.1)",emoji:"🟡"};
  if(score>=30)return{label:"매수 주의",color:"#ff9a3c",bg:"rgba(255,154,60,0.1)",emoji:"🟠"};
  return{label:"고점 경계",color:"#ff4757",bg:"rgba(255,71,87,0.1)",emoji:"🔴"};
}

function macroSt(id,val){
  const all=[...MACRO_DEFS.심리,...MACRO_DEFS.유동성,...MACRO_DEFS.금리통화,...MACRO_DEFS.경기사이클,...MACRO_DEFS.시장구조];
  const def=all.find(d=>d.id===id); if(!def)return"neutral";
  const[lo,hi]=def.good;
  if(id==="fear_greed"){if(val<25)return"great";if(val<45)return"good";if(val>75)return"bad";return"neutral";}
  if(id==="vix"){if(val>30)return"great";if(val>22)return"good";return"neutral";}
  if(id==="new_lows"){if(val>30)return"great";if(val>20)return"good";return"neutral";}
  if(id==="credit_spread"){if(val<1.5)return"good";if(val>3)return"bad";return"neutral";}
  if(id==="yield_gap"){if(val>2)return"great";if(val>0.5)return"good";if(val<0)return"bad";return"neutral";}
  if(id==="aaii_bull"){if(val<25)return"great";if(val<32)return"good";if(val>50)return"bad";return"neutral";}
  if(id==="fed_bs"){if(val>8)return"great";if(val>7)return"good";if(val<5)return"bad";return"neutral";}
  if(id==="yield_spread"){if(val<-0.5)return"bad";if(val>0.5)return"good";return"neutral";}
  if(id==="cpi"||id==="core_cpi"){if(val<2.5)return"good";if(val>4)return"bad";return"neutral";}
  if(id==="unemployment"){if(val<4)return"good";if(val>5.5)return"bad";return"neutral";}
  if(id==="ism_pmi"||id==="ism_services"){if(val>55)return"great";if(val>50)return"good";if(val<45)return"bad";return"neutral";}
  if(val>=lo&&val<=hi)return"good";
  if(val<lo*0.85||val>hi*1.15)return"bad";
  return"neutral";
}

function rgb(hex){return`${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;}

// ─── 지표 설명 팝업 ──────────────────────────────────────────────
function InfoPopup({id, onClose}){
  const info = INDICATOR_INFO[id];
  if(!info)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:500,background:"#0d1626",border:"1px solid rgba(0,212,255,0.3)",borderRadius:16,padding:24,boxShadow:"0 24px 80px rgba(0,0,0,0.7)",animation:"modalIn 0.2s ease",maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800,color:"#00d4ff",lineHeight:1.4,paddingRight:16}}>{info.title}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",width:28,height:28,borderRadius:6,flexShrink:0}}>✕</button>
        </div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.9,whiteSpace:"pre-line"}}>{info.body}</div>
      </div>
    </div>
  );
}

// 클릭 가능한 지표 이름 버튼 (모드별 핵심 지표 강조 포함)
function InfoLabel({id, label, mode, style={}}){
  const[show,setShow]=useState(false);
  const hasInfo=!!INDICATOR_INFO[id];
  const isKey = mode && KEY_INDICATORS[mode]?.includes(id);
  return(
    <>
      <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
        <span onClick={hasInfo?()=>setShow(true):undefined}
          style={{cursor:hasInfo?"pointer":"default",borderBottom:hasInfo?"1px dashed rgba(0,212,255,0.4)":"none",color:"rgba(255,255,255,0.55)",fontSize:11,transition:"color 0.15s",...style}}
          onMouseEnter={e=>{if(hasInfo)e.target.style.color="#00d4ff";}}
          onMouseLeave={e=>{if(hasInfo)e.target.style.color=style.color||"rgba(255,255,255,0.55)";}}>
          {label}{hasInfo&&<span style={{fontSize:9,marginLeft:2,opacity:0.5}}>ⓘ</span>}
        </span>
        {isKey&&<span style={{fontSize:9,color:mode==="dca"?"#00d4ff":"#ff9a3c",fontWeight:900,lineHeight:1}}>⭐</span>}
      </span>
      {show&&<InfoPopup id={id} onClose={()=>setShow(false)}/>}
    </>
  );
}

// ─── UI 컴포넌트 ─────────────────────────────────────────────────
function Gauge({score}){
  const angle=-135+(score/100)*270; const s=sig(score);
  return(
    <div style={{position:"relative",width:180,height:110,margin:"0 auto"}}>
      <svg width="180" height="110" viewBox="0 0 180 110">
        <defs><linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff4757"/><stop offset="30%" stopColor="#ff9a3c"/>
          <stop offset="50%" stopColor="#ffd700"/><stop offset="70%" stopColor="#7bff5e"/><stop offset="100%" stopColor="#00ff88"/>
        </linearGradient></defs>
        <path d="M 20 95 A 70 70 0 0 1 160 95" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round"/>
        <path d="M 20 95 A 70 70 0 0 1 160 95" fill="none" stroke="url(#gg)" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.9"/>
        <g transform={`rotate(${angle},90,95)`}>
          <line x1="90" y1="95" x2="90" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="90" cy="95" r="5" fill="white"/>
        </g>
      </svg>
      <div style={{position:"absolute",bottom:0,left:0,right:0,textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:900,color:s.color,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{score}</div>
        <div style={{fontSize:11,color:s.color,letterSpacing:1,marginTop:2}}>{s.label}</div>
      </div>
    </div>
  );
}

function MiniChart({history,color,chartDays}){
  const sliced=history.slice(-chartDays);
  const thin=sliced.filter((_,i)=>i%Math.max(1,Math.floor(sliced.length/60))===0||i===sliced.length-1);
  const prices=thin.map(h=>h.price);
  const mn=Math.min(...prices)*0.995,mx=Math.max(...prices)*1.005;
  const startDate=sliced[0]?.date||"";
  const endDate=sliced[sliced.length-1]?.date||"";
  return(
    <div style={{width:"100%"}}>
      <div style={{height:150}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={thin} margin={{top:5,right:5,left:0,bottom:0}}>
            <XAxis dataKey="date" hide/><YAxis domain={[mn,mx]} hide/>
            <Tooltip contentStyle={{background:"#0e1525",border:`1px solid ${color}55`,borderRadius:8,fontSize:11,color:"white"}} formatter={(v)=>[`$${v}`,""]} labelStyle={{color:"rgba(255,255,255,0.4)"}}/>
            <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} activeDot={{r:4,fill:color}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* 날짜 범위 표시 */}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:3,padding:"0 5px"}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:"'Space Mono',monospace"}}>{startDate}</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{chartDays}일 기간</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:"'Space Mono',monospace"}}>{endDate}</span>
      </div>
    </div>
  );
}

function SearchModal({onAdd,onClose,existingIds}){
  const[q,setQ]=useState(""); const[custom,setCustom]=useState("");
  const ref=useRef(null);
  useEffect(()=>{setTimeout(()=>ref.current?.focus(),50);},[]);
  const list=STOCK_DB.filter(s=>(s.id.toLowerCase().includes(q.toLowerCase())||s.label.includes(q))&&!existingIds.includes(s.id)).slice(0,8);
  const add=(st)=>{const i=existingIds.length%COLORS.length;onAdd({id:st.id,label:st.label,color:COLORS[i],icon:ICONS[i%ICONS.length]});onClose();};
  const addCustom=()=>{const t=custom.toUpperCase().trim();if(!t||existingIds.includes(t))return;const f=STOCK_DB.find(s=>s.id===t);const i=existingIds.length%COLORS.length;onAdd({id:t,label:f?.label||t,color:COLORS[i],icon:ICONS[i%ICONS.length]});onClose();};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:460,background:"#0d1626",border:"1px solid rgba(0,212,255,0.3)",borderRadius:18,padding:26,boxShadow:"0 24px 80px rgba(0,0,0,0.7)",animation:"modalIn 0.2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontSize:16,fontWeight:800}}>📋 종목 추가</div><div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2}}>티커 또는 종목명으로 검색</div></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",width:28,height:28,borderRadius:6}}>✕</button>
        </div>
        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:.4}}>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="예: MSFT, 마이크로소프트..."
            style={{width:"100%",padding:"11px 14px 11px 38px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"white",fontSize:14,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="rgba(0,212,255,0.4)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
        </div>
        <div style={{maxHeight:260,overflowY:"auto",marginBottom:14}}>
          {(q?list:STOCK_DB.filter(s=>!existingIds.includes(s.id)).slice(0,6)).map(st=>(
            <div key={st.id} onClick={()=>add(st)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:8,cursor:"pointer",marginBottom:3,border:"1px solid transparent",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,212,255,0.08)";e.currentTarget.style.borderColor="rgba(0,212,255,0.2)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:12,fontWeight:800,color:"#00d4ff",fontFamily:"'Space Mono',monospace",minWidth:50}}>{st.id}</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>{st.label}</span>
              </div>
              <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,fontWeight:700,background:st.type==="ETF"?"rgba(118,185,0,0.15)":"rgba(0,130,251,0.15)",color:st.type==="ETF"?"#76b900":"#5ba3ff"}}>{st.type}</span>
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:14}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:8}}>목록에 없는 종목 직접 입력</div>
          <div style={{display:"flex",gap:8}}>
            <input value={custom} onChange={e=>setCustom(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&addCustom()} placeholder="티커 (예: BRKB)" maxLength={6}
              style={{flex:1,padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"white",fontSize:14,outline:"none",fontFamily:"'Space Mono',monospace",letterSpacing:2}}
              onFocus={e=>e.target.style.borderColor="rgba(0,212,255,0.3)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
            <button onClick={addCustom} disabled={!custom} style={{padding:"10px 18px",borderRadius:9,background:custom?"rgba(0,212,255,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${custom?"rgba(0,212,255,0.4)":"rgba(255,255,255,0.08)"}`,color:custom?"#00d4ff":"rgba(255,255,255,0.25)",fontSize:13,fontWeight:700,cursor:custom?"pointer":"not-allowed"}}>추가</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 거시경제 신호등 패널 (종합현황 탭용)
function MacroSnapshot({investMode}){
  const items=[
    {id:"fear_greed",label:"공포탐욕",val:MD.fear_greed,unit:"/100"},
    {id:"vix",label:"VIX",val:MD.vix,unit:""},
    {id:"credit_spread",label:"크레딧",val:MD.credit_spread,unit:"%"},
    {id:"yield_gap",label:"일드갭",val:MD.yield_gap,unit:"%"},
    {id:"yield_spread",label:"금리차",val:MD.yield_spread,unit:"%"},
    {id:"ism_pmi",label:"ISM",val:MD.ism_pmi,unit:""},
    {id:"cpi",label:"CPI",val:MD.cpi,unit:"%"},
    {id:"yield_10y",label:"10y금리",val:MD.yield_10y,unit:"%"},
  ];
  const allInds=[...MACRO_DEFS.심리,...MACRO_DEFS.유동성,...MACRO_DEFS.금리통화,...MACRO_DEFS.경기사이클,...MACRO_DEFS.시장구조];
  const statuses=items.map(it=>macroSt(it.id,it.val));
  const goodCount=statuses.filter(s=>s==="great"||s==="good").length;
  const badCount=statuses.filter(s=>s==="bad").length;
  const overallSt=badCount>=4?"위험":badCount>=2?"주의":goodCount>=6?"우호":"중립";
  const overallColor=badCount>=4?"#ff4757":badCount>=2?"#ff9a3c":goodCount>=6?"#00ff88":"#ffd700";

  const cats=[
    {label:"유동성", ids:["m2_growth","fed_bs","credit_spread","yield_gap"], icon:"💧"},
    {label:"심리",   ids:["fear_greed","vix","aaii_bull"],                   icon:"🧠"},
    {label:"경기",   ids:["ism_pmi","gdp_growth","unemployment","cpi"],      icon:"📊"},
    {label:"금리/환율", ids:["yield_10y","yield_spread","dxy"],              icon:"🏛️"},
  ];

  return(
    <div style={{marginTop:10,padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:2}}>🌍 거시경제 환경</div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",borderRadius:8,background:`rgba(${rgb(overallColor)},0.12)`,border:`1px solid rgba(${rgb(overallColor)},0.3)`}}>
          <div style={{display:"flex",gap:4}}>
            {["우호","중립","주의","위험"].map((label,i)=>{
              const colors=["#00ff88","#ffd700","#ff9a3c","#ff4757"];
              const active=overallSt===label;
              return <div key={label} style={{width:10,height:10,borderRadius:"50%",background:active?colors[i]:"rgba(255,255,255,0.1)",boxShadow:active?`0 0 8px ${colors[i]}`:"none",transition:"all 0.3s"}}/>;
            })}
          </div>
          <span style={{fontSize:12,fontWeight:700,color:overallColor}}>{overallSt}</span>
          <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{goodCount}/{items.length} 우호</span>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
        {cats.map(cat=>{
          const catStatuses=cat.ids.map(id=>{
            const ind=allInds.find(d=>d.id===id);
            return ind?macroSt(id,ind.val):"neutral";
          });
          const catGood=catStatuses.filter(s=>s==="great"||s==="good").length;
          const catBad=catStatuses.filter(s=>s==="bad").length;
          const catColor=catBad>=2?"#ff4757":catBad>=1?"#ff9a3c":catGood>=cat.ids.length*0.7?"#00ff88":"#ffd700";
          const catLabel=catBad>=2?"위험":catBad>=1?"주의":catGood>=cat.ids.length*0.7?"우호":"중립";
          return(
            <div key={cat.label} style={{padding:"9px 10px",borderRadius:9,background:"rgba(0,0,0,0.2)",border:`1px solid rgba(${rgb(catColor)},0.2)`,textAlign:"center"}}>
              <div style={{fontSize:14,marginBottom:4}}>{cat.icon}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{cat.label}</div>
              <div style={{fontSize:12,fontWeight:700,color:catColor}}>{catLabel}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginTop:2}}>{catGood}/{cat.ids.length}</div>
            </div>
          );
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
        {items.map(item=>{
          const st=macroSt(item.id,item.val);
          const c=st==="great"?"#00ff88":st==="good"?"#7bff5e":st==="bad"?"#ff4757":"rgba(255,255,255,0.45)";
          return(
            <div key={item.id} style={{padding:"8px 9px",background:"rgba(0,0,0,0.25)",borderRadius:8,borderLeft:`2px solid ${c}`}}>
              <div style={{marginBottom:2}}><InfoLabel id={item.id} label={item.label} mode={investMode} style={{fontSize:10}}/></div>
              <div style={{fontSize:15,fontWeight:900,fontFamily:"'Space Mono',monospace",color:c}}>{item.val}{item.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 거시경제 탭 하단 종합 판단 컴포넌트
function MacroSummary(){
  const allInds=[...MACRO_DEFS.심리,...MACRO_DEFS.유동성,...MACRO_DEFS.금리통화,...MACRO_DEFS.경기사이클,...MACRO_DEFS.시장구조];
  const summaryItems=[
    {label:"유동성/QE",    ids:["m2_growth","fed_bs","credit_spread"],        icon:"💧"},
    {label:"투자심리",     ids:["fear_greed","vix","aaii_bull"],               icon:"🧠"},
    {label:"경기/성장",    ids:["gdp_growth","ism_pmi","ism_services","jolts"],icon:"📊"},
    {label:"물가/금리",    ids:["cpi","core_cpi","yield_10y","yield_spread"],  icon:"🏛️"},
    {label:"밸류 매력도",  ids:["yield_gap"],                                  icon:"⚖️"},
    {label:"시장 구조",    ids:["new_lows","sox_index","russell_ratio"],        icon:"🔬"},
  ];
  return(
    <div style={{marginTop:12,padding:"14px 15px",borderRadius:10,background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:12,fontWeight:700,letterSpacing:1}}>⚡ 거시환경 종합 판단</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {summaryItems.map(cat=>{
          const catStatuses=cat.ids.map(id=>{
            const ind=allInds.find(d=>d.id===id);
            return ind?macroSt(id,ind.val):"neutral";
          });
          const good=catStatuses.filter(s=>s==="great"||s==="good").length;
          const bad=catStatuses.filter(s=>s==="bad").length;
          const color=bad>=Math.ceil(cat.ids.length/2)?"#ff4757":bad>=1?"#ff9a3c":good>=cat.ids.length*0.7?"#00ff88":"#ffd700";
          const label=bad>=Math.ceil(cat.ids.length/2)?"위험":bad>=1?"주의":good>=cat.ids.length*0.7?"우호":"중립";
          return(
            <div key={cat.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"rgba(255,255,255,0.03)",borderRadius:8,borderLeft:`3px solid ${color}`}}>
              <div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:1}}>{cat.icon} {cat.label}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.25)"}}>{good}/{cat.ids.length} 우호</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:color,boxShadow:`0 0 8px ${color}`,margin:"0 auto 3px"}}/>
                <div style={{fontSize:11,fontWeight:700,color}}>{label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function MacroCard({ind, mode}){
  const val=ind.val;
  const st=macroSt(ind.id,val);
  const sc=st==="great"?"#00ff88":st==="good"?"#7bff5e":st==="bad"?"#ff4757":"rgba(255,255,255,0.5)";
  const sl=st==="great"?"매수 유리":st==="good"?"양호":st==="bad"?"주의":"중립";
  const isKey=mode&&KEY_INDICATORS[mode]?.includes(ind.id);
  const pct=((val-ind.range[0])/(ind.range[1]-ind.range[0]))*100;
  const glo=((ind.good[0]-ind.range[0])/(ind.range[1]-ind.range[0]))*100;
  const ghi=((ind.good[1]-ind.range[0])/(ind.range[1]-ind.range[0]))*100;
  return(
    <div style={{padding:"14px",borderRadius:10,background:isKey?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.03)",border:isKey?`1px solid ${mode==="dca"?"rgba(0,212,255,0.25)":"rgba(255,154,60,0.25)"}`:"1px solid rgba(255,255,255,0.07)",position:"relative"}}>
      {isKey&&<div style={{position:"absolute",top:8,right:8,fontSize:10,color:mode==="dca"?"#00d4ff":"#ff9a3c",fontWeight:900}}>⭐</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1,paddingRight:20}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
            <span style={{fontSize:13}}>{ind.icon}</span>
            <InfoLabel id={ind.id} label={ind.label} mode={mode} style={{fontSize:12,fontWeight:600}}/>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>
            적정: {ind.good[0]}{ind.unit} ~ {ind.good[1]}{ind.unit}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:20,fontWeight:900,fontFamily:"'Space Mono',monospace",color:sc}}>{val}{ind.unit}</div>
          <div style={{fontSize:10,color:sc,letterSpacing:1}}>{sl}</div>
        </div>
      </div>
      <div style={{position:"relative",height:6,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
        <div style={{position:"absolute",left:`${glo}%`,width:`${ghi-glo}%`,height:"100%",background:"rgba(0,255,136,0.15)",borderRadius:3,border:"1px solid rgba(0,255,136,0.2)"}}/>
        <div style={{position:"absolute",left:`${Math.min(Math.max(pct,2),96)}%`,transform:"translateX(-50%)",width:11,height:11,top:-2.5,borderRadius:"50%",background:sc,boxShadow:`0 0 7px ${sc}88`}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:9,color:"rgba(255,255,255,0.15)"}}>{ind.range[0]}{ind.unit}</span>
        <span style={{fontSize:9,color:"rgba(0,255,136,0.3)"}}>▬ 적정</span>
        <span style={{fontSize:9,color:"rgba(255,255,255,0.15)"}}>{ind.range[1]}{ind.unit}</span>
      </div>
    </div>
  );
}

// ─── 메인 앱 ─────────────────────────────────────────────────────
export default function App(){
  const[stocks,setStocks]=useState(DEFAULT_STOCKS);
  const[sel,setSel]=useState("QQQM");
  const[tab,setTab]=useState("overview");
  const[showSearch,setShowSearch]=useState(false);
  const[delMode,setDelMode]=useState(false);
  const[investMode,setInvestMode]=useState("dca");
  const[macroTab,setMacroTab]=useState("심리");
  const[modeOpen,setModeOpen]=useState(true);       // ✅ 모드 패널 접기/펼치기
  const[keyOnly,setKeyOnly]=useState(false);         // ✅ 핵심 지표만 보기 필터

  const mode=INVEST_MODES[investMode];

  // ✅ useMemo로 캐싱 — stocks가 바뀔 때만 재계산
  const stockData=useMemo(()=>genData(stocks),[stocks]);

  const stockInfo=stocks.find(s=>s.id===sel)||stocks[0];
  const sd=stockData[sel]||stockData[stocks[0]?.id];
  const scores=sd?calcScore(sd,mode.weights):{total:50,tech:50,sent:50,macro:50,fund:50};
  const signal=sig(scores.total);

  const addStock=(s)=>{setStocks(p=>[...p,s]);setSel(s.id);setDelMode(false);};
  const rmStock=(id)=>{if(stocks.length<=1)return;const next=stocks.find(s=>s.id!==id);setStocks(p=>p.filter(s=>s.id!==id));if(sel===id)setSel(next?.id);};
  const C=(s={})=>({padding:"13px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",...s});

  return(
    <div style={{minHeight:"100vh",background:"#070b14",backgroundImage:"radial-gradient(ellipse at 15% 15%,rgba(0,212,255,0.05) 0%,transparent 50%),radial-gradient(ellipse at 85% 85%,rgba(118,185,0,0.04) 0%,transparent 50%)",fontFamily:"'Noto Sans KR',sans-serif",color:"white",paddingBottom:60}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0a0f1e} ::-webkit-scrollbar-thumb{background:rgba(0,212,255,0.3);border-radius:2px}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
        @keyframes shake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
        .tab-btn:hover{background:rgba(255,255,255,0.05)!important}
        .chip:hover{transform:translateY(-1px)}
        .ch:hover{border-color:rgba(255,255,255,0.2)!important;background:rgba(255,255,255,0.06)!important}
      `}</style>

      {showSearch&&<SearchModal onAdd={addStock} onClose={()=>setShowSearch(false)} existingIds={stocks.map(s=>s.id)}/>}

      {/* 헤더 */}
      <div style={{padding:"22px 24px 0",maxWidth:920,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <div>
            <div style={{fontSize:10,color:"rgba(0,212,255,0.7)",letterSpacing:3,fontFamily:"'Space Mono',monospace",marginBottom:3}}>NASDAQ TIMING DASHBOARD v3</div>
            <h1 style={{margin:0,fontSize:21,fontWeight:900,letterSpacing:-0.5}}>나스닥 매수 타이밍 분석기</h1>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:3}}>지표 이름을 클릭하면 상세 설명을 볼 수 있습니다 <span style={{color:"rgba(0,212,255,0.5)"}}>ⓘ</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginBottom:2}}>데이터 기준</div>
            <div style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"rgba(255,255,255,0.5)"}}>
              {new Date().toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}
            </div>
            <div style={{fontSize:10,color:"rgba(255,165,0,0.7)",marginTop:3}}>주가 최대 15분 지연</div>
          </div>
        </div>
        <div style={{display:"flex",gap:3,marginTop:16,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          {[["overview","📊 종합현황"],["detail","🔍 종목상세"],["macro","🌍 거시경제"]].map(([id,label])=>(
            <button key={id} className="tab-btn" onClick={()=>setTab(id)} style={{background:tab===id?"rgba(0,212,255,0.1)":"transparent",border:"none",borderBottom:tab===id?"2px solid #00d4ff":"2px solid transparent",color:tab===id?"#00d4ff":"rgba(255,255,255,0.4)",padding:"9px 16px",fontSize:12,cursor:"pointer",fontWeight:600,transition:"all 0.2s",borderRadius:"7px 7px 0 0",whiteSpace:"nowrap"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:920,margin:"0 auto",padding:"0 24px"}}>

        {/* 투자 모드 */}
        <div style={{marginTop:14,borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden"}}>
          {/* 모드 헤더 — 항상 표시 */}
          <div onClick={()=>setModeOpen(o=>!o)} style={{padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:2}}>⚙️ 투자 전략 모드</span>
              <span style={{fontSize:11,fontWeight:700,color:mode.color,padding:"2px 8px",borderRadius:5,background:`rgba(${rgb(mode.color)},0.12)`,border:`1px solid rgba(${rgb(mode.color)},0.25)`}}>
                {mode.emoji} {mode.label}
              </span>
              <span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:signal.color,fontWeight:700}}>
                현재 점수: {scores.total}점 {signal.emoji}
              </span>
            </div>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.3)",transition:"transform 0.2s",display:"inline-block",transform:modeOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
          </div>

          {/* 모드 상세 — 토글 */}
          {modeOpen&&<div style={{padding:"0 14px 13px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:9}}>
            {Object.values(INVEST_MODES).map(m=>{
              const active=investMode===m.id;
              return(
                <button key={m.id} onClick={()=>setInvestMode(m.id)} style={{padding:"11px 12px",borderRadius:9,cursor:"pointer",border:`1.5px solid ${active?m.color:"rgba(255,255,255,0.08)"}`,background:active?`rgba(${rgb(m.color)},0.12)`:"rgba(255,255,255,0.02)",transition:"all 0.2s",textAlign:"left"}}>
                  <div style={{fontSize:13,fontWeight:700,color:active?m.color:"rgba(255,255,255,0.65)",marginBottom:4}}>{m.emoji} {m.label}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:6,lineHeight:1.4}}>{m.desc}</div>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {[["기술",m.wLabel.tech,"#61afef"],["심리",m.wLabel.sent,"#e5c07b"],["거시",m.wLabel.macro,"#98c379"],["펀더",m.wLabel.fund,"#c678dd"]].map(([k,v,c])=>(
                      <span key={k} style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:`rgba(${rgb(c)},0.15)`,color:c}}>{k} {v}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          {/* 점수별 매수 가이드 */}
          <div style={{padding:"10px 12px",borderRadius:8,background:`rgba(${rgb(mode.color)},0.06)`,border:`1px solid rgba(${rgb(mode.color)},0.2)`}}>
            <div style={{fontSize:10,color:mode.color,fontWeight:700,marginBottom:7,letterSpacing:1}}>
              {mode.emoji} {mode.label} — 점수별 매수 가이드
            </div>
            <div style={{display:"grid",gap:4}}>
              {[
                {range:"75↑",label:"강력 매수",color:"#00ff88",emoji:"🟢"},
                {range:"60~74",label:"매수 우세",color:"#7bff5e",emoji:"🟩"},
                {range:"45~59",label:"중립 관망",color:"#ffd700",emoji:"🟡"},
                {range:"30~44",label:"매수 주의",color:"#ff9a3c",emoji:"🟠"},
                {range:"~29",label:"고점 경계",color:"#ff4757",emoji:"🔴"},
              ].map((g,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 7px",borderRadius:6,background:"rgba(0,0,0,0.15)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,minWidth:90,flexShrink:0}}>
                    <span style={{fontSize:9}}>{g.emoji}</span>
                    <span style={{fontSize:10,fontWeight:700,color:g.color,fontFamily:"'Space Mono',monospace"}}>{g.range}점</span>
                  </div>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>{mode.scoreDesc[g.label]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 핵심 지표 안내 */}
          <div style={{marginTop:8,padding:"7px 10px",borderRadius:7,background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.06)"}}>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>
              ⭐ 표시된 지표는 <span style={{color:mode.color,fontWeight:700}}>{mode.label}</span> 모드에서 특히 중요한 핵심 지표입니다
            </span>
          </div>
          </div>}
        </div>

        {/* 워치리스트 */}
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:2}}>📋 워치리스트 <span style={{color:"rgba(0,212,255,0.5)"}}>({stocks.length})</span></div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setDelMode(d=>!d)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,border:`1px solid ${delMode?"rgba(255,71,87,0.5)":"rgba(255,255,255,0.1)"}`,background:delMode?"rgba(255,71,87,0.1)":"rgba(255,255,255,0.04)",color:delMode?"#ff4757":"rgba(255,255,255,0.4)",cursor:"pointer"}}>{delMode?"✕ 종료":"✏️ 편집"}</button>
              <button onClick={()=>setShowSearch(true)} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:700,border:"1px solid rgba(0,212,255,0.4)",background:"rgba(0,212,255,0.1)",color:"#00d4ff",cursor:"pointer"}}>+ 추가</button>
            </div>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
            {stocks.map(s=>{
              const sc=stockData[s.id]?calcScore(stockData[s.id],mode.weights).total:50;
              const sg=sig(sc);
              return(
                <div key={s.id} style={{position:"relative"}}>
                  <button className="chip" onClick={()=>!delMode&&setSel(s.id)} style={{padding:"7px 12px",borderRadius:8,border:sel===s.id&&!delMode?`1.5px solid ${s.color}`:delMode?"1px solid rgba(255,71,87,0.25)":"1px solid rgba(255,255,255,0.1)",background:sel===s.id&&!delMode?`rgba(${rgb(s.color)},0.13)`:delMode?"rgba(255,71,87,0.04)":"rgba(255,255,255,0.03)",color:sel===s.id&&!delMode?s.color:"rgba(255,255,255,0.65)",cursor:delMode?"default":"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6,transition:"all 0.18s",animation:delMode?"shake 0.5s ease infinite":"none"}}>
                    <span>{s.icon}</span>
                    <span style={{fontFamily:"'Space Mono',monospace"}}>{s.id}</span>
                    {!delMode&&<span style={{fontSize:11,color:sg.color,fontWeight:700}}>{sc}</span>}
                  </button>
                  {delMode&&stocks.length>1&&<button onClick={()=>rmStock(s.id)} style={{position:"absolute",top:-6,right:-6,width:17,height:17,borderRadius:"50%",background:"#ff4757",border:"2px solid #070b14",color:"white",fontSize:8,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 8px rgba(255,71,87,0.7)",padding:0,animation:"fadeIn 0.2s ease"}}>✕</button>}
                </div>
              );
            })}
            {!delMode&&<button onClick={()=>setShowSearch(true)} style={{padding:"7px 12px",borderRadius:8,border:"1.5px dashed rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.2)",cursor:"pointer",fontSize:11,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,212,255,0.5)";e.currentTarget.style.color="#00d4ff";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.color="rgba(255,255,255,0.2)";}}>+ 추가</button>}
          </div>
        </div>

        {/* ── 종합 탭 ── */}
        {tab==="overview"&&sd&&(
          <div style={{animation:"slideIn 0.35s ease"}}>
            {/* 메인 카드: 종목 정보 + 게이지 */}
            <div style={{marginTop:14,padding:"18px",borderRadius:14,background:`linear-gradient(135deg,${signal.bg},rgba(0,0,0,0.2))`,border:`1px solid ${signal.color}33`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:2,marginBottom:6}}>선택 종목</div>
                <div style={{fontSize:22,fontWeight:900,color:stockInfo.color}}>{stockInfo.icon} {sel}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:10}}>{stockInfo.label}</div>
                <div style={{fontSize:30,fontWeight:900,fontFamily:"'Space Mono',monospace"}}>${sd.price}</div>
                <div style={{marginTop:6,fontSize:11,color:"rgba(255,255,255,0.4)"}}>
                  <InfoLabel id="mdd" label="MDD"/> <span style={{color:sd.mdd<-20?"#ff4757":sd.mdd<-10?"#ff9a3c":"rgba(255,255,255,0.5)",fontWeight:700}}>{sd.mdd}%</span>
                  {" · "}
                  <InfoLabel id="vol_ratio" label="거래량"/> <span style={{color:sd.vol_ratio>1.3?"#ffd700":"rgba(255,255,255,0.5)",fontWeight:700}}>{sd.vol_ratio}x</span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:2,marginBottom:6,textAlign:"center"}}>종합 매수 점수</div>
                <Gauge score={scores.total}/>
                <div style={{marginTop:8,fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"center",padding:"6px 10px",background:"rgba(0,0,0,0.2)",borderRadius:6,lineHeight:1.5}}>{mode.scoreDesc[signal.label]}</div>
              </div>
            </div>

            {/* ✅ 선택 종목 미니 차트 */}
            <div style={{marginTop:10,...C({padding:"13px 12px"})}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:stockInfo.color}}>{stockInfo.icon} {sel} — {mode.chartLabel} 차트</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>
                    52주 고점 <span style={{color:"#ff4757",fontFamily:"'Space Mono',monospace"}}>${sd.high52}</span>
                  </span>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>
                    저점 <span style={{color:"#00ff88",fontFamily:"'Space Mono',monospace"}}>${sd.low52}</span>
                  </span>
                </div>
              </div>
              <MiniChart history={sd.history} color={stockInfo.color} chartDays={mode.chartDays}/>
            </div>

            {/* 점수 분해 */}
            <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[{label:"기술적",val:scores.tech,w:mode.wLabel.tech},{label:"심리",val:scores.sent,w:mode.wLabel.sent},{label:"거시",val:scores.macro,w:mode.wLabel.macro},{label:"펀더멘털",val:scores.fund,w:mode.wLabel.fund}].map(c=>{
                const cs=sig(c.val);
                return(<div key={c.label} style={C()}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:4}}>{c.label} <span style={{color:"rgba(255,255,255,0.2)"}}>({c.w})</span></div>
                  <div style={{fontSize:20,fontWeight:900,color:cs.color,fontFamily:"'Space Mono',monospace"}}>{c.val}</div>
                  <div style={{marginTop:5,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2}}><div style={{width:`${c.val}%`,height:"100%",background:cs.color,borderRadius:2}}/></div>
                </div>);
              })}
            </div>

            {/* 워치리스트 그리드 */}
            <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {stocks.map(s=>{
                const d2=stockData[s.id]; if(!d2)return null;
                const sc=calcScore(d2,mode.weights).total; const sg=sig(sc);
                return(<div key={s.id} onClick={()=>setSel(s.id)} className="ch" style={{padding:"11px",borderRadius:10,cursor:"pointer",background:sel===s.id?`rgba(${rgb(s.color)},0.1)`:"rgba(255,255,255,0.03)",border:sel===s.id?`1px solid ${s.color}55`:"1px solid rgba(255,255,255,0.07)",transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:s.color}}>{s.icon} {s.id}</span>
                    <span style={{fontSize:10,color:sg.color,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{sc}점</span>
                  </div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                    <div style={{flex:1,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2}}><div style={{width:`${sc}%`,height:"100%",background:sg.color,borderRadius:2}}/></div>
                    <span style={{fontSize:9}}>{sg.emoji}</span>
                  </div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>${d2.price} · MDD {d2.mdd}%</div>
                </div>);
              })}
            </div>

            {/* ✅ 거시경제 신호등 패널 */}
            <MacroSnapshot investMode={investMode}/>
          </div>
        )}

        {/* ── 종목 상세 탭 ── */}
        {tab==="detail"&&sd&&(
          <div style={{animation:"slideIn 0.35s ease",marginTop:14}}>
            {/* 차트 */}
            <div style={C({padding:"14px 12px"})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:stockInfo.color}}>{stockInfo.icon} {sel} — {mode.chartLabel} 차트</div>
                <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:`rgba(${rgb(mode.color)},0.1)`,border:`1px solid rgba(${rgb(mode.color)},0.2)`,color:mode.color}}>{mode.emoji} {mode.label}</span>
              </div>
              <MiniChart history={sd.history} color={stockInfo.color} chartDays={mode.chartDays}/>
            </div>

            {/* 기술지표 */}
            <div style={{marginTop:10}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:2,marginBottom:8}}>📐 기술적 지표</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  {id:"rsi",value:sd.rsi,desc:sd.rsi<30?"🟢 과매도 — 매수 기회":sd.rsi>70?"🔴 과매수 — 주의":"🟡 중립",color:sd.rsi<30?"#00ff88":sd.rsi>70?"#ff4757":"#ffd700"},
                  {id:"macd",value:sd.macd,desc:sd.macd<-5?"🟢 강한 하락 모멘텀 소진":sd.macd<0?"🟢 하락 약화":"🔴 상승 과열 가능",color:sd.macd<0?"#00ff88":"#ff4757"},
                  {id:"bb_pos",value:`${sd.bb_pos}%`,desc:sd.bb_pos<20?"🟢 하단 — 강한 매수":sd.bb_pos>80?"🔴 상단 — 과열":"🟡 중간",color:sd.bb_pos<20?"#00ff88":sd.bb_pos>80?"#ff4757":"#ffd700"},
                  {id:"ma50",value:`$${sd.ma50}`,desc:sd.price<sd.ma50?"🟢 이하 — 지지 기대":"🟠 위 — 부담",color:sd.price<sd.ma50?"#00ff88":"#ff9a3c"},
                  {id:"ma200",value:`$${sd.ma200}`,desc:sd.price>sd.ma200?"🟢 장기 상승 유지":"🔴 추세선 하회",color:sd.price>sd.ma200?"#00ff88":"#ff4757"},
                  {id:"ma200_slope",value:`${sd.ma200_slope>0?"+":""}${sd.ma200_slope}%`,desc:sd.ma200_slope>0.3?"🟢 우상향 — 장기 추세 건전":sd.ma200_slope<-0.5?"🔴 우하향 — 장기 추세 훼손":"🟡 횡보",color:sd.ma200_slope>0.3?"#00ff88":sd.ma200_slope<-0.5?"#ff4757":"#ffd700"},
                  {id:"mdd",value:`${sd.mdd}%`,desc:sd.mdd<-30?"🟢 30%↑ 급락 — 강한 역발상":sd.mdd<-20?"🟢 20%↑ 조정 — 매수 우호":sd.mdd>-5?"🔴 고점 근처 — 신중":"🟡 중간",color:sd.mdd<-20?"#00ff88":sd.mdd>-5?"#ff4757":"#ffd700"},
                  {id:"vol_ratio",value:`${sd.vol_ratio}x`,desc:sd.vol_signal==="공포 매도 감지"?"🟢 공포 매도 클라이맥스":sd.vol_ratio>1.3&&sd.price>sd.ma50?"🔴 과열 거래량":"🟡 "+sd.vol_signal,color:sd.vol_signal==="공포 매도 감지"?"#00ff88":sd.vol_ratio>1.3&&sd.price>sd.ma50?"#ff4757":"#ffd700"},
                  {id:"week52_pos",value:`${sd.week52_pos}%`,desc:sd.week52_pos<25?"🟢 52주 저점 근처":sd.week52_pos>80?"🔴 52주 고점 근처":"🟡 중간",color:sd.week52_pos<25?"#00ff88":sd.week52_pos>80?"#ff4757":"#ffd700"},
                  {id:"rs_vs_qqqm",value:`${sd.rs_vs_qqqm>0?"+":""}${sd.rs_vs_qqqm}%`,desc:sd.rs_vs_qqqm>10?"🟢 QQQM보다 강세 — 선도주":sd.rs_vs_qqqm<-15?"🔴 QQQM보다 약세":"🟡 유사한 흐름",color:sd.rs_vs_qqqm>10?"#00ff88":sd.rs_vs_qqqm<-15?"#ff4757":"#ffd700"},
                ].map((it,i)=>{
                  const isKey=KEY_INDICATORS[investMode]?.includes(it.id);
                  const labelMap={rsi:"RSI (14)",macd:"MACD",bb_pos:"볼린저밴드",ma50:"50일 이평선",ma200:"200일 이평선",ma200_slope:"200일선 기울기",mdd:"MDD (고점낙폭)",vol_ratio:"거래량 비율",week52_pos:"52주 가격대",rs_vs_qqqm:"QQQM 상대강도"};
                  return(<div key={i} style={{...C(),background:isKey?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.03)",border:isKey?`1px solid ${investMode==="dca"?"rgba(0,212,255,0.2)":"rgba(255,154,60,0.2)"}`:"1px solid rgba(255,255,255,0.07)",position:"relative"}}>
                    {isKey&&<div style={{position:"absolute",top:8,right:8,fontSize:10,color:investMode==="dca"?"#00d4ff":"#ff9a3c",fontWeight:900}}>⭐</div>}
                    <div style={{marginBottom:4}}><InfoLabel id={it.id} label={labelMap[it.id]||it.id} mode={investMode}/></div>
                    <div style={{fontSize:20,fontWeight:900,fontFamily:"'Space Mono',monospace",color:it.color,marginBottom:3}}>{it.value}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.55)"}}>{it.desc}</div>
                  </div>);
                })}
              </div>
            </div>

            {/* 펀더멘털 */}
            <div style={{marginTop:10,padding:"14px",borderRadius:11,background:"rgba(251,188,4,0.05)",border:"1px solid rgba(251,188,4,0.15)"}}>
              <div style={{fontSize:11,color:"#fbbc04",fontWeight:700,marginBottom:11}}>📊 펀더멘털 지표</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {[
                  {id:"pe",value:sd.pe,sub:`5년 평균 ${sd.peAvg}`,color:sd.pe<sd.peAvg?"#00ff88":sd.pe>sd.peAvg*1.3?"#ff4757":"#ffd700",desc:sd.pe<sd.peAvg*0.8?"강력 저평가":sd.pe<sd.peAvg?"저평가":sd.pe>sd.peAvg*1.3?"고평가":"적정"},
                  {id:"peg",value:sd.peg||"N/A",sub:"P/E ÷ EPS성장률",color:sd.peg&&sd.peg<1?"#00ff88":sd.peg&&sd.peg>3?"#ff4757":"#ffd700",desc:sd.peg&&sd.peg<1?"성장 대비 저평가":sd.peg&&sd.peg<1.5?"적정":"고평가"},
                  {id:"eps_growth",value:`${sd.eps_growth>0?"+":""}${sd.eps_growth}%`,sub:"전년 대비 EPS 성장률",color:sd.eps_growth>15?"#00ff88":sd.eps_growth>0?"#ffd700":"#ff4757",desc:sd.eps_growth>15?"고성장":sd.eps_growth>0?"성장중":"역성장"},
                  {id:"analyst_target",value:`$${sd.analyst_target}`,sub:`+${(((sd.analyst_target-sd.price)/sd.price)*100).toFixed(1)}% 업사이드`,color:sd.analyst_target>sd.price*1.15?"#00ff88":sd.analyst_target<sd.price?"#ff4757":"#ffd700",desc:"12개월 컨센서스"},
                ].map((f,i)=>(<div key={i} style={{padding:"10px",background:"rgba(0,0,0,0.2)",borderRadius:8}}>
                  <div style={{marginBottom:4}}><InfoLabel id={f.id} label={f.id==="pe"?"P/E 비율":f.id==="peg"?"PEG 비율":f.id==="eps_growth"?"EPS 성장률":"애널 목표가"} mode={investMode}/></div>
                  <div style={{fontSize:18,fontWeight:900,fontFamily:"'Space Mono',monospace",color:f.color}}>{f.value}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>{f.sub}</div>
                  <div style={{fontSize:10,color:f.color,marginTop:1,fontWeight:600}}>{f.desc}</div>
                </div>))}
              </div>
              <div style={{marginTop:9,padding:"9px 11px",borderRadius:7,background:"rgba(0,0,0,0.15)",border:`1px solid ${sd.insider>0?"rgba(0,255,136,0.2)":"rgba(255,255,255,0.06)"}`}}>
                <div style={{marginBottom:4}}><InfoLabel id="insider" label="내부자 매수 (Insider Buying)" mode={investMode}/></div>
                <div style={{fontSize:15,fontWeight:700,color:sd.insider===2?"#00ff88":sd.insider===1?"#ffd700":"rgba(255,255,255,0.4)"}}>
                  {sd.insider===2?"🟢 적극 매수 — 강한 저평가 신호":sd.insider===1?"🟡 소량 매수 확인":"⬜ 최근 3개월 내부자 매수 없음"}
                </div>
              </div>
            </div>

            {/* 점수 분해 */}
            <div style={{marginTop:10,padding:"13px",borderRadius:10,background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.15)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:11,color:"#00d4ff",fontWeight:700}}>📐 종합 매수 점수 분해</div>
                <div style={{fontSize:10,color:mode.color,padding:"2px 8px",borderRadius:5,background:`rgba(${rgb(mode.color)},0.1)`,border:`1px solid rgba(${rgb(mode.color)},0.2)`}}>{mode.emoji} {mode.label}</div>
              </div>
              {[{label:"기술적",val:scores.tech,w:mode.wLabel.tech},{label:"심리",val:scores.sent,w:mode.wLabel.sent},{label:"거시",val:scores.macro,w:mode.wLabel.macro},{label:"펀더멘털",val:scores.fund,w:mode.wLabel.fund}].map(c=>{
                const cs=sig(c.val);
                return(<div key={c.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",minWidth:65}}>{c.label}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",minWidth:28}}>{c.w}</div>
                  <div style={{flex:1,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3}}><div style={{width:`${c.val}%`,height:"100%",background:cs.color,borderRadius:3,transition:"width 0.8s"}}/></div>
                  <div style={{fontSize:12,fontWeight:700,color:cs.color,fontFamily:"'Space Mono',monospace",minWidth:28,textAlign:"right"}}>{c.val}</div>
                </div>);
              })}
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)"}}>종합</span>
                  <span style={{fontSize:20,fontWeight:900,color:signal.color,fontFamily:"'Space Mono',monospace"}}>{scores.total}점 {signal.emoji} {signal.label}</span>
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",padding:"7px 10px",background:"rgba(0,0,0,0.2)",borderRadius:7,lineHeight:1.6}}>{mode.scoreDesc[signal.label]}</div>
              </div>
            </div>

          </div>
        )}

        {/* ── 거시경제 탭 ── */}
        {tab==="macro"&&(
          <div style={{animation:"slideIn 0.35s ease",marginTop:14}}>
            {/* 카테고리 탭 + 핵심 필터 */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.keys(MACRO_DEFS).map(cat=>(
                  <button key={cat} onClick={()=>{setMacroTab(cat);setKeyOnly(false);}} style={{padding:"6px 13px",borderRadius:7,fontSize:11,fontWeight:600,border:`1px solid ${macroTab===cat&&!keyOnly?"rgba(0,212,255,0.5)":"rgba(255,255,255,0.1)"}`,background:macroTab===cat&&!keyOnly?"rgba(0,212,255,0.1)":"rgba(255,255,255,0.03)",color:macroTab===cat&&!keyOnly?"#00d4ff":"rgba(255,255,255,0.4)",cursor:"pointer",transition:"all 0.2s"}}>
                    {cat} <span style={{fontSize:9,opacity:0.6}}>({MACRO_DEFS[cat].length})</span>
                  </button>
                ))}
              </div>
              {/* ✅ 핵심 지표 필터 버튼 */}
              <button onClick={()=>setKeyOnly(o=>!o)} style={{padding:"6px 13px",borderRadius:7,fontSize:11,fontWeight:700,border:`1px solid ${keyOnly?mode.color:"rgba(255,255,255,0.15)"}`,background:keyOnly?`rgba(${rgb(mode.color)},0.15)`:"rgba(255,255,255,0.03)",color:keyOnly?mode.color:"rgba(255,255,255,0.45)",cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap",flexShrink:0}}>
                ⭐ 핵심만 보기 {keyOnly&&`(${KEY_INDICATORS[investMode]?.filter(id=>[...MACRO_DEFS.심리,...MACRO_DEFS.유동성,...MACRO_DEFS.금리통화,...MACRO_DEFS.경기사이클,...MACRO_DEFS.시장구조].find(d=>d.id===id)).length}개)`}
              </button>
            </div>

            {/* 지표 카드 목록 */}
            {keyOnly?(
              // ✅ 핵심 지표만 보기: 모든 카테고리에서 핵심 지표만 추출
              <div>
                {Object.entries(MACRO_DEFS).map(([cat,inds])=>{
                  const filtered=inds.filter(ind=>KEY_INDICATORS[investMode]?.includes(ind.id));
                  if(filtered.length===0)return null;
                  return(
                    <div key={cat} style={{marginBottom:16}}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:2,marginBottom:8,paddingLeft:2}}>{cat}</div>
                      <div style={{display:"grid",gap:9}}>
                        {filtered.map(ind=><MacroCard key={ind.id} ind={ind} mode={investMode}/>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{display:"grid",gap:9}}>
                {MACRO_DEFS[macroTab].map(ind=><MacroCard key={ind.id} ind={ind} mode={investMode}/>)}
              </div>
            )}

            {/* ✅ 거시환경 종합 판단 */}
            <MacroSummary/>
          </div>
        )}

        <div style={{marginTop:28,padding:"12px",borderTop:"1px solid rgba(255,255,255,0.05)",textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.15)",lineHeight:1.8}}>
          ⚠️ 참고용 정보 제공이며 투자 권유가 아닙니다. 모든 투자 결정의 책임은 투자자 본인에게 있습니다.<br/>
          주가 데이터는 최대 15~20분 지연될 수 있습니다. 지표 이름의 <span style={{color:"rgba(0,212,255,0.4)"}}>ⓘ</span> 를 클릭하면 상세 설명을 볼 수 있습니다.
        </div>
      </div>
    </div>
  );
}
