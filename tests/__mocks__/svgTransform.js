// Mock transform for SVG files in Jest tests
module.exports = {
  process() {
    return 'module.exports = {};';
  },
  getCacheKey() {
    // The output is always the same, so we can use a static cache key
    return 'svgTransform';
  },
};
