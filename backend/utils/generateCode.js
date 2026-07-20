const { nanoid } = require('nanoid');

// Generates a short, human-readable unique code for each gallon,
// e.g. AQM-7F3K9QRT. This value is what gets encoded into the QR label.
function generateGallonCode() {
  return `AQM-${nanoid(8).toUpperCase()}`;
}

module.exports = { generateGallonCode };
