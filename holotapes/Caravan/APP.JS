/*
 * CARAVAN - app.js
 * Top-level holotape lifecycle and lazy module handoff.
 * Readable source only; installed runtime remains in the matching minified file.
 */
(function () {
  const fs = require('fs'),
    basePath = 'HOLO/CARAVAN/';
  let menuModule = 0,
    gameModule = 0,
    resultModule = 0,
    timer = 0,
    removed = 0,
    ante = 50,
    funds = 500,
    opponent = '',
    savedIdleTimeout = 0,
    idleDisabled = 0;

  // --- Timing and memory helpers ---
  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
  }

  function reclaim() {
    process.memory(true);
    E.defrag();
  }

  // --- Pip-Boy idle handling ---
  function disableIdle() {
    if (idleDisabled) return;
    savedIdleTimeout = Pip.settings ? Pip.settings.idleTimeout : 0;
    if (Pip.settings) Pip.settings.idleTimeout = 0;
    if (Pip.timers && Pip.timers.idle) {
      clearTimeout(Pip.timers.idle);
      delete Pip.timers.idle;
    }
    idleDisabled = 1;
  }

  function restoreIdle() {
    if (!idleDisabled) return;
    if (Pip.settings) Pip.settings.idleTimeout = savedIdleTimeout;
    idleDisabled = 0;
    if (!Pip.sleeping && Pip.kickIdleTimer) {
      try {
        Pip.kickIdleTimer();
      } catch (idleError) {}
    }
  }

  // --- Lazy module lifecycle ---
  function unloadMenu() {
    if (menuModule && menuModule.remove) menuModule.remove();
    menuModule = 0;
  }

  function unloadGame() {
    if (gameModule) gameModule[0]();
    gameModule = 0;
  }

  function unloadResult() {
    if (resultModule && resultModule.remove) resultModule.remove();
    resultModule = 0;
  }

  // --- Menu, game, and results flow ---
  function loadMenu() {
    let sourceCode = 0,
      factory = 0;
    if (removed) return;
    restoreIdle();
    unloadMenu();
    reclaim();
    sourceCode = fs.readFileSync(basePath + 'CARAVAN_MENU_INTERFACE.MIN.JS');
    factory = eval(sourceCode);
    sourceCode = 0;
    menuModule = factory({
      fs: fs,
      basePath: basePath,
      screen: 0,
      menuSelection: 0,
      ante: ante,
      funds: funds,
      opponent: opponent,
      resultOutcome: 'DRAW',
      resultDelta: 0,
      onStartGame: requestGame,
    });
    factory = 0;
    h.flip();
    Pip.lastFlip = getTime();
  }

  function requestGame(state) {
    if (removed) return;
    ante = state.ante;
    funds = state.funds;
    opponent = state.opponent || opponent;
    clearTimer();
    timer = setTimeout(beginGame, 1);
  }

  function beginGame() {
    let sourceCode = 0,
      factory = 0;
    timer = 0;
    if (removed) return;
    unloadMenu();
    disableIdle();
    reclaim();
    sourceCode = fs.readFileSync(basePath + 'CARAVAN_GAME.MIN.JS');
    factory = eval(sourceCode);
    sourceCode = 0;
    gameModule = factory([fs, basePath, opponent, finishGame]);
    factory = 0;
  }

  function ensureResult() {
    let sourceCode = 0,
      factory = 0;
    if (resultModule) return 1;
    sourceCode = fs.readFileSync(basePath + 'CARAVAN_RESULT_MENU.MIN.JS');
    factory = eval(sourceCode);
    sourceCode = 0;
    resultModule = factory({
      fs: fs,
      basePath: basePath,
    });
    factory = 0;
    return resultModule ? 1 : 0;
  }

  function finishGame(outcome) {
    let delta = 0;
    if (removed) return;
    if (outcome === 'PLAYER') {
      delta = ante;
      funds += ante;
    } else if (outcome === 'CPU') {
      delta = -ante;
      funds -= ante;
      if (funds < 0) funds = 0;
    }
    if (ante > funds && funds > 0) ante = funds;
    clearTimer();
    timer = setTimeout(function () {
      timer = 0;
      if (removed || !gameModule) return;
      if (!ensureResult()) return;
      resultModule.show({
        outcome: outcome,
        delta: delta,
        opponent: opponent,
        onRematch: rematch,
        onNewOpponent: rematch,
        onBack: resultBack,
      });
    }, 8);
  }

  function rematch(newOpponent) {
    if (removed || !gameModule) return;
    if (newOpponent) opponent = newOpponent;
    timer = setTimeout(function () {
      timer = 0;
      if (removed || !gameModule) return;
      unloadResult();
      reclaim();
      gameModule[1](newOpponent);
    }, 1);
  }

  function resultBack() {
    unloadResult();
    unloadGame();
    restoreIdle();
    reclaim();
    clearTimer();
    timer = setTimeout(function () {
      timer = 0;
      loadMenu();
    }, 1);
  }

  // --- Final cleanup ---
  function remove() {
    if (removed) return;
    removed = 1;
    clearTimer();
    unloadMenu();
    unloadGame();
    unloadResult();
    restoreIdle();
    reclaim();
  }
  loadMenu();
  return {
    id: 'CARAVAN',
    notDefault: true,
    fullscreen: true,
    remove: remove,
  };
});
