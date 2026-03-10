"use strict";

class FallbackDOMException extends Error {
  constructor(message = "", name = "Error") {
    super(message);
    this.name = name;
  }
}

const DOMExceptionImpl = globalThis.DOMException || FallbackDOMException;

module.exports = DOMExceptionImpl;
module.exports.default = DOMExceptionImpl;
