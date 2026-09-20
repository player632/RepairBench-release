// [repair-bench adaptation] offline stand-in for the shipped obfuscated score sender.
// The file this replaces is a javascript-obfuscator bundle whose only functional payload is
// Highscore.prototype.sendScore: it base64-encodes { name, score }, swaps every '=' for '$',
// reverses the string and POSTs it to the project's own score endpoint on a host outside this
// tree (the host and path are deliberately not spelled out here: the served face is checked for
// surviving outside references by plain substring, and a comment must not trip that check). The
// same bundle also overwrites console.log/warn/debug/info/error/trace with no-ops and runs a
// self-defending debugger recursion at load time.
// The verifier runs with no network at all, so the POST sink is repointed at the browser's own
// same-origin storage. The payload derivation is preserved step for step (so the encoding chain
// stays observable to the checkpoints), and the console silencing plus the debugger recursion are
// dropped: neither is part of the tested surface, and both would otherwise hide the harness's own
// diagnostics. Nothing else in the tree reads or writes this key.
var zombiegame = zombiegame || {};

zombiegame.Highscore.prototype.sendScore = function () {
  let payload = JSON.stringify({
    'name': zombiegame.game.model.playername,
    'score': parseInt(this.score)
  });

  payload = btoa(payload).replace(new RegExp('=', 'g'), '$').split('').reverse().join('');

  try {
    localStorage.setItem('zombiehunter.score.sent', payload);
  } catch (e) {
    // upstream this is a fire-and-forget beacon whose reply is thrown away
  }
};
