<template>
    <div class="coin-box" :data-testid="'card-' + info.symbol" @dblclick.stop="openDetails">
        <div class="row no-gutters coin-info">
            <div class="col-7">
                <div class="font-weight-bold" data-testid="cc-name">{{info.name}}</div>
                <div class="row no-gutters mt-1">
                    <div class="box-icon">
                        <span :style="{ backgroundImage : 'url('+ iconbase +')' }"></span>
                    </div>
                    <div class="col text-left">
                        <div data-testid="cc-pair"><b>{{info.base}}</b>/{{info.quote}}</div>
                        <div class="coin-price" data-testid="cc-price" :data-price="ticker.price" v-if="ticker.price">{{ticker.price || '' }}<span style="font-size: x-small; font-weight: 700; padding-left: 3px;">{{info.quote}}</span></div>
                    </div>
                </div>
            </div>
            <div :class="[(ticker.percent < 0)?'down':'up', 'col-5','text-right']" v-if="ticker.price">
                <div class="coin-per" data-testid="cc-percent" :data-dir="(ticker.percent<0)?'down':'up'"><span class="indicator"></span><span>{{ ticker.percent }}%</span></div>
                <div class="coin-chg" data-testid="cc-chg">{{parseFloat(ticker.chg).toFixed((info.quote === 'USDT') ? 3 : 8)}} </div>
                <div data-testid="cc-vol"><span class="text-secondary">Vol:</span> <span class="text-dark">{{ ticker.vol }}</span></div>
            </div>
            <div class="dd-container" :class="[{'show': showDropDown}]" v-click-outside="closeDropDown">
                    <span role="button" class="menu-btn" data-testid="menu-btn" @click.stop="closeDropDown">
                        <i class="fa fa-ellipsis-v" aria-hidden="true"></i>
                    </span>
                <div class="dd-menu" data-testid="dd-menu" v-if="showDropDown">
                    <span class="dd-item" data-testid="dd-item-open" @click="openDetails">Open</span>
                    <span class="dd-item" data-testid="dd-item-delete" @click="removeCard">Delete</span>
                </div>
            </div>
        </div>
        <div class="sparkline-chart" :data-testid="'sparkline-' + info.symbol" v-if="ticker.price">
            <Sparkline :cdata="ticker.price" :width="380" :height="90"></Sparkline>
        </div>
    </div>
</template>
<script>
  import Sparkline from './Sparkline.vue'
  import {unSubscribeSymbol} from '../services/binance'
  const COIN_ICON_URI = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='64'%20height='64'%3E%3Ccircle%20cx='32'%20cy='32'%20r='30'%20fill='%23f7931a'/%3E%3C/svg%3E" // local placeholder (adaptation: coinmarketcap icons removed)
  export default {
    props: ['ticker', 'info'],
    data() {
      return {
        showDropDown: false
      }
    },
    computed: {
        iconbase() {
            return COIN_ICON_URI
        }
    },
    methods: {
      onDropDown() {
        this.showDropDown = true;
      },
      removeCard() {
        this.showDropDown = false;
        unSubscribeSymbol(this.info.symbol);
        this.$store.commit('REMOVE_COIN_PAIR', this.info.symbol)
      },
      openDetails() {
        this.showDropDown = false;
        this.$router.push({name: 'infoview', params: { 'symbol': this.info.symbol }})
      },
      closeDropDown() {
        this.showDropDown = false;
      }
    },
    components: {
      Sparkline
    }
  }
</script>
