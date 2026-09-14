function noop() {}
import { getStream, TICK_PERIOD_MS } from '../fixtures/streams';
// Deterministic offline replay of the websocket contract (adaptation).
// Signature unchanged: export default function(url, opts); the stream name is the
// last url segment (e.g. btcusdt@ticker). onopen fires asynchronously before the
// first message; messages tick every 500ms; exhausted sequences repeat the last
// payload (plateau); close() clears the timer and reports onclose({code:1000}).
export default function (url, opts) {
  opts = opts || {};
  const streamName = String(url).split('/').pop();
  const messages = getStream(streamName);
  let index = 0;
  let timer = null;
  let closed = false;

  const self = {
    close: (x) => {
      if (closed) return;
      closed = true;
      if (timer) clearInterval(timer);
      timer = null;
      (opts.onclose || noop)({ code: x || 1000, endpoint: url });
    }
  };

  const emit = () => {
    if (closed) return;
    const payload = index < messages.length ? messages[index] : messages[messages.length - 1];
    index += 1;
    (opts.onmessage || noop)({ data: JSON.stringify(payload) });
  };

  setTimeout(() => {
    if (closed) return;
    (opts.onopen || noop)({ endpoint: url });
    emit();
    timer = setInterval(emit, TICK_PERIOD_MS);
  }, 50);

  return self;
}
