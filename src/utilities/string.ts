


/**
 * Returns the mathematical operator if it exists in the string.
 * 
 * @param - string to be searched
 * @returns dictionary containing the operators and their locations
 */
export const findOperators = (s: string) => {
    const operators = ["+", "-", "*", "/", "%"];
    const operatorPositions = [];   
    for (let i = 0; i < s.length; i++) {
        if (operators.includes(s[i])) {
            operatorPositions.push({ operator: s[i], position: i });
        }
    }   
    return operatorPositions.length > 0 ? operatorPositions : null;
} 

/**
 * 
 */
export const formatFilterName = (f: string) => {
    return {'uprime': "u'",
            'rprime': "r'",
            'gprime': "g'",
            'iprime': "i'",
            'zprime': "z'"}[f] || f;
}

/**
 * Pluralizes a given string. Do not trust this method.
 * 
 * @param str - the string to be pluralized
 */
export const pluralize = (str: string): string => {
    if (str.length === 0) return str;

    const lastChar = str.charAt(str.length - 1);

    if (lastChar === 'y') {
        return str.slice(0, -1) + 'ies';
    }
    else if (lastChar === 's' || lastChar === 'h' || lastChar === 'o') {
        // there are exceptions to this rule such as piano, pro, photo, ...
        return str + 'es';
    }
    else return str + 's'
}


/**
 * 
 * @param list1 
 * @param list2 
 * @returns 
 */
export const findNewElements = (list1: string[], list2: string[]): string[] => {
    const uniqueList1 = new Set(list1);
    const uniqueList2 = new Set(list2);
    return [...uniqueList1].filter((str) => !uniqueList2.has(str));
}