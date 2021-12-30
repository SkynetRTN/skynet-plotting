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
 * Returns a number whose value is limited to the given range.
 * @param {Number} num The number to be clamped. It will be parsed as float first.
 * @param {Number} min The lower boundary of the output range. NaN indicates none.
 * @param {Number} max The upper boundary of the output range. NaN indicates none.
 * @returns A number in the range [min, max]
 */
export function clamp(num, min, max) {
    let parsed = parseFloat(num);
    if (!isNaN(min) && parsed < min) {
        num = min;
    }
    if (!isNaN(max) && parsed > max) {
        num = max;
    }
    return num;
};

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

/**
 * This function computes the Lomb Scargle periodogram for a given set of time/observation data.
 * @param {array(number)} ts The array of time values
 * @param {array{number}} ys They array of observation values. The length of ys and ts must match
 * @param {number}  start the starting period
 * @param {number} stop the stopin period
 * @param {number} steps number of steps between start and stop. Default is 1000.
 */
export function lombScargle(ts, ys, start, stop, steps = 1000, freqMode = false) {
    if (ts.length != ys.length) {
        alert("Dimension mismatch between time array and value array.");
        return;
    }

    let step = (stop - start) / steps;

    // Nyquist is not used here. But it became useful for default frequency ranges in
    // Fourier transform!! (In pulsar mode).
    // let nyquist = 1.0 / (2.0 * (ArrMath.max(ts) - ArrMath.min(ts)) / ts.length);
    let hResidue = ArrMath.sub(ys, ArrMath.mean(ys));
    let twoVarOfY = 2 * ArrMath.var(ys);

    // xVal is what we iterate through & push to result. It will either be frequency or
    // period, depending on the mode.
    let spectralPowerDensity = [];
    for (let xVal = start; xVal < stop; xVal += step) {
        // Huge MISTAKE was here: I was plotting power vs. frequency, instead of power vs. period
        let frequency = freqMode ? xVal : 1 / xVal;

        let omega = 2.0 * Math.PI * frequency;
        let twoOmegaT = ArrMath.mul(2 * omega, ts);
        let tau = Math.atan2(ArrMath.sum(ArrMath.sin(twoOmegaT)), ArrMath.sum(ArrMath.cos(twoOmegaT))) / (2.0 * omega);
        let omegaTMinusTau = ArrMath.mul(omega, ArrMath.sub(ts, tau));

        spectralPowerDensity.push({
            x: xVal,
            y: ((Math.pow(ArrMath.dot(hResidue, ArrMath.cos(omegaTMinusTau)), 2.0)) /
                (ArrMath.dot(ArrMath.cos(omegaTMinusTau))) +
                (Math.pow(ArrMath.dot(hResidue, ArrMath.sin(omegaTMinusTau)), 2.0)) /
                (ArrMath.dot(ArrMath.sin(omegaTMinusTau)))) / twoVarOfY,
        });
    }

    return spectralPowerDensity;
}

export function backgroundSubtraction(time, flux, dt) {
    let n = Math.min(time.length, flux.length);
    const subtracted = [];

    let jmin = 0;
    let jmax = 0;
    for (let i = 0; i < n; i++) {
        while (jmin < n && time[jmin] < time[i] - (dt / 2)) {
            jmin++;
        }
        while (jmax < n && time[jmax] <= time[i] + (dt / 2)) {
            jmax++;
        }
        let fluxmed = median(flux.slice(jmin, jmax));
        subtracted.push(flux[i] - fluxmed);
    }
    return subtracted;
}

export function median(arr) {
    arr = arr.filter(num => !isNaN(num));
    const mid = Math.floor(arr.length / 2);
    const nums = arr.sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};


export let ArrMath = {
    max: function (arr) {
        return Math.max.apply(null, arr);
    },
    min: function (arr) {
        return Math.min.apply(null, arr);
    },
    sum: function (arr) {
        return arr.reduce((acc, cur) => acc + cur, 0);
    },
    mean: function (arr) {
        return this.sum(arr) / arr.length;
    },
    mul: function (arr1, arr2) {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when multiplying two arrays.");
            return arr1.map((x, i) => x * arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x * arr2);
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x * arr1);
        } else {
            return arr1 * arr2;
        }
    },
    div: function (arr1, arr2) {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when dividing two arrays.");
            return arr1.map((x, i) => x / arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x / arr2);
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x / arr1);
        } else {
            return arr1 / arr2;
        }
    },
    add: function (arr1, arr2) {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when adding two arrays.");
            return arr1.map((x, i) => x + arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x + arr2);
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x + arr1);
        } else {
            return arr1 + arr2;
        }
    },
    sub: function (arr1, arr2) {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when subtracting two arrays.");
            return arr1.map((x, i) => x - arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x - arr2);
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x - arr1);
        } else {
            return arr1 - arr2;
        }
    },
    dot: function (arr1, arr2) {
        if (arr2 === undefined) {
            return this.dot(arr1, arr1);
        }
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when dot multiplying two arrasy.");
            return arr1.reduce((acc, cur, i) => (acc + cur * arr2[i]), 0);
        } else if (!Array.isArray(arr1) && !Array.isArray(arr2)) {
            return arr1 * arr2;
        } else {
            throw new TypeError("Error: Can't take dot product of a vector and a number");
        }
    },
    cos: function (arr) {
        return arr.map(x => Math.cos(x));
    },
    sin: function (arr) {
        return arr.map(x => Math.sin(x));
    },
    var: function (arr) {
        // Variance
        let mean = this.mean(arr);
        return this.sum(arr.map(x => Math.pow(x - mean, 2))) / arr.length;
    }
}