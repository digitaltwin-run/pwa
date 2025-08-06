/**
 * @file Utility functions for the HMI system
 * @module hmi/utils/helpers
 */

/**
 * Calculate distance between two points
 * @param {Object} p1 - First point with x and y coordinates
 * @param {Object} p2 - Second point with x and y coordinates
 * @returns {number} Distance between points
 */
export const distance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calculate the angle between three points
 * @param {Object} p1 - First point
 * @param {Object} p2 - Middle point (vertex)
 * @param {Object} p3 - Last point
 * @returns {number} Angle in degrees
 */
export const calculateAngle = (p1, p2, p3) => {
  const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
  const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  let angle = (angle2 - angle1) * (180 / Math.PI);
  return angle < 0 ? angle + 360 : angle;
};

/**
 * Calculate the average point from an array of points
 * @param {Array} points - Array of points with x and y coordinates
 * @returns {Object} Average point {x, y}
 */
export const averagePoint = (points) => {
  if (!points.length) return { x: 0, y: 0 };
  
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  };
};

/**
 * Calculate the bounding box of a set of points
 * @param {Array} points - Array of points with x and y coordinates
 * @returns {Object} Bounding box {top, right, bottom, left, width, height}
 */
export const getBoundingBox = (points) => {
  if (!points.length) return null;
  
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  
  return {
    top,
    right,
    bottom,
    left,
    width: right - left,
    height: bottom - top
  };
};

/**
 * Throttle function to limit the rate of function execution
 * @param {Function} func - The function to throttle
 * @param {number} limit - Time in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 100) => {
  let lastFunc;
  let lastRan;
  
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

/**
 * Debounce function to delay function execution
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 100) => {
  let timeout;
  
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

/**
 * Check if a point is within a bounding box
 * @param {Object} point - Point with x and y coordinates
 * @param {Object} bounds - Bounding box {top, right, bottom, left}
 * @returns {boolean} True if point is within bounds
 */
export const isPointInBounds = (point, bounds) => {
  return (
    point.x >= bounds.left &&
    point.x <= bounds.right &&
    point.y >= bounds.top &&
    point.y <= bounds.bottom
  );
};

/**
 * Calculate the total length of a path
 * @param {Array} points - Array of points with x and y coordinates
 * @returns {number} Total path length
 */
export const calculatePathLength = (points) => {
  if (points.length < 2) return 0;
  
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  
  return length;
};

/**
 * Calculate the direction vector between two points
 * @param {Object} from - Starting point
 * @param {Object} to - Ending point
 * @returns {Object} Normalized direction vector {x, y}
 */
export const getDirection = (from, to) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
  
  return {
    x: dx / len,
    y: dy / len
  };
};
