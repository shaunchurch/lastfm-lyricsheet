const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  getAnchoredWindowBounds,
} = require("../.cache/test-build/src/main/window-bounds.js");

const workArea = {
  x: 0,
  y: 0,
  width: 1440,
  height: 900,
};

test("resizing near the left edge keeps the left inset", () => {
  const result = getAnchoredWindowBounds(
    { x: 24, y: 80, width: 560, height: 760 },
    { width: 344, height: 72 },
    workArea,
  );

  assert.deepEqual(result, {
    x: 24,
    y: 80,
    width: 344,
    height: 72,
  });
});

test("resizing near the right edge keeps the right inset", () => {
  const result = getAnchoredWindowBounds(
    { x: 856, y: 80, width: 560, height: 760 },
    { width: 344, height: 72 },
    workArea,
  );

  assert.deepEqual(result, {
    x: 1072,
    y: 80,
    width: 344,
    height: 72,
  });
});

test("expanding from the right edge grows back toward the left", () => {
  const result = getAnchoredWindowBounds(
    { x: 1072, y: 80, width: 344, height: 72 },
    { width: 560, height: 760 },
    workArea,
  );

  assert.deepEqual(result, {
    x: 856,
    y: 80,
    width: 560,
    height: 760,
  });
});
