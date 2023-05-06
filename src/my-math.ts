'use strict';

/**
 *  This function takes a floating point number and round it to a specified decimal places.
 *  @param value:   The value to be rounded.
 *  @param digits:  The decimal places to round the value.
 *  @returns {number}
 */
export function round(value: number, digits: number): number {
    return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
}

/**
 *  This function takes a floating point number and rounds it up to a specified decimal places.
 *  @param value:   The value to be rounded up.
 *  @param digits:  The decimal places to round the value up.
 *  @returns {number}
 */
export function ceiling(value: number, digits: number): number {
    return Math.ceil(value * Math.pow(10, digits)) / Math.pow(10, digits);
}

/**
 * Clamps a number. Note the output is a string since this function directly
 * interacts with HTMLInputElement, whose values are always strings.
 * @param num The string representing the number to be clamped.
 * @param min The lower boundary of the output range. NaN indicates none.
 * @param max The upper boundary of the output range. NaN indicates none.
 * @returns A string representing the clamped number.
 */
export function clamp(num: string | number, min: number, max: number): string {
    let parsed = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsed)) {
        if (!isNaN(min) && min > 0) {
            return min.toString();
        } else {
            return '0';
        }
    }
    if (!isNaN(min) && parsed < min) {
        return min.toString();
    } else if (!isNaN(max) && parsed > max) {
        return max.toString();
    }
    return num.toString();
};

/**
 *  This function returns the square of the input n.
 *  @param n:       The input number to be squared.
 *  @returns {number}
 */
export function sqr(n: number): number {
    return Math.pow(n, 2);
}

/**
 *  This function takes an angle in degrees and returns it in radians.
 *  @param degree:  An angle in degrees
 *  @returns {number}
 */
export function rad(degree: number): number {
    return degree / 180 * Math.PI;
}

/**
 * This function computes the Error Considered Lomb Scargle periodogram for a given set of time/observation data.
 * @param {array(number)} ts The array of time values
 * @param {array{number}} ys They array of observation values. The length of ys and ts must match
 * @param {number}  start the starting period
 * @param {number} stop the stopin period
 * @param {number} steps number of steps between start and stop. Default is 1000.
 */
export function lombScargleWithError(ts: number[], ys: number[], error: number[], start: number, stop: number, steps: number = 1000, freqMode = false): any[] {
    
    if (ts.length != ys.length) {
        alert("Dimension mismatch between time array and value array.");
        return null;
    }

    let step = (stop - start) / steps;

    // Nyquist is not used here. But it became useful for default frequency ranges in
    // Fourier transform!! (In pulsar mode).
    // let nyquist = 1.0 / (2.0 * (ArrMath.max(ts) - ArrMath.min(ts)) / ts.length);
    let hResidue = ArrMath.sub(ys, ArrMath.errorMean(ys, error));
    let twoVarOfY = 2 * ArrMath.var(ys);

    // xVal is what we iterate through & push to result. It will either be frequency or
    // period, depending on the mode.
    let spectralPowerDensity = [];
    let i = 0
    for (let xVal = start; xVal < stop; xVal += step) {
        // Huge MISTAKE was here: I was plotting power vs. frequency, instead of power vs. period

        let logXVal = Math.exp(Math.log(start)+(Math.log(stop)-Math.log(start))*i/(steps))

        // let frequency = freqMode ? xVal : 1 / xVal;
        let frequency = freqMode ? logXVal : 1 / logXVal;

        let omega = 2.0 * Math.PI * frequency;
        let twoOmegaT = ArrMath.mul(2 * omega, ts);
        let tau = Math.atan2(ArrMath.sum(ArrMath.sin(twoOmegaT)), ArrMath.sum(ArrMath.cos(twoOmegaT))) / (2.0 * omega);
        let omegaTMinusTau = ArrMath.mul(omega, ArrMath.sub(ts, tau));

        spectralPowerDensity.push({
            x: logXVal,
            y: (Math.pow(ArrMath.errordot(hResidue, error, ArrMath.cos(omegaTMinusTau)), 2.0) /
                ArrMath.dot(ArrMath.cos(omegaTMinusTau)) +
                Math.pow(ArrMath.errordot(hResidue, error, ArrMath.sin(omegaTMinusTau)), 2.0) /
                ArrMath.dot(ArrMath.sin(omegaTMinusTau))) / twoVarOfY,
        });
        i++
    }

    return spectralPowerDensity;
}


