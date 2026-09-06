(function(fs, appPath, companionId) {
    let statusBankBase = 0,
        engBankBase = 0,
        pollTimer = 0,
        activeContextKey = 0,
        responseIndex = 0,
        nextResponseAt = 0,
        ownsAudio = 0,
        audioUntil = 0,
        active = 1,
        currentNewVegas = 0,
        pendingModeVoice = -1;

    try {
        currentNewVegas = !!NV
    } catch (error) {
    }

    if (companionId === "FISTO") {
        statusBankBase = 12;
        engBankBase = 3
    } else if (companionId === "KL-E-O") {
        statusBankBase = 24;
        engBankBase = 6
    } else if (companionId === "MK_II_STEALTH_SUIT") {
        statusBankBase = 36;
        engBankBase = 9
    } else if (companionId === "ANDY") {
        statusBankBase = 48;
        engBankBase = 12
    }

    function getContextKey() {
        let mode = Pip.MODE | 0,
            menuX = Pip.MENUX | 0,
            statusIndex = 0;

        if (mode === 1) {
            if (menuX === 0) return 1;
            if (menuX === 1) return 2;
            if (menuX === 2) return 3;
            if (menuX === 4) return 5;
            return 0
        }

        if (mode === 0) {
            if (menuX === 0) {
                try {
                    statusIndex = Pip.statusIdx | 0
                } catch (error) {
                }

                /*
                 * STATUS:
                 * 0 CND -> key 10
                 * 1 RAD -> intentionally silent
                 * 2 EFF -> key 11
                 * 3 CLK -> key 12
                 * 4 ENG -> key 13
                 */
                if (statusIndex === 1) return 0;
                if (statusIndex === 2) return 11;
                if (statusIndex === 3) return 12;
                if (statusIndex === 4) return 13;

                return 10
            }

            if (menuX === 1) return 6;
            if (menuX === 2) return 7;
            if (menuX === 3) return 8;
            if (menuX === 4) return 9
        }

        if (mode === 2) {
            if (menuX === 2) return 14;
            if (menuX === 3) return 15
        }

        return 0
    }

    function isGameSettings() {
        try {
            return (Pip.MODE | 0) === 2 && (Pip.MENUX | 0) === 0
        } catch (error) {
        }

        return 0
    }

    function readUInt32LE(data, offset) {
        return (data.charCodeAt(offset) & 255) +
            ((data.charCodeAt(offset + 1) & 255) << 8) +
            ((data.charCodeAt(offset + 2) & 255) << 16) +
            ((data.charCodeAt(offset + 3) & 255) * 16777216)
    }

    function writeUInt16LE(value) {
        return String.fromCharCode(
            value & 255,
            value >> 8 & 255
        )
    }

    function writeUInt32LE(value) {
        return String.fromCharCode(
            value & 255,
            value >> 8 & 255,
            value >> 16 & 255,
            Math.floor(value / 16777216) & 255
        )
    }

    function clearPollTimer() {
        if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = 0
        }
    }

    function stopOwnedAudio() {
        if (ownsAudio) {
            try {
                if (!Pip.sleeping && Pip.audioStop) Pip.audioStop()
            } catch (error) {
            }
        }

        ownsAudio = 0;
        audioUntil = 0
    }

    function externalAudioActive() {
        try {
            return Pip.radioOn ||
                global.__PipRadioActive ||
                (!ownsAudio &&
                    ((Pip.audioIsPlaying && Pip.audioIsPlaying()) ||
                        (Pip.streamPlaying && Pip.streamPlaying()))) ?
                1 :
                0
        } catch (error) {
        }

        return 0
    }

    function schedulePoll(delayMs) {
        clearPollTimer();

        if (active) pollTimer = setTimeout(pollVoiceState, delayMs)
    }

    function prepareAndPlay(lineNumber, statusOffset, contextKey) {
        let inputFile,
            outputFile,
            indexEntry,
            byteOffset,
            byteLength,
            index = lineNumber - 1,
            bankName = companionId + "_VOICE.BIN",
            indexName = companionId + "_VOICE.IDX",
            bytesRemaining,
            chunk;

        if (statusOffset >= 10) {
            index = engBankBase + statusOffset - 10;
            bankName = "SOPHIA_ENG.BIN";
            indexName = "SOPHIA_ENG.IDX"
        } else if (statusOffset) {
            index = statusBankBase + statusOffset - 1;
            bankName = "SOPHIA_STATUS.BIN";
            indexName = "SOPHIA_STATUS.IDX"
        }

        if (!active ||
            contextKey !== getContextKey() ||
            Pip.sleeping ||
            Pip.menuChanging) {
            return 0
        }

        try {
            inputFile = E.openFile(appPath + indexName, "r");
            inputFile.seek(index * 8);
            indexEntry = inputFile.read(8);

            if (inputFile.close) inputFile.close();
            inputFile = 0;

            if (!indexEntry || indexEntry.length < 8) return 0;

            byteOffset = readUInt32LE(indexEntry, 0);
            byteLength = readUInt32LE(indexEntry, 4);

            if (!byteLength) return 0;

            inputFile = E.openFile(appPath + bankName, "r");
            outputFile = E.openFile(appPath + "SOPHIA_PLAY.WAV", "w");

            if (!inputFile || !outputFile) throw 0;

            inputFile.seek(byteOffset);

            outputFile.write(
                "RIFF" +
                writeUInt32LE(byteLength + 36) +
                "WAVEfmt " +
                writeUInt32LE(16) +
                writeUInt16LE(1) +
                writeUInt16LE(1) +
                writeUInt32LE(16000) +
                writeUInt32LE(32000) +
                writeUInt16LE(2) +
                writeUInt16LE(16) +
                "data" +
                writeUInt32LE(byteLength)
            );

            bytesRemaining = byteLength;

            while (bytesRemaining > 0) {
                chunk = inputFile.read(bytesRemaining > 1024 ? 1024 : bytesRemaining);

                if (!chunk || !chunk.length) throw 0;

                outputFile.write(chunk);
                bytesRemaining -= chunk.length
            }

            if (inputFile.close) inputFile.close();
            if (outputFile.close) outputFile.close();

            inputFile = outputFile = 0;

            if (!active || contextKey !== getContextKey()) return 0;

            audioUntil = getTime() + byteLength / 32000 + .7;
            ownsAudio = 1;

            Pip.audioStart(appPath + "SOPHIA_PLAY.WAV");

            return 1
        } catch (error) {
            try {
                if (inputFile && inputFile.close) inputFile.close()
            } catch (closeError) {
            }

            try {
                if (outputFile && outputFile.close) outputFile.close()
            } catch (closeError) {
            }

            return 0
        }
    }

    function pollVoiceState() {
        let contextKey,
            lineNumber,
            statusOffset = 0,
            maxResponses,
            currentTime,
            newVegasNow = currentNewVegas;

        pollTimer = 0;

        if (!active) return;

        try {
            if (Pip.sleeping || Pip.menuChanging) {
                if (Pip.menuChanging) stopOwnedAudio();
                schedulePoll(1800);
                return
            }

            if (isGameSettings()) {
                try {
                    newVegasNow = !!NV
                } catch (error) {
                }

                if (newVegasNow !== currentNewVegas) {
                    currentNewVegas = newVegasNow;
                    pendingModeVoice = currentNewVegas ? 1 : 0;
                    ownsAudio = 0;
                    audioUntil = 0
                }

                activeContextKey = 0;
                responseIndex = 0;
                nextResponseAt = 0;

                if (ownsAudio && getTime() < audioUntil) {
                    schedulePoll(
                        Math.max(
                            300,
                            Math.floor((audioUntil - getTime() + .1) * 1000)
                        )
                    );
                    return
                }

                if (ownsAudio) {
                    ownsAudio = 0;
                    audioUntil = 0
                }

                if (pendingModeVoice < 0) {
                    schedulePoll(300);
                    return
                }

                if (externalAudioActive()) {
                    schedulePoll(500);
                    return
                }

                lineNumber = pendingModeVoice ?
                    45 + Math.randInt(4) :
                    49 + Math.randInt(3);

                if (prepareAndPlay(lineNumber, 0, 0)) {
                    pendingModeVoice = -1;
                    schedulePoll(
                        Math.max(
                            700,
                            Math.floor((audioUntil - getTime() + .15) * 1000)
                        )
                    )
                } else {
                    schedulePoll(1200)
                }

                return
            }

            contextKey = getContextKey();

            if (!contextKey) {
                /*
                 * RAD is intentionally silent. If a STATUS response is still
                 * playing, stop only S.O.P.H.I.A.-owned audio as soon as the
                 * low-overhead STATUS poll detects RAD.
                 */
                stopOwnedAudio();

                activeContextKey = 0;
                responseIndex = 0;
                nextResponseAt = 0;

                /*
                 * Remain alive while still in STATUS so moving onward to
                 * EFF / CLK / ENG is detected without leaving STATUS.
                 */
                try {
                    if ((Pip.MODE | 0) === 0 && (Pip.MENUX | 0) === 0) {
                        schedulePoll(300)
                    }
                } catch (error) {
                }

                return
            }

            if (contextKey !== activeContextKey) {
                stopOwnedAudio();
                activeContextKey = contextKey;
                responseIndex = 0;
                nextResponseAt = getTime() + (contextKey === 13 ? .25 : 1)
            }

            currentTime = getTime();

            if (ownsAudio && currentTime < audioUntil) {
                if (contextKey >= 10 && contextKey <= 13) {
                    schedulePoll(200)
                } else {
                    schedulePoll(
                        Math.max(
                            300,
                            Math.floor((audioUntil - currentTime + .1) * 1000)
                        )
                    )
                }
                return
            }

            if (ownsAudio) {
                ownsAudio = 0;
                audioUntil = 0
            }

            if (externalAudioActive()) {
                schedulePoll(1200);
                return
            }

            maxResponses = contextKey === 15 ? 2 : 3;

            if (responseIndex >= maxResponses) {
                if (contextKey >= 10 && contextKey <= 13) schedulePoll(700);
                return
            }

            if (currentTime < nextResponseAt) {
                schedulePoll(
                    Math.max(
                        200,
                        Math.floor((nextResponseAt - currentTime) * 1000)
                    )
                );
                return
            }

            if (contextKey >= 10 && contextKey <= 13) {
                statusOffset = (contextKey - 10) * 3 + 1 + responseIndex;
                lineNumber = 1
            } else {
                lineNumber = (contextKey - 1) * 3 + 1 + responseIndex
            }

            responseIndex++;
            nextResponseAt = getTime() + 12;

            if (prepareAndPlay(lineNumber, statusOffset, contextKey)) {
                if (contextKey >= 10 && contextKey <= 13) {
                    /*
                     * STATUS sub-pages change Pip.statusIdx without emitting
                     * mode/menuX. Recheck during playback so entering RAD
                     * stops the owned voice instead of waiting for the WAV.
                     */
                    schedulePoll(200)
                } else {
                    schedulePoll(
                        Math.max(
                            700,
                            Math.floor((audioUntil - getTime() + .15) * 1000)
                        )
                    )
                }
            } else {
                schedulePoll(1200)
            }
        } catch (error) {
            schedulePoll(1500)
        }
    }

    function handleNavigation() {
        let contextKey = 0;

        if (!active) return;

        try {
            if (Pip.sleeping || Pip.menuChanging) {
                if (Pip.menuChanging) stopOwnedAudio();
                schedulePoll(1800);
                return
            }

            if (isGameSettings()) {
                clearPollTimer();
                stopOwnedAudio();
                activeContextKey = 0;
                responseIndex = 0;
                nextResponseAt = 0;
                schedulePoll(300);
                return
            }

            contextKey = getContextKey()
        } catch (error) {
        }

        if (!contextKey) {
            clearPollTimer();
            stopOwnedAudio();
            activeContextKey = 0;
            responseIndex = 0;
            nextResponseAt = 0;

            /*
             * Keep polling only for the intentionally silent STATUS RAD page.
             */
            try {
                if ((Pip.MODE | 0) === 0 && (Pip.MENUX | 0) === 0) {
                    schedulePoll(300)
                }
            } catch (error) {
            }

            return
        }

        if (contextKey !== activeContextKey) {
            stopOwnedAudio();
            activeContextKey = 0;
            responseIndex = 0;
            nextResponseAt = 0
        }

        schedulePoll(300)
    }

    function destroyVoiceEngine() {
        if (!active) return;

        active = 0;

        clearPollTimer();
        stopOwnedAudio()
    }

    const voiceEngineApi = {
        nav: handleNavigation,
        destroy: destroyVoiceEngine
    };

    schedulePoll(300);

    return voiceEngineApi
});
