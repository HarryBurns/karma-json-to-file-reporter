'use strict';

const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');

const jsonToFileReporter = function (baseReporterDecorator, config, logger) {
  let mylog = logger.create('reporter.json-to-file');
  let reporterConfig = config.jsonToFileReporter || {};

  // Stuff for file naming:
  let karmaStartTime = new Date().getTime();
  let fileIndex = 0;

  // region Parsing config

  let outputPath = reporterConfig['outputPath'] ? reporterConfig['outputPath'] : '';
  let fileName = reporterConfig['fileName'] ? reporterConfig['fileName'] : 'logFile_*start-timestamp*.json';
  let filter = reporterConfig['filter'] ? reporterConfig['filter'] : void 0;
  let overwrite = reporterConfig['overwrite'] === true;

  // endregion

  // region Validating config

  if (outputPath != null && typeof outputPath !== 'string') {
    mylog.warn("`outputPath` parameter should be string");
    return;
  }

  if (fileName != null && typeof fileName !== 'string') {
    mylog.warn("`fileName` parameter should be string");
    return;
  }

  if (filter != null && typeof filter !== 'string' && typeof filter !== "function") {
    mylog.warn("`filter` parameter should be string or function");
    return;
  }

  // endregion

  // region ensure path existence

  try {
    ensureDirectoryExistence(outputPath);
  } catch (e) {
    mylog.warn(`Unable to create path "${outputPath}"`, e);
  }

  // endregion

  // region removing old file

  if (overwrite) {
    let filePath = getFilePath();
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      mylog.warn(`Unable to remove old file "${filePath}"`, e);
    }
  }

  // endregion

  baseReporterDecorator(this); // native stuff

  // On Browser log function call
  this.onBrowserLog = function (browser, log, type) {
    // region Checking input, creating js object from string if necessary

    if (!log) {
      return;
    }

    let jsonObj;

    if (typeof log === 'string') {
      try {
        // sometimes logged message wrapped with ' or " so we'll remove it
        let lastCharIndex = log.length - 1;
        let firstChar = log.charAt(0);
        let lastChar = log.charAt(lastCharIndex);
        if ((firstChar === '\'' && lastChar === '\'') || (firstChar === '"' && lastChar === '"')) {
          log = log.substring(1, lastCharIndex);
        }

        // and sometimes it contains "Object" before objects (Chrome feature maybe)
        if (log.startsWith("Object{")) {
          log = log.replace(/Object{/gi, "{");
        }

        jsonObj = JSON5.parse(log);

        if (!jsonObj) {
          return;
        }
      } catch (e) {
        return;
      }
    } else if (typeof log === 'object') {
      jsonObj = log;
    } else {
      return;
    }

    // endregion

    // applying "filter"
    if (!filterJson(jsonObj)) {
      return;
    }

    let filePath = getFilePath();

    let oldObj = [];

    // region Checking old file

    let existentFileContent;
    try {
      existentFileContent = fs.readFileSync(filePath, {"flag": "a+"});
    } catch (e) {
      mylog.warn(`can not read file ${filePath}`, e);
      return;
    }
    if (existentFileContent && existentFileContent.length !== 0) {
      try {
        oldObj = JSON5.parse(existentFileContent.toString());
      } catch (e) {
        mylog.warn("can not parse json file to append new data", e);
        return;
      }
      if (!oldObj) {
        oldObj = [];
      }
      if (!Array.isArray(oldObj)) {
        mylog.warn("can not parse json file to append new data");
        return;
      }
    }

    // endregion

    // region

    oldObj.push(jsonObj);

    try {
      fs.writeFileSync(
        filePath,
        JSON.stringify(oldObj, null, 2)
      );
    } catch (e) {
      mylog.warn(`can not write file ${filePath}`, e);
      return;
    }

    // endregion
  };

  /**
   * Check if JSON object pass our "filter"
   * @return {boolean}
   */
  function filterJson(obj) {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    if (!filter) {
      return true;
    }

    if (typeof filter === 'string') {
      if (filter.indexOf('.') === -1) {
        try {
          // for dot-separated path
          let s = filter.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
          s = s.replace(/^\./, '');           // strip a leading dot
          let propPath = s.split('.');
          // go through object by prop path and check if there is such property
          let fieldToCheck = propPath.reduce((acc, key) => (acc != null && acc[key] != null) ? acc[key] : void 0, obj);
          return typeof fieldToCheck !== 'undefined'; // we check only for property existence. Null, NaN, etc will pass
        } catch (e) {
          mylog.warn("`filter` parse error", e);
          return false;
        }

      } else {
        return !!obj[filter];
      }
    } else if (typeof filter === "function") {
      try {
        return filter(obj);
      } catch (e) {
        mylog.warn("`filter` execution error", e);
        return false;
      }
    } else {
      // unexpected
      mylog.warn("`filter` parameter should be string or function");
    }

    return false;
  }

  /**
   * Calculate file name from pattern
   * @return {string}
   */
  function getFilePath() {
    let nameReplaced = fileName
      .replace("*timestamp*", karmaStartTime.toString())
      .replace("*index*", (fileIndex++).toString());
    return path.join(outputPath, nameReplaced);
  }

  /**
   * Create folder path recursively if not exists
   * @param {string} filePath
   * @return {boolean}
   */
  function ensureDirectoryExistence(filePath) {
    if (fs.existsSync(filePath)) {
      return true;
    }
    ensureDirectoryExistence(path.dirname(filePath));
    fs.mkdirSync(filePath);
  }
};

jsonToFileReporter.$inject = ['baseReporterDecorator', 'config', 'logger'];

module.exports = {
  'reporter:json-to-file': ['type', jsonToFileReporter]
};
