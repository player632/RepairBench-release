/* Offline media stand-in - harness furniture, NOT part of the application under test.
   The upstream demo page pointed its media element at a remote trailer file and its caption
   tracks at a remote code-hosting origin. This tree has to run with no network at all, so the
   media is generated locally instead: a silent PCM WAV blob whose duration is exactly the number
   of seconds asked for, which makes every time-based reading in the checkpoints reproducible to
   the millisecond and independent of any host, clock or bandwidth.
   Two window members are added, both prefixed rb, and neither one touches the player's own code:
   the player is constructed by the page exactly as upstream does it, from the same document, with
   the same options, and reads the media source off the media element the way it always did. */
(function () {
  'use strict';
  function wavUrl(seconds) {
    var rate = 8000;
    var frames = Math.round(rate * seconds);
    var buffer = new ArrayBuffer(44 + frames * 2);
    var view = new DataView(buffer);
    function ascii(offset, text) {
      for (var i = 0; i < text.length; i++) { view.setUint8(offset + i, text.charCodeAt(i)); }
    }
    ascii(0, 'RIFF');
    view.setUint32(4, 36 + frames * 2, true);
    ascii(8, 'WAVE');
    ascii(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    ascii(36, 'data');
    view.setUint32(40, frames * 2, true);
    for (var k = 0; k < frames; k++) { view.setInt16(44 + k * 2, 0, true); }
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  }
  window.rbMedia = wavUrl;
  window.rbAttachMedia = function (id, seconds) {
    var el = document.getElementById(id);
    if (!el) { return null; }
    el.muted = true;
    el.setAttribute('playsinline', '');
    el.src = wavUrl(seconds);
    return el.src;
  };
})();
