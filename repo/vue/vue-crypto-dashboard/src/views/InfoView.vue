<template>
    <div class="container-fluid">
        <div class="row flex-xl-nowrap">
            <div class="col">
                <div class="row">
                    <div class="col-md-8 mb-3">
                        <div class="info-card">
                            <div class="row">
                                <div class="col">
                                    <span class="coin-img" data-testid="coin-img" :style="{ backgroundImage : coinIcon }"></span>
                                    <div class="coin-name" data-testid="info-name">{{currency.name}} ({{currency.base}}) / <span class="small">{{currency.quote}}</span></div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <span class="price" data-testid="info-price" :data-pchg="ticker.pchg" :style="{'color': (ticker.pchg && ticker.pchg > 0) ? 'green':'red'}">{{ticker.price}}<span class="x-small"> {{currency.quote}}</span></span>
                                </div>
                                <div class="col-md-6 chg-block" :class="[(ticker.percent < 0)?'down':'up']">
                                    <div class="text-dark small text-right">24h Chg</div>
                                    <div class="text-right d-flex justify-content-end">
                                        <span class="indicator"></span><span data-testid="info-percent">{{ ticker.percent }}%</span>
                                    </div>
                                    <div class="icon-chg text-right" data-testid="info-chg">
                                        {{parseFloat(ticker.chg).toFixed((currency.quote === 'USDT') ? 3 : 8)}} <span class="x-small">{{currency.quote}}</span>
                                    </div>
                                </div>
                                <div class="col-12 x-small" data-testid="info-time">{{ticker.time | timeformat}}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="info-card justify-content-center">
                            <div data-testid="detail-open"><span class="info-label">24H OPEN  </span>{{ ticker.open | priceformat }}<span class="small"> {{currency.quote}}</span></div>
                            <div data-testid="detail-high"><span class="info-label">24H HIGH  </span>{{ ticker.high | priceformat }}<span class="small"> {{currency.quote}}</span></div>
                            <div data-testid="detail-low"><span class="info-label">24H LOW  </span>{{ ticker.low | priceformat }}<span class="small"> {{currency.quote}}</span></div>
                            <div data-testid="detail-vol"><span class="info-label">24H VOL  </span>{{ ticker.vol }}<span class="small"> {{currency.base}}</span></div>
                        </div>
                    </div>
                    <div class="col-12 mb-3">
                        <coin-charts :symbol="symbol"></coin-charts>
                    </div>
                </div>
            </div>
            <div class="col news-section">
                <crypto-news></crypto-news>
            </div>
        </div>
    </div>
</template>
<script>
  import CryptoNews from '../components/CryptoNews.vue'
  import CoinCharts from '../components/CoinCharts.vue'
  const COIN_ICON_URI = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='64'%20height='64'%3E%3Ccircle%20cx='32'%20cy='32'%20r='30'%20fill='%23f7931a'/%3E%3C/svg%3E" // local placeholder (adaptation: coinmarketcap icons removed)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  export default {
    props:['symbol'],
    name: 'info-view',
    data() {
      return {

      };
    },
    filters: {
      priceformat: function(value) {
        if(!value) return "";
        return parseFloat(value).toLocaleString()
      },
      timeformat: function(value) {
        if(!value) return "";
        const dt = new Date(value);
        return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.toTimeString().split(' ')[0]}`
      }
    },
    components: {
      CryptoNews,
      CoinCharts
    },
    computed: {
      coinIcon() {
        return "url('" + COIN_ICON_URI + "')"
      },
      currency() {
        return this.$store.getters.getSymbolById(this.symbol) || {}
      },
      ticker() {
        return this.$store.getters.getTickerById(this.symbol) || {}
      }
    }
  }
</script>
