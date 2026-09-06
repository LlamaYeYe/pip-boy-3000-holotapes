(function() {
    const fs = require("fs"),
        appPath = "HOLO/PROJECT_SOPHIA/",
        companionIds = [
            "YES_MAN",
            "FISTO",
            "KL-E-O",
            "MK_II_STEALTH_SUIT",
            "ANDY"
        ],
        companionNames = [
            "YES MAN",
            "FISTO",
            "KL-E-O",
            "MK II Stealth Suit",
            "Andy - Mister Handy"
        ],
        /*
         * Keep the router detached from the holotape UI closure, but compile
         * the tiny loader only after the UI has been removed and defragmented.
         * A compile failure is caught in normal APP.JS instead of surfacing
         * the earlier Espruino dynamic-Function parser ERROR dialog.
         */
        detachedRouterLoaderSource =
            "global.__SLT=0;" +
            "if(Pip.sleeping||Pip.menuChanging){" +
            "global.__SLT=setTimeout(global.__SLF,1800);" +
            "return;" +
            "}" +
            "if(global.__PipCoSophiaUi||global.__SR){" +
            "global.__SLF=0;" +
            "return;" +
            "}" +
            "var f=require('fs')," +
            "s=f.readFileSync('HOLO/PROJECT_SOPHIA/SOPHIA_ROUTER.JS')," +
            "q=Function('return '+s)()," +
            "r=q();" +
            "s=q=0;" +
            "global.__SLF=0;" +
            "if(r&&r.kick)r.kick();";

    let enabled = 0,
        activeCompanion = "YES_MAN",
        menuSelection = 0,
        selectedCompanionIndex = -1,
        removed = 0,
        detachedRouterLoader = 0;

    function defragMemory() {
        try {
            E.defrag()
        } catch (error) {
        }
    }

    function createDetachedRouterLoader() {
        try {
            return Function(detachedRouterLoaderSource)
        } catch (error) {
            defragMemory();
            return 0
        }
    }

    function normalizeCompanion(companion) {
        companion = String(companion || "").toUpperCase();

        if (companion === "FISTO") return companion;
        if (companion === "KL-E-O" || companion === "KLEO") return "KL-E-O";
        if (companion === "MK_II_STEALTH_SUIT" || companion === "MK II STEALTH SUIT") {
            return "MK_II_STEALTH_SUIT"
        }
        if (companion === "ANDY" || companion.indexOf("MISTER HANDY") >= 0) return "ANDY";

        return "YES_MAN"
    }

    function loadConfig() {
        try {
            let config = JSON.parse(fs.readFileSync(appPath + "SOPHIA_CONFIG.JSON"));
            enabled = config.enabled ? 1 : 0;
            activeCompanion = normalizeCompanion(config.companion)
        } catch (error) {
            enabled = 0;
            activeCompanion = "YES_MAN"
        }
    }

    function saveConfig(newEnabled, companion) {
        enabled = newEnabled ? 1 : 0;
        activeCompanion = normalizeCompanion(companion);

        try {
            fs.writeFileSync(
                appPath + "SOPHIA_CONFIG.JSON",
                '{"enabled":' + enabled + ',"companion":"' + activeCompanion + '"}'
            )
        } catch (error) {
        }
    }

    function stopBackgroundServices() {
        try {
            if (global.__SLT) {
                clearTimeout(global.__SLT);
                global.__SLT = 0
            }
        } catch (error) {
        }

        try {
            if (global.__SR && global.__SR.die) global.__SR.die()
        } catch (error) {
        }
        global.__SR = 0;

        try {
            if (global.__SE && global.__SE.destroy) global.__SE.destroy()
        } catch (error) {
        }
        global.__SE = 0;
        global.__SLF = 0;

        defragMemory()
    }

    function scheduleRouterStart() {
        if (!enabled || !detachedRouterLoader) {
            global.__SLF = 0;
            return
        }

        try {
            if (global.__SLT) clearTimeout(global.__SLT)
        } catch (error) {
        }

        /*
         * remove() must return immediately so MISC or a physical
         * STATS/ITEMS/DATA button can draw without S.O.P.H.I.A. work
         * competing with the firmware transition.
         */
        global.__SLF = detachedRouterLoader;
        global.__SLT = setTimeout(detachedRouterLoader, 1000);
        detachedRouterLoader = 0
    }

    function drawHeader() {
        h.clear()
            .setColor(3)
            .setFontMonofonto16()
            .setFontAlign(0, -1)
            .drawString("S.O.P.H.I.A.", 240, 12)
            .drawString(
                "Speech-Optimized Personal Health & Information Assistant",
                240,
                38
            )
            .drawLine(22, 62, 458, 62)
            .setFontAlign(-1, -1)
    }

    function drawMainMenu() {
        let companionIndex,
            rowY = 140;

        selectedCompanionIndex = -1;

        if (menuSelection < 0 || menuSelection > 5) menuSelection = 0;

        drawHeader();

        h.drawString("Status: " + (enabled ? "Enabled" : "Disabled"), 36, 72);

        if (enabled) {
            h.drawString(
                "Active: " + companionNames[Math.max(0, companionIds.indexOf(activeCompanion))],
                36,
                94
            )
        }

        for (companionIndex = 0; companionIndex < 5; companionIndex++) {
            if (companionIndex === menuSelection) {
                Pip.shadeBox(22, rowY - 4, 458, rowY + 22)
            }

            h.setColor(3).drawString(companionNames[companionIndex], 36, rowY);
            rowY += 29
        }

        if (menuSelection === 5) Pip.shadeBox(22, rowY - 4, 458, rowY + 22);

        h.setColor(3).drawString("< Back", 36, rowY)
    }

    function drawCompanionMenu() {
        let optionIndex,
            rowY = 146;

        if (menuSelection < 0 || menuSelection > 2) menuSelection = 0;

        drawHeader();

        h.drawString(companionNames[selectedCompanionIndex], 36, 74)
            .drawString(
                "Status: " +
                    (enabled && activeCompanion === companionIds[selectedCompanionIndex] ?
                        "Enabled" :
                        "Disabled"),
                36,
                100
            );

        for (optionIndex = 0; optionIndex < 3; optionIndex++) {
            if (optionIndex === menuSelection) {
                Pip.shadeBox(22, rowY - 4, 458, rowY + 22)
            }

            h.setColor(3).drawString(
                optionIndex === 0 ?
                    "Enable" :
                    optionIndex === 1 ?
                        "Disable" :
                        "< Back",
                36,
                rowY
            );

            rowY += 36
        }
    }

    function exitToMisc() {
        try {
            Pip.changeMenu("MISC.JS")
        } catch (error) {
            try {
                Pip.changeMenu()
            } catch (fallbackError) {
            }
        }
    }

    function onKnob1(direction) {
        let optionCount;

        if (direction) {
            optionCount = selectedCompanionIndex < 0 ? 6 : 3;
            menuSelection += direction > 0 ? 1 : -1;

            if (menuSelection < 0) menuSelection = optionCount - 1;
            if (menuSelection >= optionCount) menuSelection = 0;

            Pip.playSound("SCROLL");

            selectedCompanionIndex < 0 ? drawMainMenu() : drawCompanionMenu();
            return
        }

        Pip.playSound("SELECT");

        if (selectedCompanionIndex < 0) {
            if (menuSelection === 5) {
                exitToMisc();
                return
            }

            selectedCompanionIndex = menuSelection;
            menuSelection = 0;
            drawCompanionMenu();
            return
        }

        if (menuSelection === 0) {
            saveConfig(1, companionIds[selectedCompanionIndex]);
            drawCompanionMenu();
            return
        }

        if (menuSelection === 1) {
            saveConfig(0, companionIds[selectedCompanionIndex]);
            drawCompanionMenu();
            return
        }

        menuSelection = selectedCompanionIndex;
        drawMainMenu()
    }

    function removeApp() {
        if (removed) return;
        removed = 1;

        try {
            Pip.removeListener("knob1", onKnob1)
        } catch (error) {
        }

        global.__PipCoSophiaUi = 0;

        /*
         * No Function compilation and no E.defrag() happen here.
         * Keep the firmware's menu-change hot path as small as possible.
         */
        scheduleRouterStart()
    }

    global.__PipCoSophiaUi = 1;

    stopBackgroundServices();
    loadConfig();

    /*
     * Compile the tiny detached loader while the holotape is already open,
     * not while the user is trying to leave it. The loader source itself
     * contains no try/catch, avoiding the prior Espruino parser failure.
     */
    detachedRouterLoader = createDetachedRouterLoader();

    Pip.onExclusive("knob1", onKnob1);

    drawMainMenu();

    return {
        id: "SOPHIA",
        notDefault: true,
        fullscreen: true,
        remove: removeApp
    }
});
