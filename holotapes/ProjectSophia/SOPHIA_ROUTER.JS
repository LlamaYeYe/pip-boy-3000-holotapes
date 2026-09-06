(function(sophiaState) {
    const fs = require("fs"),
        appPath = "HOLO/PROJECT_SOPHIA/";

    let pendingTimer = 0,
        voiceEngine = 0,
        modeListenerAttached = 0,
        menuXListenerAttached = 0,
        active = 1,
        enabled = 0,
        companionId = "YES_MAN",
        retryCount = 0;

    try {
        let config = JSON.parse(fs.readFileSync(appPath + "SOPHIA_CONFIG.JSON"));
        enabled = config.enabled ? 1 : 0;
        companionId = String(config.companion || "YES_MAN").toUpperCase()
    } catch (error) {
    }

    function isMisc() {
        try {
            return (Pip.MODE | 0) === 1 && (Pip.MENUX | 0) === 3
        } catch (error) {
        }

        return 0
    }

    function isSupportedPage() {
        let mode = -1,
            menuX = -1;

        try {
            mode = Pip.MODE | 0;
            menuX = Pip.MENUX | 0
        } catch (error) {
            return 0
        }

        return mode === 0 && menuX >= 0 && menuX < 5 ||
            mode === 1 && (menuX < 3 || menuX === 4) ||
            mode === 2 && (menuX === 0 || menuX === 2 || menuX === 3)
    }

    function isCustomApp() {
        try {
            return !!(Pip.CURRENT && Pip.CURRENT.notDefault)
        } catch (error) {
        }

        return 1
    }

    function isTransitioning() {
        try {
            return !!(Pip.sleeping || Pip.menuChanging)
        } catch (error) {
        }

        return 1
    }

    function isGameSettings() {
        try {
            return (Pip.MODE | 0) === 2 && (Pip.MENUX | 0) === 0
        } catch (error) {
        }

        return 0
    }

    function clearPendingTimer() {
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            pendingTimer = 0
        }
    }

    function destroyVoiceEngine() {
        if (voiceEngine && voiceEngine.destroy) {
            try {
                voiceEngine.destroy()
            } catch (error) {
            }
        }

        /*
         * The router owns this reference. Clearing it here releases the
         * engine without leaving a separate persistent engine global.
         */
        voiceEngine = 0
    }

    function loadVoiceEngine() {
        let sourceCode,
            engineFactory,
            memory;

        pendingTimer = 0;

        if (!active ||
            !enabled ||
            sophiaState.uiOpen ||
            isMisc() ||
            isCustomApp() ||
            !isSupportedPage() ||
            voiceEngine) {
            return
        }

        if (isTransitioning()) {
            pendingTimer = setTimeout(loadVoiceEngine, 1800);
            return
        }

        try {
            /*
             * Consolidate memory here, after the destination page has already
             * had time to render and only when S.O.P.H.I.A. is about to load
             * its heavier voice engine.
             */
            try {
                E.defrag()
            } catch (error) {
            }

            memory = process.memory();

            if (memory && memory.free < 2750) {
                if (retryCount++ < 2) {
                    pendingTimer = setTimeout(loadVoiceEngine, 2200)
                }
                return
            }

            retryCount = 0;

            sourceCode = fs.readFileSync(appPath + "SOPHIA_VOICE_ENGINE.JS");
            engineFactory = Function("return " + sourceCode) ();
            sourceCode = 0;

            voiceEngine = engineFactory(fs, appPath, companionId);
            engineFactory = 0;

            if (voiceEngine && voiceEngine.nav) voiceEngine.nav()
        } catch (error) {
            voiceEngine = 0;

            try {
                E.defrag()
            } catch (defragError) {
            }

            if (retryCount++ < 1) {
                pendingTimer = setTimeout(loadVoiceEngine, 2600)
            }
        }
    }

    function onNavigationChange() {
        if (!active) return;

        if (isTransitioning()) {
            if (voiceEngine && voiceEngine.nav) {
                try {
                    voiceEngine.nav()
                } catch (error) {
                    destroyVoiceEngine()
                }
            }

            clearPendingTimer();
            pendingTimer = setTimeout(onNavigationChange, 1800);
            return
        }

        if (sophiaState.uiOpen || isMisc() || isCustomApp() || !enabled) {
            clearPendingTimer();
            retryCount = 0;
            destroyVoiceEngine();
            return
        }

        /*
         * DATA > Settings is not a normal three-line voice context.
         * An already-running engine is allowed to stay alive there only so
         * it can detect an actual Fallout 3 / New Vegas mode change.
         */
        if (isGameSettings()) {
            clearPendingTimer();
            retryCount = 0;

            if (voiceEngine && voiceEngine.nav) {
                try {
                    voiceEngine.nav()
                } catch (error) {
                    destroyVoiceEngine()
                }
            } else {
                /*
                 * Load through the existing low-memory gate and normal
                 * 850 ms delay so DATA > Settings can detect an actual
                 * Fallout 3 / New Vegas mode change without adding a
                 * permanently resident service.
                 */
                pendingTimer = setTimeout(loadVoiceEngine, 850)
            }

            return
        }

        if (!isSupportedPage()) {
            clearPendingTimer();
            retryCount = 0;
            destroyVoiceEngine();
            return
        }

        if (voiceEngine) {
            try {
                voiceEngine.nav()
            } catch (error) {
                destroyVoiceEngine()
            }

            return
        }

        clearPendingTimer();
        pendingTimer = setTimeout(loadVoiceEngine, 850)
    }

    function kickRouter() {
        onNavigationChange()
    }

    function attachNavigationListeners() {
        if (!modeListenerAttached) {
            Pip.on("mode", onNavigationChange);
            modeListenerAttached = 1
        }

        if (!menuXListenerAttached) {
            try {
                Pip.on("menuX", onNavigationChange);
                menuXListenerAttached = 1
            } catch (error) {
                /*
                 * A partial registration is not a valid running state.
                 * Clean up the listener that did attach, then rethrow so
                 * Espruino exposes the real failure instead of hiding it.
                 */
                if (modeListenerAttached) {
                    Pip.removeListener("mode", onNavigationChange);
                    modeListenerAttached = 0
                }

                throw error
            }
        }
    }

    function shutdownRouter() {
        if (!active) return;

        active = 0;

        clearPendingTimer();
        destroyVoiceEngine();

        if (modeListenerAttached) {
            Pip.removeListener("mode", onNavigationChange);
            modeListenerAttached = 0
        }

        if (menuXListenerAttached) {
            Pip.removeListener("menuX", onNavigationChange);
            menuXListenerAttached = 0
        }

        if (sophiaState.router === routerApi) sophiaState.router = 0
    }

    const routerApi = {
        kick: kickRouter,
        die: shutdownRouter
    };

    sophiaState.router = routerApi;

    if (!enabled) {
        active = 0;
        sophiaState.router = 0;
        return 0
    }

    attachNavigationListeners();

    return routerApi
});
