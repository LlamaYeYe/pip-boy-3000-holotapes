(function () {
  var SERVICE_VERSION = 'v3.51nolog';
  var fs = require('fs');
  var BASE_PATH = 'HOLO/Project_Sophia/';
  var CONFIG_PATH = BASE_PATH + 'SOPHIA_CONFIG.JSON';
  var service = global.__PipCoSophiaService;
  var config;
  var source;
  var factory;

  function collectGarbage() {
    try {
      process.memory(true);
      E.defrag();
    } catch (error) {}
  }

  function loadConfig() {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH));
      return {
        enabled: config.enabled ? 1 : 0,
        companion: config.companion || 'YES_MAN',
      };
    } catch (error) {
      return { enabled: 0, companion: 'YES_MAN' };
    }
  }

  try {
    /*
     * S.O.P.H.I.A.'s companion service intentionally survives normal page
     * changes so it can speak outside the configuration holotape.  Keep one
     * narrow resident handle for that service only; the UI receives the
     * service directly instead of discovering it through another global.
     */
    if (service && service.version !== SERVICE_VERSION) {
      try {
        if (service.destroy) service.destroy();
      } catch (error) {}
      service = 0;
      collectGarbage();
    }

    if (!service) {
      config = loadConfig();
      source = fs.readFileSync(BASE_PATH + 'SOPHIA_SERVICE.JS');
      factory = Function('return ' + source)();
      source = 0;
      collectGarbage();
      service = factory(config, fs, BASE_PATH);
      factory = 0;
      config = 0;
    }

    if (service) {
      try {
        if (service.statusDetach) service.statusDetach();
      } catch (error) {}
      try {
        if (service.setEnabled) service.setEnabled(0);
        else service.enabled = 0;
      } catch (error) {}
    }

    collectGarbage();
    source = fs.readFileSync(BASE_PATH + 'SOPHIA_UI.JS');
    factory = Function('return ' + source)();
    source = 0;
    collectGarbage();

    return factory(service);
  } catch (error) {
    try {
      console.log('SOPHIA BOOT FAIL ' + error);
    } catch (ignored) {}
    throw error;
  }
});
