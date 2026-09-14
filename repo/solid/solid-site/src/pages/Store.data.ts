import type { RouteLoadFunc } from '@solidjs/router';

// repair-bench adaptation (environment/adaptation.patch).
// This module built a hosted storefront client and issued GraphQL requests to a shop domain the
// moment the shop route loaded, and it read a cart identifier back out of a cookie to retrieve a
// real checkout. Ruling G3 classifies a runtime-fetched external resource as something to
// neutralise or vendor; a hosted storefront cannot be vendored under the 0-network rule, so the
// route now resolves to a same-origin inert stand-in. The returned SHAPE is the one the page
// already consumes (commerce.cart.{id,lines,totalItems,total,subtotal,tax,checkoutURL,attributes,
// note}, commerce.loading(), commerce.{retrieve,add,update,remove,formatTotal,setAttribute,
// updateAttributes}, loading, products), every collection is empty and every mutation resolves
// without doing anything, so the page renders its own empty state and its own disabled controls
// through the same code paths it always used. Nothing else in this file's contract changes: the
// route still returns synchronously, still exposes the same three getters, and the shopify
// primitive module is left byte-identical on disk (it is simply no longer reached from here).
const formatTotal = (total: number | string) => `$${Number(total || 0).toFixed(2)}`;
const noop = async () => undefined;

const inertCommerce = {
  cart: {
    cart: null,
    id: null as string | number | null,
    attributes: [] as unknown[],
    note: '',
    lines: [] as unknown[],
    totalItems: 0,
    tax: 0,
    checkoutURL: '/rb-inert-page.html?checkout=1',
    subtotal: 0,
    total: 0,
  },
  loading: () => false,
  retrieve: noop,
  add: noop,
  update: noop,
  remove: noop,
  formatTotal,
  setAttribute: noop,
  updateAttributes: noop,
};

export const StoreData: RouteLoadFunc = () => {
  return {
    get commerce() {
      return inertCommerce;
    },
    get loading() {
      return false;
    },
    get products() {
      return [];
    },
  };
};
