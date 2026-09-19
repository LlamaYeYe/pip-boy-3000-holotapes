/*
 * CARAVAN - CARAVAN_GAME.JS
 * Resident match controller, input flow, turn flow, and rematch reset.
 * Readable source only; installed runtime remains in the matching minified file.
 */
(function (api) {
  const fs = api[0],
    basePath = api[1];
  let engine = 0,
    renderer = 0,
    audio = 0,
    playerDeck = 0,
    cpuDeck = 0,
    playerDeckPosition = 0,
    cpuDeckPosition = 0,
    playerHand = [],
    cpuHand = [],
    playerCaravans = [[], [], []],
    cpuCaravans = [[], [], []],
    playerDirection = new Int8Array(3),
    cpuDirection = new Int8Array(3),
    handIndex = 0,
    targetIndex = 0,
    cpuTurn = 0,
    turnCount = 0,
    finished = 0,
    removed = 0,
    actionMenuOpen = 0,
    actionSelection = 0,
    cpuTimer = 0,
    bootTimer = 0,
    finishTimer = 0,
    ready = 0,
    knob1Attached = 0,
    knob2Attached = 0,
    faceMode = 0,
    faceBoard = 0,
    faceLane = 0,
    faceCursor = 0,
    faceBase = -1,
    message = 'YOUR TURN',
    renderState = 0;

  // --- Render state ---
  function createRenderState() {
    return [
      api[2],
      playerHand,
      playerCaravans,
      cpuCaravans,
      handIndex,
      targetIndex,
      cpuTurn,
      actionMenuOpen,
      actionSelection,
      faceMode,
      faceBoard,
      faceLane,
      faceBase,
      0,
      message,
      -1,
    ];
  }

  function syncRenderState() {
    renderState[4] = handIndex;
    renderState[5] = targetIndex;
    renderState[6] = cpuTurn;
    renderState[7] = actionMenuOpen;
    renderState[8] = actionSelection;
    renderState[9] = faceMode;
    renderState[10] = faceBoard;
    renderState[11] = faceLane;
    renderState[12] = faceBase;
    renderState[13] =
      playerDeck.length - playerDeckPosition + playerHand.length;
    renderState[14] = message;
  }

  // --- Rendering helpers ---
  function drawGame() {
    syncRenderState();
    if (renderer) renderer[0](renderState);
  }

  function redrawStatus() {
    syncRenderState();
    if (renderer) renderer[3](renderState);
  }

  function drawPlayerCard() {
    if (playerDeckPosition < playerDeck.length)
      playerHand.push(playerDeck[playerDeckPosition++]);
  }

  function drawCpuCard() {
    if (cpuDeckPosition < cpuDeck.length)
      cpuHand.push(cpuDeck[cpuDeckPosition++]);
  }

  // --- Match setup and result checks ---
  function dealStartingHands() {
    engine[10](playerDeck);
    engine[10](cpuDeck);
    for (let cardIndex = 0; cardIndex < 8; cardIndex++) {
      drawPlayerCard();
      drawCpuCard();
    }
  }

  function currentResult() {
    const outcome = engine[7](
      playerCaravans,
      cpuCaravans,
      turnCount,
      playerHand,
      cpuHand,
    );
    if (outcome) return outcome;
    if (playerDeckPosition >= playerDeck.length && !playerHand.length)
      return 'CPU';
    if (cpuDeckPosition >= cpuDeck.length && !cpuHand.length) return 'PLAYER';
    return '';
  }

  // --- Input lifecycle ---
  function detachInput() {
    if (knob1Attached) {
      Pip.removeListener('knob1', onKnob1);
      knob1Attached = 0;
    }
    if (knob2Attached) {
      Pip.removeListener('knob2', onKnob2);
      knob2Attached = 0;
    }
  }

  function attachInput() {
    if (!knob1Attached) {
      Pip.onExclusive('knob1', onKnob1);
      knob1Attached = 1;
    }
    if (!knob2Attached) {
      try {
        Pip.onExclusive('knob2', onKnob2);
        knob2Attached = 1;
      } catch (error) {
        if (knob1Attached) {
          Pip.removeListener('knob1', onKnob1);
          knob1Attached = 0;
        }
        throw error;
      }
    }
  }

  // --- Module/result lifecycle ---
  function releaseGameplayModules() {
    ready = 0;
    detachInput();
    renderState = 0;
    message = 0;
    playerDeck =
      cpuDeck =
      playerHand =
      cpuHand =
      playerCaravans =
      cpuCaravans =
      playerDirection =
      cpuDirection =
        0;
    process.memory(true);
  }

  function returnResult() {
    const outcome = currentResult() || 'DRAW';
    finishTimer = 0;
    if (audio) audio[2]();
    releaseGameplayModules();
    if (api[3]) api[3](outcome);
  }

  function finishGame(outcome) {
    if (finished) return;
    finished = 1;
    cpuTurn = 0;
    detachInput();
    message =
      outcome === 'PLAYER'
        ? 'YOU WIN'
        : outcome === 'CPU'
          ? api[2] + ' WINS'
          : 'DRAW';
    drawGame();
    finishTimer = setTimeout(returnResult, 450);
  }

  // --- Turn transition helpers ---
  function afterMove(soundKind) {
    const outcome = currentResult();
    turnCount++;
    if (outcome) {
      finishGame(outcome);
      if (audio) audio[1](soundKind);
      return;
    }
    cpuTurn = 1;
    message = engine[1](cpuCaravans) ? api[2] + ' OPENING' : api[2] + "'S TURN";
    drawGame();
    if (audio) audio[1](soundKind);
    cpuTimer = setTimeout(runCpuTurn, engine[11]());
  }

  // --- Player action and face-card flow ---
  function showInvalidOpening() {
    message = 'INVALID OPENING';
    Pip.playSound('SCROLL');
    redrawStatus();
  }

  function openActionMenu() {
    if (finished || cpuTurn || !playerHand.length) return;
    actionMenuOpen = 1;
    actionSelection = 0;
    syncRenderState();
    Pip.playSound('SELECT');
    if (renderer) renderer[4](renderState, 0);
  }

  function closeActionMenu(redraw) {
    actionMenuOpen = 0;
    actionSelection = 0;
    if (redraw) drawGame();
  }

  function clearFaceTarget() {
    faceMode = 0;
    faceBoard = 0;
    faceLane = 0;
    faceCursor = 0;
    faceBase = -1;
  }

  function showInvalidFaceTarget() {
    message = 'INVALID TARGET';
    Pip.playSound('SCROLL');
    redrawStatus();
  }

  function faceTargetTotal() {
    const targetCaravans = faceBoard ? cpuCaravans : playerCaravans;
    let targetCount = 0;
    for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
      targetCount += engine[2](targetCaravans[laneIndex]);
    }
    return targetCount;
  }

  function updateFaceBaseFromCursor() {
    const targetCaravans = faceBoard ? cpuCaravans : playerCaravans;
    let remainingTargetIndex = faceCursor;
    faceBase = -1;
    for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
      const laneTargetCount = engine[2](targetCaravans[laneIndex]);
      if (remainingTargetIndex < laneTargetCount) {
        faceLane = laneIndex;
        faceBase = engine[3](targetCaravans[laneIndex], remainingTargetIndex);
        return;
      }
      remainingTargetIndex -= laneTargetCount;
    }
  }

  function cancelFaceTarget() {
    clearFaceTarget();
    actionMenuOpen = 1;
    actionSelection = 0;
    message = 'YOUR TURN';
    drawGame();
  }

  function finishFacePlay() {
    const card = playerHand[handIndex];
    const targetCaravans = faceBoard ? cpuCaravans : playerCaravans;
    const targetDirections = faceBoard ? cpuDirection : playerDirection;
    if (
      card === undefined ||
      faceBase < 0 ||
      !engine[6](
        targetCaravans,
        targetDirections,
        faceLane,
        faceBase,
        card,
        playerCaravans,
        cpuCaravans,
        playerDirection,
        cpuDirection,
      )
    ) {
      showInvalidFaceTarget();
      return;
    }
    clearFaceTarget();
    playerHand.splice(handIndex, 1);
    drawPlayerCard();
    if (handIndex >= playerHand.length)
      handIndex = Math.max(0, playerHand.length - 1);
    actionSelection = 0;
    message = 'CARD PLAYED';
    afterMove(0);
  }

  function startFaceTarget() {
    actionMenuOpen = 0;
    actionSelection = 0;
    clearFaceTarget();
    faceMode = 1;
    message = 'SELECT BOARD';
    Pip.playSound('SELECT');
    drawGame();
  }

  function confirmFaceTarget() {
    if (faceMode === 1) {
      if (actionSelection === 2) {
        cancelFaceTarget();
        return;
      }
      faceBoard = actionSelection;
      const targetCount = faceTargetTotal();
      if (!targetCount) {
        showInvalidFaceTarget();
        return;
      }
      faceMode = 2;
      faceCursor = 0;
      updateFaceBaseFromCursor();
      message = 'TARGET CARD';
      Pip.playSound('SELECT');
      drawGame();
      return;
    }
    if (faceBase < 0) {
      showInvalidFaceTarget();
      return;
    }
    finishFacePlay();
  }

  function onFaceKnob(direction) {
    if (!direction) {
      confirmFaceTarget();
      return;
    }
    if (faceMode === 2) {
      const targetCount = faceTargetTotal();
      if (!targetCount) {
        showInvalidFaceTarget();
        return;
      }
      const previousLane = faceLane;
      const previousBase = faceBase;
      faceCursor += direction > 0 ? 1 : -1;
      if (faceCursor < 0) faceCursor = targetCount - 1;
      if (faceCursor >= targetCount) faceCursor = 0;
      updateFaceBaseFromCursor();
      message = 'TARGET CARD';
      syncRenderState();
      Pip.playSound('SCROLL');
      if (renderer) {
        renderer[5](renderState, previousLane, previousBase);
      } else {
        drawGame();
      }
      return;
    }
    const previousSelection = actionSelection;
    actionSelection += direction > 0 ? 1 : -1;
    if (actionSelection < 0) actionSelection = 2;
    if (actionSelection > 2) actionSelection = 0;
    syncRenderState();
    Pip.playSound('SCROLL');
    if (renderer) {
      renderer[4](renderState, 1, previousSelection);
    } else {
      drawGame();
    }
  }

  function confirmAction() {
    if (!actionMenuOpen) return;
    if (actionSelection === 0) {
      playSelectedCard();
      return;
    }
    if (actionSelection === 1) {
      actionMenuOpen = 0;
      actionSelection = 0;
      discardSelectedCard();
      return;
    }
    if (actionSelection === 2) {
      disbandSelectedCaravan();
      return;
    }
    Pip.playSound('SELECT');
    closeActionMenu(1);
  }

  function playSelectedCard() {
    const card = playerHand[handIndex];
    const opening = engine[1](playerCaravans);
    if (finished || cpuTurn || card === undefined) return 0;
    if (opening) {
      if (!engine[0](card) || playerCaravans[targetIndex].length) {
        showInvalidOpening();
        return 0;
      }
    } else if (!engine[0](card)) {
      startFaceTarget();
      return 2;
    }
    if (!engine[4](playerCaravans, playerDirection, targetIndex, card)) {
      message = opening ? 'INVALID OPENING' : 'INVALID PLAY';
      Pip.playSound('SCROLL');
      redrawStatus();
      return 0;
    }
    actionMenuOpen = 0;
    actionSelection = 0;
    engine[5](playerCaravans, playerDirection, targetIndex, card);
    playerHand.splice(handIndex, 1);
    if (!opening) drawPlayerCard();
    if (handIndex >= playerHand.length)
      handIndex = Math.max(0, playerHand.length - 1);
    message = 'CARD PLAYED';
    afterMove(0);
    return 1;
  }

  function discardSelectedCard() {
    if (finished || cpuTurn || !playerHand.length) return;
    playerHand.splice(handIndex, 1);
    drawPlayerCard();
    if (handIndex >= playerHand.length)
      handIndex = Math.max(0, playerHand.length - 1);
    message = 'CARD DISCARDED';
    afterMove(1);
  }

  function disbandSelectedCaravan() {
    if (finished || cpuTurn) return;
    if (engine[1](playerCaravans)) {
      showInvalidOpening();
      return;
    }
    if (!playerCaravans[targetIndex].length) {
      message = 'EMPTY CARAVAN';
      Pip.playSound('SCROLL');
      redrawStatus();
      return;
    }
    actionMenuOpen = 0;
    actionSelection = 0;
    playerCaravans[targetIndex].splice(0, playerCaravans[targetIndex].length);
    playerDirection[targetIndex] = 0;
    message = 'CARAVAN DISBANDED';
    afterMove(1);
  }

  // --- Player and CPU turns ---
  function beginPlayerTurn() {
    cpuTimer = 0;
    if (finished) return;
    cpuTurn = 0;
    message = engine[1](playerCaravans) ? 'OPENING - YOUR TURN' : 'YOUR TURN';
    syncRenderState();
    if (renderer) renderer[3](renderState);
    if (renderer) renderer[2](renderState, -1);
  }

  function runCpuTurn() {
    const opening = engine[1](cpuCaravans);
    let soundKind;
    cpuTimer = 0;
    if (finished) return;
    const encodedMove = engine[12](
      cpuHand,
      cpuCaravans,
      cpuDirection,
      playerCaravans,
      playerDirection,
    );
    if (encodedMove < 0 || !cpuHand.length) {
      if (cpuHand.length) cpuHand.splice(0, 1);
      drawCpuCard();
      message = api[2] + ' DISCARDED';
      soundKind = 1;
    } else {
      const cpuHandIndex = encodedMove >> 13;
      const targetIsPlayer = (encodedMove >> 12) & 1;
      const laneIndex = (encodedMove >> 10) & 3;
      const baseIndex = (encodedMove & 1023) - 1;
      const card = cpuHand[cpuHandIndex];
      if (engine[0](card)) {
        engine[5](cpuCaravans, cpuDirection, laneIndex, card);
      } else if (targetIsPlayer) {
        engine[6](
          playerCaravans,
          playerDirection,
          laneIndex,
          baseIndex,
          card,
          playerCaravans,
          cpuCaravans,
          playerDirection,
          cpuDirection,
        );
      } else {
        engine[6](
          cpuCaravans,
          cpuDirection,
          laneIndex,
          baseIndex,
          card,
          playerCaravans,
          cpuCaravans,
          playerDirection,
          cpuDirection,
        );
      }
      cpuHand.splice(cpuHandIndex, 1);
      if (!opening) drawCpuCard();
      message = api[2] + ' PLAYED';
      soundKind = 0;
    }
    turnCount++;
    const outcome = currentResult();
    if (outcome) {
      finishGame(outcome);
      if (audio) audio[1](soundKind);
      return;
    }
    cpuTurn = 1;
    drawGame();
    if (audio) audio[1](soundKind);
    cpuTimer = setTimeout(beginPlayerTurn, engine[11]());
  }

  // --- Hardware input handlers ---
  function onKnob1(direction) {
    if (!ready || finished || cpuTurn) return;
    if (faceMode) {
      onFaceKnob(direction);
      return;
    }
    if (actionMenuOpen) {
      if (!direction) {
        confirmAction();
        return;
      }
      const previousSelection = actionSelection;
      actionSelection += direction > 0 ? 1 : -1;
      if (actionSelection < 0) actionSelection = 3;
      if (actionSelection > 3) actionSelection = 0;
      syncRenderState();
      Pip.playSound('SCROLL');
      if (renderer) renderer[4](renderState, 0, previousSelection);
      return;
    }
    if (direction) {
      const previousTarget = targetIndex;
      targetIndex += direction > 0 ? 1 : -1;
      if (targetIndex < 0) targetIndex = 2;
      if (targetIndex > 2) targetIndex = 0;
      renderState[5] = targetIndex;
      Pip.playSound('SCROLL');
      if (renderer) renderer[2](renderState, previousTarget);
      return;
    }
    openActionMenu();
  }

  function onKnob2(direction) {
    if (
      !ready ||
      finished ||
      cpuTurn ||
      faceMode ||
      actionMenuOpen ||
      !direction ||
      !playerHand.length
    )
      return;
    const previousHandIndex = handIndex;
    handIndex += direction > 0 ? 1 : -1;
    if (handIndex < 0) handIndex = playerHand.length - 1;
    if (handIndex >= playerHand.length) handIndex = 0;
    renderState[4] = handIndex;
    Pip.playSound('SCROLL');
    if (renderer) renderer[1](renderState, previousHandIndex);
  }

  // --- Rematch reset and module loading ---
  function restartGame(newOpponent) {
    if (removed || !engine) return;
    if (newOpponent) api[2] = newOpponent;
    if (cpuTimer) clearTimeout(cpuTimer);
    if (finishTimer) clearTimeout(finishTimer);
    cpuTimer = finishTimer = 0;
    ready = 0;
    process.memory(true);
    E.defrag();
    playerDeck = engine[9](engine[8](0));
    cpuDeck = engine[9](engine[8](1));
    playerDeckPosition = cpuDeckPosition = 0;
    playerHand = [];
    cpuHand = [];
    playerCaravans = [[], [], []];
    cpuCaravans = [[], [], []];
    playerDirection = new Int8Array(3);
    cpuDirection = new Int8Array(3);
    handIndex =
      targetIndex =
      cpuTurn =
      turnCount =
      finished =
      actionMenuOpen =
      actionSelection =
        0;
    clearFaceTarget();
    message = 'OPENING - YOUR TURN';
    dealStartingHands();
    renderState = createRenderState();
    drawGame();
    h.flip();
    Pip.lastFlip = getTime();
    process.memory(true);
    if (audio) audio[0]();
    ready = 1;
    attachInput();
  }

  function loadModule(fileName, moduleArguments) {
    let sourceCode = fs.readFileSync(basePath + fileName);
    let moduleFactory = eval(sourceCode);
    sourceCode = 0;
    const moduleObject =
      moduleArguments === undefined
        ? moduleFactory()
        : moduleFactory(moduleArguments);
    moduleFactory = 0;
    process.memory(true);
    return moduleObject;
  }

  // --- Final cleanup ---
  function removeGame() {
    if (removed) return;
    removed = 1;
    if (cpuTimer) clearTimeout(cpuTimer);
    if (finishTimer) clearTimeout(finishTimer);
    if (bootTimer) clearTimeout(bootTimer);
    cpuTimer = finishTimer = bootTimer = 0;
    ready = 0;
    detachInput();
    if (audio) audio[3]();
    audio = 0;
    if (renderer) renderer[6]();
    renderer = 0;
    engine = 0;
    playerDeck = 0;
    cpuDeck = 0;
    playerHand = [];
    cpuHand = [];
    playerCaravans = [[], [], []];
    cpuCaravans = [[], [], []];
  }
  bootTimer = setTimeout(function () {
    bootTimer = 0;
    if (removed) return;
    E.defrag();
    engine = loadModule('CARAVAN_GAME_ENGINE.MIN.JS');
    E.defrag();
    renderer = loadModule('CARAVAN_DRAW_SCREEN.MIN.JS', [fs, basePath]);
    playerDeck = engine[9](engine[8](0));
    cpuDeck = engine[9](engine[8](1));
    dealStartingHands();
    message = 'OPENING - YOUR TURN';
    renderState = createRenderState();
    drawGame();
    h.flip();
    Pip.lastFlip = getTime();
    process.memory(true);
    E.defrag();
    audio = loadModule('CARAVAN_GAME_AUDIO.MIN.JS', [fs, basePath]);
    if (audio) audio[0]();
    ready = 1;
    attachInput();
  }, 1);
  return [removeGame, restartGame];
});
