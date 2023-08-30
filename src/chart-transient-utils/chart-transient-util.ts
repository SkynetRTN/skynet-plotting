/* METHODS */
export const FILTERS: string[] = ['U', 'B', 'V', 'R', 'I',
                                  'Y', 'J', 'H', 'K', "u\'",
                                  "g\'", "r\'", "i\'", "z\'",
                                  'uprime', 'gprime', 'rprime',
                                  'iprime', 'zprime']

export const findDelimiter = (s: string) => {
    let plus = false;
    let minus = false;

    if (/[+]/g.test(s)) {
        plus = true;
    }
    if (/[-]/g.test(s)) {
        minus = true;
    }
    if (plus && !minus) {
        return '+';
    }
    if (!plus && minus) {
        return '-';
    }
    return null;
}

export const formatFilterName = (f: string) => {
    if (f === 'uprime') {
        f = "u\'";
    } else if (f === 'rprime') {
        f = "r\'";
    } else if (f === 'gprime') {
        f = "g\'";
    } else if (f === 'iprime') {
        f = "i\'";
    } else if (f === 'zprime') {
        f = "z\'";
    }
    return f;
}


/* HASH TABLES */
export const ZERO_POINT_VALUES: { [key: string]: number } = {
    'U': 1.790,
    'B': 4.063,
    'V': 3.636,
    'R': 3.064,
    'I': 2.416,
    'J': 1.589,
    'H': 1.021,
    'K': 0.640,
    "u\'": 3.680,
    "g\'": 3.643,
    "r\'": 3.648,
    "i\'": 3.644,
    "z\'": 3.631,
}

export const FILTERCOLORS: { [key: string]: string } = {
    'U': '#8601AF',
    'B': '#0247FE',
    'V': '#66B032',
    'R': '#FE2712',
    'I': '#4424D6',
    'Y': '#347C98',
    'J': '#66B032',
    'H': '#FC600A',
    'K': '#FE2712',
    "u\'": '#4424D6',
    "g\'": '#347C98',
    "r\'": '#FC600A',
    "i\'": '#8601AF',
    "z\'": '#0247FE',
    'uprime': '#4424D6',
    'gprime': '#347C98',
    'rprime': '#FC600A',
    'iprime': '#8601AF',
    'zprime': '#0247FE'
}
