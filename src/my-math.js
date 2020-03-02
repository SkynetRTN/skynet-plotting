'use strict';

/**
 *  This function takes a floating point number and round it to a specified decimal places.
 *  @param value:   The value to be rounded.
 *  @param digits:  The decimal places to round the value.
 *  @returns {number}
 */
export function round(value, digits) {
  return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
}

/**
 *  This function returns the square of the input n.
 *  @param n:       The input number to be squared.
 *  @returns {number}
 */
export function sqr(n) {
  return Math.pow(n, 2);
}

/**
 *  This function takes an angle in degrees and returns it in radians.
 *  @param degree:  An angle in degrees
 *  @returns {number}
 */
export function rad(degree) {
  return degree / 180 * Math.PI;
}
