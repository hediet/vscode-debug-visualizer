// This is the entry point when this package is used as library from the extension.
// This package MUST NOT be bundled.
const path = require("path");

module.exports.distPath = path.join(__dirname, "dist");
