function consoleLogger(moduleStr) {
  return {
    log: function(message, stack) {
      this.createLog(message, stack, 'log', false);
    },

    debug: function(message, stack) {
      this.createLog(message, stack, 'debug', true);
    },

    info: function(message, stack) {
      this.createLog(message, stack, 'info', false);
    },

    error: function(message, stack) {
          this.createLog(message, stack, 'error', true);
    },

    createLog: function(message, stack, severity, shouldSave) {
      const now = new Date();
      const moduleNameStr = !this.moduleName ? "" : " " + this.moduleName;
      const data = {
        date: now.toLocaleString(),
        moduleName: this.moduleName,
        message,
        stack,
        severity
      };
      
      if (shouldSave) {
        //const wDB = require("../whatsapp/db/credentials")();
        //wDB.saveLog(data);
      }
    }
  };
}

module.exports = consoleLogger;