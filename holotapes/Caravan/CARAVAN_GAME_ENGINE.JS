/*
 * CARAVAN - CARAVAN_GAME_ENGINE.JS
 * Caravan rules, deck logic, scoring, face-card behavior, and CPU choices.
 * Readable source only; installed runtime remains in the matching minified file.
 */
(function () {
    let randomSeed = ((Date.now() & 2147483647) ^ 1511508451) >>> 0;

    // --- Card primitives ---
    function rank(card) {
        return card & 15
    }

    function suit(card) {
        return (card >> 4) & 3
    }

    function isNumber(card) {
        return rank(card) <= 10
    }

    // --- Caravan stack helpers ---
    function baseCardCount(cards) {
        let numberCardCount = 0;
        for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
            if (isNumber(cards[cardIndex])) numberCardCount++
        }
        return numberCardCount
    }

    function lastNumberIndex(cards) {
        for (let cardIndex = cards.length - 1; cardIndex >= 0; cardIndex--) {
            if (isNumber(cards[cardIndex])) return cardIndex
        }
        return - 1
    }

    function groupEndIndex(cards,
        baseIndex) {
        let cardIndex = baseIndex + 1;
        while (cardIndex < cards.length && !isNumber(cards[cardIndex])) cardIndex++;
        return cardIndex
    }

    function removeGroupAt(cards, baseIndex) {
        cards.splice(baseIndex, groupEndIndex(cards, baseIndex) - baseIndex)
    }

    function groupValueAt(cards, baseIndex) {
        if (baseIndex < 0 || baseIndex >= cards.length || !isNumber(cards[baseIndex])) return 0;
        let groupValue = rank(cards[baseIndex]);
        for (let cardIndex = baseIndex + 1; cardIndex < cards.length
            && !isNumber(cards[cardIndex]); cardIndex++) {
            if (rank(cards[cardIndex]) === 13) groupValue <<= 1
        }
        return groupValue
    }

    function lastNumberRank(cards) {
        const numberIndex = lastNumberIndex(cards);
        return numberIndex >= 0 ? rank(cards[numberIndex]) : 0
    }

    // --- Direction and face-card rules ---
    function lastEffectiveSuit(cards) {
        const baseIndex = lastNumberIndex(cards);
        if (baseIndex < 0) return 0;
        let effectiveSuit = suit(cards[baseIndex]);
        const endIndex = groupEndIndex(cards, baseIndex);
        for (let cardIndex = baseIndex + 1; cardIndex < endIndex; cardIndex++) {
            if (rank(cards[cardIndex]) === 12) effectiveSuit = suit(cards[cardIndex])
        }
        return effectiveSuit
    }

    function computeDirection(cards) {
        let previousNumberIndex = -1,
            latestNumberIndex = -1,
            direction = 0;
        for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
            if (isNumber(cards[cardIndex])) {
                previousNumberIndex = latestNumberIndex;
                latestNumberIndex = cardIndex
            }
        }
        if (previousNumberIndex >= 0 && latestNumberIndex >= 0) {
            const latestRank = rank(cards[latestNumberIndex]);
            const previousRank = rank(cards[previousNumberIndex]);
            if (latestRank > previousRank) direction = 1;
            else if (latestRank < previousRank) direction = -1
        }
        if (latestNumberIndex >= 0 && direction) {
            const endIndex = groupEndIndex(cards, latestNumberIndex);
            for (let cardIndex = latestNumberIndex + 1; cardIndex < endIndex; cardIndex++) {
                if (rank(cards[cardIndex]) === 12) direction = -direction
            }
        }
        return direction
    }

    function refreshDirections(playerCaravans,
        cpuCaravans,
        playerDirections,
        cpuDirections) {
        for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
            playerDirections[laneIndex] = computeDirection(playerCaravans[laneIndex]);
            cpuDirections[laneIndex] = computeDirection(cpuCaravans[laneIndex])
        }
    }

    function insertFaceAt(cards, baseIndex, card) {
        cards.splice(groupEndIndex(cards, baseIndex), 0, card)
    }

    function removeJokerMatches(cards, protectedCards, protectedBaseIndex, targetRank,
        targetSuit, matchBySuit) {
        for (let cardIndex = cards.length - 1; cardIndex >= 0; cardIndex--) {
            if (!isNumber(cards[cardIndex])) continue;
            if (cards === protectedCards && cardIndex === protectedBaseIndex) continue;
            const isMatch = matchBySuit ? suit(cards[cardIndex]) === targetSuit
                : rank(cards[cardIndex]) === targetRank;
            if (isMatch) removeGroupAt(cards, cardIndex)
        }
    }

    function playJoker(cards, baseIndex, card, playerCaravans, cpuCaravans, playerDirections, cpuDirections) {
        const targetRank = rank(cards[baseIndex]);
        const targetSuit = suit(cards[baseIndex]);
        const matchBySuit = targetRank === 1;
        insertFaceAt(cards, baseIndex, card);
        for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
            removeJokerMatches(playerCaravans[laneIndex],
                cards,
                baseIndex,
                targetRank,
                targetSuit,
                matchBySuit);
            removeJokerMatches(cpuCaravans[laneIndex], cards, baseIndex, targetRank, targetSuit, matchBySuit)
        }
        refreshDirections(playerCaravans, cpuCaravans, playerDirections, cpuDirections)
    }

    function playFaceCard(caravans, directions, laneIndex, baseIndex, card, playerCaravans,
        cpuCaravans, playerDirections, cpuDirections) {
        const cards = caravans[laneIndex];
        if (baseIndex < 0 || baseIndex >= cards.length || !isNumber(cards[baseIndex])) return 0;
        if (rank(card) === 14) {
            playJoker(cards, baseIndex, card, playerCaravans, cpuCaravans, playerDirections, cpuDirections)
        } else if (rank(card) === 11) {
            removeGroupAt(cards, baseIndex);
            refreshDirections(playerCaravans, cpuCaravans, playerDirections, cpuDirections)
        } else {
            insertFaceAt(cards, baseIndex, card);
            directions[laneIndex] = computeDirection(cards)
        }
        return 1
    }

    // --- Randomness and deck construction ---
    function random32() {
        if (!randomSeed) randomSeed = 1831565813;
        randomSeed ^= randomSeed << 13;
        randomSeed ^= randomSeed >>> 17;
        randomSeed ^= randomSeed << 5;
        return randomSeed >>> 0
    }

    function thinkDelay() {
        return 1500 + (random32() % 1501)
    }

    function shuffleDeck(deck) {
        for (let currentIndex = deck.length - 1; currentIndex > 0; currentIndex--) {
            const randomIndex = random32() % (currentIndex + 1);
            const currentCard = deck[currentIndex];
            deck[currentIndex] = deck[randomIndex];
            deck[randomIndex] = currentCard
        }
        return deck
    }

    function makeDeck(cpuDeck) {
        const deck = new Uint8Array(54);
        const suitOffset = cpuDeck ? 1 : 0;
        let deckIndex = 0;
        for (let suitIndex = 0; suitIndex < 4; suitIndex++) {
            for (let cardRank = 1; cardRank <= 13; cardRank++) {
                deck[deckIndex++] = (((suitIndex + suitOffset) & 3) << 4) | cardRank
            }
        }
        deck[deckIndex++] = ((cpuDeck ? 2 : 0) << 4) | 14;
        deck[deckIndex] = ((cpuDeck ? 3 : 1) << 4) | 14;
        return deck
    }

    function ensureOpeningNumbers(deck) {
        let openingNumberCount = 0;
        let searchIndex = 8;
        for (let openingIndex = 0; openingIndex < 8; openingIndex++) {
            if (isNumber(deck[openingIndex])) openingNumberCount++
        }
        let replacementIndex = 0;
        while (openingNumberCount < 3 && searchIndex < deck.length) {
            while (replacementIndex < 8 && isNumber(deck[replacementIndex])) replacementIndex++;
            while (searchIndex < deck.length && !isNumber(deck[searchIndex])) searchIndex++;
            if (replacementIndex >= 8 || searchIndex >= deck.length) break;
            const replacementCard = deck[replacementIndex];
            deck[replacementIndex] = deck[searchIndex];
            deck[searchIndex] = replacementCard;
            openingNumberCount++;
            replacementIndex++;
            searchIndex++
        }
    }

    // --- Scoring and play legality ---
    function total(cards) {
        let cardIndex = 0;
        let caravanTotal = 0;
        while (cardIndex < cards.length) {
            const cardRank = rank(cards[cardIndex]);
            if (cardRank <= 10) {
                let groupValue = cardRank;
                cardIndex++;
                while (cardIndex < cards.length && rank(cards[cardIndex]) > 10) {
                    if (rank(cards[cardIndex]) === 13) groupValue <<= 1;
                    cardIndex++
                }
                caravanTotal += groupValue
            } else {
                cardIndex++
            }
        }
        return caravanTotal
    }

    function openingPhase(caravans) {
        return !caravans.openingComplete && (!caravans[0].length || !caravans[1].length || !caravans[2]
            .length)
    }

    function numberCardCount(cards) {
        let count = 0;
        for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
            if (isNumber(cards[cardIndex])) count++
        }
        return count
    }

    function nthNumberIndex(cards,
        numberPosition) {
        let numberCount = 0;
        for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
            if (!isNumber(cards[cardIndex])) continue;
            if (numberCount === numberPosition) return cardIndex;
            numberCount++
        }
        return - 1
    }

    function canPlay(caravans, directions, laneIndex, card) {
        const cards = caravans[laneIndex];
        const cardRank = rank(card);
        if (openingPhase(caravans)) return cardRank <= 10 && !cards.length;
        if (cardRank > 10) return 0;
        if (!cards.length) return 1;
        const previousRank = lastNumberRank(cards);
        if (cardRank === previousRank) return 0;
        if (baseCardCount(cards) === 1) return 1;
        if (suit(card) === lastEffectiveSuit(cards)) return 1;
        const direction = directions[laneIndex];
        if (direction > 0) return cardRank > previousRank;
        if (direction < 0) return cardRank < previousRank;
        return 1
    }

    function playNumberCard(caravans, directions, laneIndex, card) {
        caravans[laneIndex].push(card);
        directions[laneIndex] = computeDirection(caravans[laneIndex]);
        if (!caravans.openingComplete && caravans[0].length && caravans[1].length && caravans[2].length) {
            caravans.openingComplete = 1
        }
    }

    function laneWinner(playerTotal, cpuTotal) {
        const playerSold = playerTotal >= 21 && playerTotal <= 26;
        const cpuSold = cpuTotal >= 21 && cpuTotal <= 26;
        if (!playerSold && !cpuSold) return 0;
        if (playerSold && !cpuSold) return 1;
        if (!playerSold && cpuSold) return - 1;
        if (playerTotal === cpuTotal) return 0;
        return playerTotal > cpuTotal ? 1 : -1
    }

    function checkWinner(playerCaravans, cpuCaravans, turnCount, playerHand, cpuHand) {
        let soldLaneCount = 0;
        let playerWins = 0;
        let cpuWins = 0;
        for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
            const laneResult = laneWinner(total(playerCaravans[laneIndex]), total(cpuCaravans[laneIndex]));
            if (laneResult) soldLaneCount++;
            if (laneResult > 0) playerWins++;
            if (laneResult < 0) cpuWins++
        }
        if (soldLaneCount === 3) {
            if (playerWins >= 2) return "PLAYER";
            if (cpuWins >= 2) return "CPU"
        }
        if (turnCount > 120 || (!playerHand.length && !cpuHand.length)) {
            if (playerWins > cpuWins) return "PLAYER";
            if (cpuWins > playerWins) return "CPU";
            return "DRAW"
        }
        return ""
    }

    // --- CPU move selection ---
    function chooseCpuMove(hand, cpuCaravans, cpuDirections, playerCaravans, playerDirections) {
        let bestScore = -10000;
        let encodedMove = -1;
        if (openingPhase(cpuCaravans)) {
            for (let handIndex = 0; handIndex < hand.length; handIndex++) {
                const card = hand[handIndex];
                if (!isNumber(card)) continue;
                for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
                    if (cpuCaravans[laneIndex].length) continue;
                    const moveScore = rank(card) * 3 + (random32() & 7);
                    if (moveScore > bestScore) {
                        bestScore = moveScore;
                        encodedMove = (handIndex << 13) | (laneIndex << 10)
                    }
                }
            }
            return encodedMove
        }
        for (let handIndex = 0; handIndex < hand.length; handIndex++) {
            const card = hand[handIndex];
            const cardRank = rank(card);
            if (cardRank <= 10) {
                for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
                    if (!canPlay(cpuCaravans, cpuDirections, laneIndex, card)) continue;
                    const projectedTotal = total(cpuCaravans[laneIndex]) + cardRank;
                    const moveScore = projectedTotal > 26 ? -700 - projectedTotal
                        : projectedTotal >= 21 ? 250 + projectedTotal : projectedTotal * 3;
                    if (moveScore > bestScore) {
                        bestScore = moveScore;
                        encodedMove = (handIndex << 13) | (laneIndex << 10)
                    }
                }
                continue
            }
            for (let targetBoard = 0; targetBoard < 2; targetBoard++) {
                for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
                    const targetCards = targetBoard ? playerCaravans[laneIndex] : cpuCaravans[laneIndex];
                    const currentTotal = total(targetCards);
                    for (let baseIndex = 0; baseIndex < targetCards.length; baseIndex++) {
                        if (!isNumber(targetCards[baseIndex])) continue;
                        const targetGroupValue = groupValueAt(targetCards, baseIndex);
                        let projectedTotal;
                        let moveScore;
                        if (cardRank === 13) {
                            projectedTotal = currentTotal + targetGroupValue;
                            moveScore = targetBoard ? (currentTotal >= 21 && currentTotal <= 26
                                && projectedTotal > 26 ? 480 + currentTotal : 20)
                                : (projectedTotal > 26 ? -520 : projectedTotal >= 21 ? 320
                                + projectedTotal : projectedTotal * 3)
                        } else if (cardRank === 11) {
                            projectedTotal = currentTotal - targetGroupValue;
                            moveScore = targetBoard ? (currentTotal >= 21 && currentTotal <= 26
                                ? 430 + currentTotal : 35) : (currentTotal > 26
                                && projectedTotal <= 26 ? 360 : currentTotal >= 21
                                && currentTotal <= 26 ? -220 : 25)
                        } else if (cardRank === 12) {
                            moveScore = targetBoard ? 8 : baseIndex === lastNumberIndex(targetCards) ? 55 : 4
                        } else {
                            moveScore = targetBoard ? 25 + targetGroupValue * 2 : -20
                        }
                        if (moveScore > bestScore) {
                            bestScore = moveScore;
                            encodedMove = (handIndex << 13) | (targetBoard << 12) | (laneIndex << 10) | (baseIndex
                                + 1)
                        }
                    }
                }
            }
        }
        return bestScore < -200 ? -1 : encodedMove
    }
    return [isNumber, openingPhase, numberCardCount, nthNumberIndex, canPlay, playNumberCard, playFaceCard,
        checkWinner, makeDeck, shuffleDeck, ensureOpeningNumbers, thinkDelay, chooseCpuMove]
})
