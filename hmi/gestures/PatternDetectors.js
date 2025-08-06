/**
 * @file Pattern detection utilities for gesture recognition
 * @module hmi/gestures/PatternDetectors
 */

/**
 * Helper function to calculate distance between two points
 * @private
 * @param {Object} p1 - First point with x and y coordinates
 * @param {Object} p2 - Second point with x and y coordinates
 * @returns {number} Distance between points
 */
const distance = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

/**
 * Helper function to calculate the angle between three points
 * @private
 * @param {Object} p1 - First point
 * @param {Object} p2 - Middle point
 * @param {Object} p3 - Last point
 * @returns {number} Angle in degrees
 */
const calculateAngle = (p1, p2, p3) => {
  const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
  const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  let angle = (angle2 - angle1) * (180 / Math.PI);
  return angle < 0 ? angle + 360 : angle;
};

/**
 * Circle gesture detector
 * @param {Array} points - Array of {x, y, timestamp} points
 * @param {Object} [options={}] - Detection options
 * @returns {Object} Detection result
 */
export const detectCircle = (points, options = {}) => {
  const { minRadius = 40, maxRadius = 200, tolerance = 0.3 } = options;
  
  if (points.length < 8) return { detected: false };
  
  // Calculate center point
  const center = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  };
  
  // Calculate distances from center
  const distances = points.map(p => distance(p, center));
  const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  
  if (avgRadius < minRadius || avgRadius > maxRadius) {
    return { detected: false };
  }
  
  // Check if distances are reasonably consistent (circle-like)
  const variance = distances.reduce((sum, d) => sum + (d - avgRadius) ** 2, 0) / distances.length;
  const consistency = 1 - (Math.sqrt(variance) / avgRadius);
  
  return {
    detected: consistency > (1 - tolerance),
    confidence: consistency,
    radius: avgRadius,
    center,
    area: Math.PI * avgRadius ** 2
  };
};

/**
 * Swipe gesture detector
 * @param {Array} points - Array of {x, y, timestamp} points
 * @param {Object} [options={}] - Detection options
 * @returns {Object} Detection result
 */
export const detectSwipe = (points, options = {}) => {
  const { minDistance = 50, maxTime = 500, direction = null } = options;
  
  if (points.length < 3) return { detected: false };
  
  const start = points[0];
  const end = points[points.length - 1];
  const dist = distance(start, end);
  const time = end.timestamp - start.timestamp;
  
  if (dist < minDistance || time > maxTime) {
    return { detected: false };
  }
  
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
  let detectedDirection = 'right';
  if (angle > 45 && angle <= 135) detectedDirection = 'down';
  else if (angle > 135 || angle <= -135) detectedDirection = 'left';
  else if (angle > -135 && angle <= -45) detectedDirection = 'up';
  
  if (direction && direction !== detectedDirection) {
    return { detected: false };
  }
  
  return {
    detected: true,
    direction: detectedDirection,
    distance: dist,
    velocity: dist / time,
    angle,
    duration: time
  };
};

// Export all pattern detectors as a single object
export const PatternDetectors = {
  circle: detectCircle,
  swipe: detectSwipe,
  // Other pattern detectors will be added here
};

// Export helper functions for testing
export const __test__ = {
  distance,
  calculateAngle
};
