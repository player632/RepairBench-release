// Deterministic offline news feed (adaptation: replaces min-api.cryptocompare.com).
// Shape matches the cryptocompare /data/v2/news response consumed by CryptoNews.vue:
// { Data: [ { id, url, imageurl, title, body, source_info: { name }, published_on } ] }.
// Bodies exceed 135 chars so the truncateText branch stays covered.

const IMAGE = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='48'%20height='48'%3E%3Crect%20width='48'%20height='48'%20fill='%23cccccc'/%3E%3C/svg%3E";
const BASE_TIME = 1750000000;

const articles = [
  {
    id: '1',
    url: 'https://example.local/news/bitcoin-etf-inflows',
    imageurl: IMAGE,
    title: 'Bitcoin ETF Inflows Hit Record High as Institutional Demand Builds',
    body: 'Spot bitcoin funds recorded their largest weekly inflow of the year, with desks citing treasury allocation mandates and improving custody infrastructure as the main drivers behind the sustained buying pressure across venues.',
    source_info: { name: 'Market Wire' },
    published_on: BASE_TIME - 3600
  },
  {
    id: '2',
    url: 'https://example.local/news/ethereum-upgrade-fees',
    imageurl: IMAGE,
    title: 'Ethereum Upgrade Cuts Network Fees for Layer Two Users',
    body: 'The latest network upgrade trimmed calldata costs, and layer two operators report noticeably cheaper transfers for end users while validators see no meaningful change in their operating requirements or staking yield.',
    source_info: { name: 'Chain Daily' },
    published_on: BASE_TIME - 7200
  },
  {
    id: '3',
    url: 'https://example.local/news/zero-fee-trading',
    imageurl: IMAGE,
    title: 'Exchange Launches Zero-Fee Trading for Select Spot Pairs',
    body: 'A major venue announced zero-fee promotions on a basket of major spot pairs, intensifying the race for retail order flow. Analysts expect margins to stay under pressure through the remainder of the quarter.',
    source_info: { name: 'Block Report' },
    published_on: BASE_TIME - 10800
  },
  {
    id: '4',
    url: 'https://example.local/news/stablecoin-framework',
    imageurl: IMAGE,
    title: 'Regulators Outline New Framework for Stablecoin Issuers',
    body: 'The draft framework spells out reserve attestation cadence, redemption windows and disclosure duties for issuers. Industry groups welcomed the clarity while asking for longer implementation timelines.',
    source_info: { name: 'Ledger Times' },
    published_on: BASE_TIME - 14400
  },
  {
    id: '5',
    url: 'https://example.local/news/long-term-holders',
    imageurl: IMAGE,
    title: 'Onchain Data Shows Long-Term Holders Accumulating Again',
    body: 'Coin-age metrics moved higher for a third straight week, suggesting conviction buyers are absorbing exchange supply. Derivatives funding stayed flat, pointing to spot-led accumulation rather than leverage.',
    source_info: { name: 'Node Journal' },
    published_on: BASE_TIME - 18000
  }
];

export function fetchNews() {
  return Promise.resolve({ Data: articles });
}