/**
 * This function computes the Lomb Scargle periodogram for a given set of time/observation data.
 * @param {array(number)} ts The array of time values
 * @param {array{number}} ys They array of observation values. The length of ys and ts must match
 * @param {number}  start the starting period
 * @param {number} stop the stopin period
 * @param {number} steps number of steps between start and stop. Default is 1000.
 */
 export function lombScargle(ts: number[], ys: number[], start: number, stop: number, steps: number = 1000, freqMode = false): any[] {
    if (ts.length != ys.length) {
        alert("Dimension mismatch between time array and value array.");
        return null;
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
    let i = 0;
    for (let xVal = start; xVal < stop; xVal += step) {
        // Huge MISTAKE was here: I was plotting power vs. frequency, instead of power vs. period

        let logXVal = Math.exp(Math.log(start)+(Math.log(stop)-Math.log(start))*i/(steps))
        let frequency = freqMode ? logXVal : 1 / logXVal;
        if(freqMode === true){
            frequency = freqMode ? xVal : 1 / xVal;
            logXVal = xVal
        }

        let omega = 2.0 * Math.PI * frequency;
        let twoOmegaT = ArrMath.mul(2 * omega, ts);
        let tau = Math.atan2(ArrMath.sum(ArrMath.sin(twoOmegaT)), ArrMath.sum(ArrMath.cos(twoOmegaT))) / (2.0 * omega);
        let omegaTMinusTau = ArrMath.mul(omega, ArrMath.sub(ts, tau));

        spectralPowerDensity.push({
            x: logXVal,
            y: (Math.pow(ArrMath.dot(hResidue, ArrMath.cos(omegaTMinusTau)), 2.0) /
                ArrMath.dot(ArrMath.cos(omegaTMinusTau)) +
                Math.pow(ArrMath.dot(hResidue, ArrMath.sin(omegaTMinusTau)), 2.0) /
                ArrMath.dot(ArrMath.sin(omegaTMinusTau))) / twoVarOfY,
        });
        i++;
    }

    return spectralPowerDensity;
}


export function backgroundSubtraction(time: number[], flux: number[], dt: number): number[] {
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

/**
 * Returns the median of an array of number. The array necessarily sorted.
 * @param arr Array of numbers to find the median
 * @returns The median of the numbers
 */
export function median(arr: number[]) {
    arr = arr.filter(num => !isNaN(num));
    const mid = Math.floor(arr.length / 2);
    const nums = arr.sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

/**
 * This function computes the floating point modulo.
 * @param {number} a The dividend
 * @param {number} b The divisor
 */
export function floatMod(a: number, b: number) {
    while (a > b) {
        a -= b;
    }
    return a;
}

export const ArrMath = {
    max: function (arr: number[]): number {
        return Math.max.apply(null, arr);
    },
    min: function (arr: number[]): number {
        return Math.min.apply(null, arr);
    },
    sum: function (arr: number[]): number {
        return arr.reduce((acc, cur) => acc + cur, 0);
    },
    weightedSum: function (arr: number[], weight: number[]): number {
        let summed = 0;
        for (let i = 0; i < arr.length; i++) {
            summed = summed + arr[i] * weight[i];
        }

        return summed
    },
    mean: function (arr: number[]): number {
        return this.sum(arr) / arr.length;
    },
    errorMean: function (arr: number[], error: number[]) {
        let weight = [];
        for (let i = 0; i < arr.length; i++) {
            weight[i] = 1 / (error[i] * error[i])
        }

        return this.weightedSum(arr, weight) / this.sum(weight)

    },
    mul: function (arr1: number[] | number, arr2: number[] | number): number[] {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when multiplying two arrays.");
            return arr1.map((x, i) => x * arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x * (arr2 as number));
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x * (arr1 as number));
        } else {
            throw new TypeError("Error: Do not use ArrMath for scalar multiplications");
        }
    },
    div: function (arr1: number[] | number, arr2: number[] | number): number[] {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when dividing two arrays.");
            return arr1.map((x, i) => x / arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x / (arr2 as number));
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x / (arr1 as number));
        } else {
            throw new TypeError("Error: Do not use ArrMath for scalar divisions");
        }
    },
    add: function (arr1: number[] | number, arr2: number[] | number): number[] {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when adding two arrays.");
            return arr1.map((x, i) => x + arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x + (arr2 as number));
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x + (arr1 as number));
        } else {
            throw new TypeError("Error: Do not use ArrMath for scalar additions");
        }
    },
    sub: function (arr1: number[] | number, arr2: number[] | number): number[] {
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when subtracting two arrays.");
            return arr1.map((x, i) => x - arr2[i]);
        } else if (Array.isArray(arr1)) {
            return arr1.map(x => x - (arr2 as number));
        } else if (Array.isArray(arr2)) {
            return arr2.map(x => x - (arr1 as number));
        } else {
            throw new TypeError("Error: Do not use ArrMath for scalar subtractions");
        }
    },
    dot: function (arr1: number[] | number, arr2?: number[] | number): number {
        if (arr2 === undefined) {
            return this.dot(arr1, arr1);
        }
        if (Array.isArray(arr1) && Array.isArray(arr2)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when dot multiplying two arrays.");
            return arr1.reduce((acc, cur, i) => (acc + cur * arr2[i]), 0);
        } else if (!Array.isArray(arr1) && !Array.isArray(arr2)) {
            return arr1 * arr2;
        } else {
            throw new TypeError("Error: Can't take dot product of a vector and a number");
        }
    },
    errordot: function (arr1: number[] | number, error: number[] | number, arr2?: number[] | number,): number {
        if (arr2 === undefined) {
            return this.errordot(arr1, error, arr1);
        }
        if (Array.isArray(arr1) && Array.isArray(arr2) && Array.isArray(error)) {
            console.assert(arr1.length === arr2.length,
                "Error: Dimension mismatch when dot multiplying two arrays.");
            let weight = [];
            let dotlist = []
            for (let i = 0; i < arr1.length; i++) {
                weight[i] = 1 / (error[i] * error[i])
                dotlist.push(arr1[i] * arr2[i])
            }

            return this.weightedSum(dotlist, weight) / this.sum(weight);
        } else if (!Array.isArray(arr1) && !Array.isArray(arr2) && !Array.isArray(error)) {
            return arr1 * arr2;
        } else {
            throw new TypeError("Error: Can't take dot product of a vector and a number");
        }
    },
    cos: function (arr: number[]): number[] {
        return arr.map(x => Math.cos(x));
    },
    sin: function (arr: number[]): number[] {
        return arr.map(x => Math.sin(x));
    },
    var: function (arr: number[]): number {
        // Variance
        let mean = this.mean(arr);
        return this.sum(arr.map(x => Math.pow(x - mean, 2))) / arr.length;
    }
}

//Returns a pseudorandom number generator function. A bad one, but a pseudorandom one nonetheless.
export function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}
