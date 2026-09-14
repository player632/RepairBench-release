import { sample } from 'lodash';

const PRICE = { MIN: 25, MAX: 250 };
const BETA = { MIN: 1, MAX: 2 };
const VOLAVG = { MIN: 10000, MAX: 1000000 };
const MKTCAP = { MIN: 10000000, MAX: 50000000000 };
const LASTDIV_PERC = { MIN: 0, MAX: 0.03 };
const RANGESPREAD_PERC = { MIN: 0.02, MAX: 0.05 };
const CHANGESPERC = { MIN: 0.01, MAX: 0.05 };

const SECTOR_INDUSTRY = {
    'Technology': ['Computer Hardware', 'Online Media', 'SemiConductor', 'Application Software'],
    'Consumer': ['Restaurant', 'Utilities', 'Retail', 'Entertainment', 'Apparel'],
    'Health Care': ['Medical Device'],
    'Industrial': ['Airlines', 'Manufacturing'],
    'Financial Services': ['Brokers & Exchanges', 'Banks']
};

const EXCHANGE = ['NASDAQ', 'NYSE'];

class CompanyDataGenerator {
    constructor() {

    }

    getPrice() {
        return getRandomNumberBetween(PRICE.MIN, PRICE.MAX);
    }

    getBeta() {
        return getRandomNumberBetween(BETA.MIN, BETA.MAX, true);
    }

    getVolAvg() {
        return `${getRandomNumberBetween(VOLAVG.MIN, VOLAVG.MAX).toLocaleString('US')}`;
    }

    getMktCap() {
        return `$${getRandomNumberBetween(MKTCAP.MIN, MKTCAP.MAX).toLocaleString('US')}`;
    }

    getLastDiv(price) {
        return (price * getRandomNumberBetween(LASTDIV_PERC.MIN, LASTDIV_PERC.MAX, true)).toFixed(2);
    }

    getRange(price) {
        return `$${(price - price * RANGESPREAD_PERC.MIN).toFixed(2)} 
                - $${(price + price * RANGESPREAD_PERC.MAX).toFixed(2)}`
    }

    getChangePerc() {
        return getRandomNumberBetween(CHANGESPERC.MIN, CHANGESPERC.MAX, true);
    }

    getChange(price, changePerc) {
        return (price * changePerc).toFixed(2);
    }

    getCompanyFinancial() {
        const Price = this.getPrice();
        const Beta = this.getBeta();
        const VolAvg = this.getVolAvg();
        const MktCap = this.getMktCap();
        const LastDiv = this.getLastDiv(Price);
        const Range = this.getRange(Price);
        const ChangePerc = this.getChangePerc();
        const Change = this.getChange(Price, ChangePerc);
        return {
            Price: `$${Price}`,
            Beta,
            VolAvg,
            MktCap,
            LastDiv,
            Range,
            ChangePerc: `${ChangePerc * 100}%`,
            Change
        }
    }

    getDescription(name, sector) {
        const randomYear = getRandomNumberBetween(5, 50);
        return `${name} is an excellent company in ${sector} sector for past ${randomYear} years producing outstanding results for it's shareholders.`
    }

    getExchange() {
        return sample(EXCHANGE);
    }

    getIndustry(sector) {
        return sample(SECTOR_INDUSTRY[sector]);
    }

    getSector() {
        return sample(Object.keys(SECTOR_INDUSTRY));
    }

    getWebsite(ticker) {
        return `http://www.${ticker.toLowerCase()}.com`
    }

    getCompanyProfile(ticker) {
        const companyName = ticker.toUpperCase();
        const exchange = this.getExchange();
        const sector = this.getSector();
        const industry = this.getIndustry(sector);
        const website = this.getWebsite(ticker);
        const description = this.getDescription(companyName, sector);
        return {
            companyName,
            description,
            exchange,
            industry,
            sector,
            website
        }
    }
}

// [adaptation] Deterministic stand-in for the entropy source ONLY. Every call site, the function
// signature, the value ranges, the toFixed(2)/Math.floor shapes and the distribution are unchanged;
// the two Math.random() draws below are the whole non-deterministic surface of this repository
// (RECON §3: 0 network, 0 Date/now, 0 crypto, 0 storage), so one seeded stream makes the derived
// numbers reproducible across legs. lodash sample() at :86/:90/:94 is deliberately left alone -
// reseeding it would mean changing the call shape, and no assertion reads a sampled value: they read
// key sets, formats and relational invariants (meta.behavior_rules_out_of_scope).
const RB_PRNG_SEED = 20260909;
let rbPrngState = RB_PRNG_SEED >>> 0;
function rbDeterministicRandom() {
    rbPrngState = (rbPrngState + 0x6D2B79F5) >>> 0;
    let t = rbPrngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getRandomNumberBetween(min, max, floatResult) {
    if (floatResult) {
        return (rbDeterministicRandom() * (max - min) + min).toFixed(2);
    }
    return Math.floor(min + (max - min + 1) * rbDeterministicRandom());
}

export default new CompanyDataGenerator();