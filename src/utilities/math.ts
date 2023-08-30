


/**
 * Calculates the standard deviaiton for an array of numbers
 * 
 * @param arr - array of values to caluclate the standard deviation
 * @returns - the standard deviation
 */
export function calculateStandardDeviation(arr: number[]): number | undefined {
    const n = arr.length;
    if (n < 2) { return undefined; }

    const mean = arr.reduce((acc, val) => acc + val, 0) / n;
    const variance = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (n - 1);

    return Math.sqrt(variance);
}

/**
 * Returns true if the the value is within the provided bound(s). One bound
 * and not the other may be provided to act as a floor or ceiling.
 * 
 * @param v - value to be checked
 * @param min - minimum allowed value
 * @param max - maximum allowed value
 * @returns - true if the value is within the allowed range
 */
export function isWithinBounds(v: number, min?: number, max?: number): boolean {
    if (min == null && max == null) { return false; }
    else if (min == null && max != null) { return v < max; }
    else if (min != null && max == null) { return v > min; }
    else if (min != null && max != null) { 
        return v < max && v > min; 
    }
    return undefined;
}