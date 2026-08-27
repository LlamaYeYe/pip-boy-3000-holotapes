(function () {
  var V = 'v3.51nolog',
    fs = require('fs'),
    B = 'HOLO/Project_Sophia/',
    C = B + 'SOPHIA_CONFIG.JSON',
    q = global.__PipCoSophiaService || global.__PipCoYesManService,
    c,
    t,
    f;
  if (q && q.version !== V) {
    try {
      if (q.destroy) q.destroy();
    } catch (e) {}
    q = 0;
    try {
      process.memory(true);
      E.defrag();
    } catch (e) {}
  }
  function g() {
    try {
      c = JSON.parse(fs.readFileSync(C));
      return {
        enabled: c.enabled ? 1 : 0,
        companion: c.companion || 'YES_MAN',
      };
    } catch (e) {
      return { enabled: 0, companion: 'YES_MAN' };
    }
  }
  try {
    if (!q) {
      c = g();
      t = fs.readFileSync(B + 'SOPHIA_SERVICE.JS');
      f = Function('return ' + t)();
      t = 0;
      try {
        process.memory(true);
        E.defrag();
      } catch (e) {}
      q = f(c, fs, B);
      f = 0;
      c = 0;
    }
    if (q) {
      try {
        if (q.statusDetach) q.statusDetach();
      } catch (e) {}
      try {
        if (q.setEnabled) q.setEnabled(0);
        else q.enabled = 0;
      } catch (e) {}
    }
    try {
      process.memory(true);
      E.defrag();
    } catch (e) {}
    t = fs.readFileSync(B + 'SOPHIA_UI.JS');
    f = Function('return ' + t)();
    t = 0;
    try {
      process.memory(true);
      E.defrag();
    } catch (e) {}
    return f();
  } catch (e) {
    try {
      console.log('SOPHIA BOOT FAIL ' + e);
    } catch (z) {}
    throw e;
  }
});
