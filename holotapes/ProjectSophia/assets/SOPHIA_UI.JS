(function () {
  var fs = require('fs'),
    B = 'HOLO/Project_Sophia/',
    C = B + 'SOPHIA_CONFIG.JSON',
    s = 0,
    p = 0,
    r = 0,
    ot;
  function N(v) {
    v = String(v || '').toUpperCase();
    if (v === 'FISTO') return 'FISTO';
    if (v === 'KL-E-O' || v === 'KLEO') return 'KL-E-O';
    if (v === 'MK_II_STEALTH_SUIT' || v === 'MK II STEALTH SUIT')
      return 'MK_II_STEALTH_SUIT';
    if (
      v === 'ANDY' ||
      v === 'ANDY (MISTER HANDY)' ||
      v === 'ANDY - MISTER HANDY'
    )
      return 'ANDY';
    return 'YES_MAN';
  }
  function D(v) {
    v = N(v);
    return v === 'YES_MAN'
      ? 'YES MAN'
      : v === 'MK_II_STEALTH_SUIT'
        ? 'MK II Stealth Suit'
        : v === 'ANDY'
          ? 'Andy - Mister Handy'
          : v;
  }
  function L() {
    var x;
    try {
      x = JSON.parse(fs.readFileSync(C));
      return { enabled: x.enabled ? 1 : 0, companion: N(x.companion) };
    } catch (e) {}
    return { enabled: 0, companion: 'YES_MAN' };
  }
  var c = L();
  function S(v, w) {
    w = N(w);
    c.enabled = v ? 1 : 0;
    c.companion = w;
    try {
      fs.writeFileSync(
        C,
        '{"enabled":' + c.enabled + ',"companion":"' + w + '"}',
      );
    } catch (e) {}
    M(v ? 'ENABLE' : 'DISABLE', w);
  }
  function A(w) {
    return c.enabled && c.companion === w;
  }
  function T() {
    h.clear()
      .setColor(3)
      .setFontMonofonto16()
      .setFontAlign(0, -1)
      .drawString('S.O.P.H.I.A.', 240, 12)
      .drawString(
        'Speech-Optimized Personal Health & Information Assistant',
        240,
        38,
      )
      .drawLine(22, 62, 458, 62);
    h.setFontAlign(-1, -1);
  }
  function dm() {
    p = 0;
    if (s < 0 || s > 5) s = 0;
    T();
    h.drawString('Status: ' + (c.enabled ? 'Enabled' : 'Disabled'), 36, 72);
    if (c.enabled) h.drawString('Active: ' + D(c.companion), 36, 94);
    var a = [
        'YES MAN',
        'FISTO',
        'KL-E-O',
        'MK II Stealth Suit',
        'Andy - Mister Handy',
        '< Back',
      ],
      y = 140,
      i;
    for (i = 0; i < 6; i++) {
      if (i === s) Pip.shadeBox(22, y - 4, 458, y + 22);
      h.setColor(3).drawString(a[i], 36, y);
      y += 29;
    }
    h.flip();
  }
  function dc(w) {
    p =
      w === 'FISTO'
        ? 2
        : w === 'KL-E-O'
          ? 3
          : w === 'MK_II_STEALTH_SUIT'
            ? 4
            : w === 'ANDY'
              ? 5
              : 1;
    if (s < 0 || s > 2) s = 0;
    T();
    h.drawString(D(w), 36, 74).drawString(
      'Status: ' + (A(w) ? 'Enabled' : 'Disabled'),
      36,
      100,
    );
    var a = ['Enable', 'Disable', '< Back'],
      y = 146,
      i;
    for (i = 0; i < 3; i++) {
      if (i === s) Pip.shadeBox(22, y - 4, 458, y + 22);
      h.setColor(3).drawString(a[i], 36, y);
      y += 36;
    }
    h.flip();
  }
  function R() {
    var q = global.__PipCoSophiaService || global.__PipCoYesManService;
    try {
      if (!q) return 0;
      if (q.setCompanion) q.setCompanion(c.companion);
      if (q.setEnabled) q.setEnabled(c.enabled ? 1 : 0);
      else q.enabled = c.enabled ? 1 : 0;
      r = 1;
      return 1;
    } catch (e) {
      return 0;
    }
  }
  function X() {
    try {
      if (global.__SOPHIA_UI_KNOB)
        Pip.removeListener('knob1', global.__SOPHIA_UI_KNOB);
    } catch (e) {}
    try {
      delete global.__SOPHIA_UI_KNOB;
    } catch (e) {}
    R();
    try {
      Pip.changeMenu('MISC.JS');
    } catch (e) {
      try {
        Pip.changeMenu();
      } catch (q) {}
    }
  }
  function K(d) {
    var z = p ? 3 : 6,
      w =
        p === 2
          ? 'FISTO'
          : p === 3
            ? 'KL-E-O'
            : p === 4
              ? 'MK_II_STEALTH_SUIT'
              : p === 5
                ? 'ANDY'
                : 'YES_MAN';
    if (d) {
      s += d > 0 ? 1 : -1;
      if (s < 0) s = z - 1;
      else if (s >= z) s = 0;
      Pip.playSound('SCROLL');
      p ? dc(w) : dm();
      return;
    }
    Pip.playSound('SELECT');
    if (!p) {
      if (s < 5) {
        w =
          s === 0
            ? 'YES_MAN'
            : s === 1
              ? 'FISTO'
              : s === 2
                ? 'KL-E-O'
                : s === 3
                  ? 'MK_II_STEALTH_SUIT'
                  : 'ANDY';
        s = 0;
        dc(w);
        return;
      }
      X();
      return;
    }
    if (s === 0) {
      S(1, w);
      dc(w);
      return;
    }
    if (s === 1) {
      S(0, w);
      dc(w);
      return;
    }
    s = p === 2 ? 1 : p === 3 ? 2 : p === 4 ? 3 : p === 5 ? 4 : 0;
    p = 0;
    dm();
  }
  global.__SOPHIA_UI_KNOB = K;
  Pip.onExclusive('knob1', K);
  dm();
  return {
    id: 'SOPHIA',
    notDefault: true,
    fullscreen: true,
    remove: function () {
      if (ot) {
        clearTimeout(ot);
        ot = 0;
      }
      try {
        if (global.__SOPHIA_UI_KNOB)
          Pip.removeListener('knob1', global.__SOPHIA_UI_KNOB);
      } catch (e) {}
      try {
        delete global.__SOPHIA_UI_KNOB;
      } catch (e) {}
      if (!r) {
        R();
      }
    },
  };
});
