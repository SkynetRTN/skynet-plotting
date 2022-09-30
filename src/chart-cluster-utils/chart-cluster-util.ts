/**
 * This file contains general utility functions that would be used by multiple functions of cluster interfaces
 */


import { Chart, Color } from "chart.js";

// @ts-ignore
export const baseUrl: string = import.meta.env.VITE_API_URL

/**
 * This function returns a paired key-value of filters corresponding to the function needed to claculate magnitude.
 * Used for data coloring and chart scaling.
 */
export function filterMags(): { [key: string]: Function[] } {
    return {
        'red': [
            (a: number) => { return -604.9556806553 * a ** 4 + 6657.4536333723 * a ** 3 - 27441.1323617070 * a ** 2 + 50194.4653936770 * a - 34357.3779319381 },
            (a: number) => { return -17.2973064259 * a ** 4 + 155.8920623226 * a ** 3 - 471.5079870677 * a ** 2 + 482.3528952725 * a - 3.5819536823 },
            (a: number) => { return 11.9244167337 * a ** 2 - 79.9482119938 * a ** + 140.0181065948 },
        ],
        'faint': [
            (a: number) => { return -604.9556806553 * a ** 4 + 6657.4536333723 * a ** 3 - 27441.1323617070 * a ** 2 + 50194.4653936770 * a - 34357.3779319381 },
            (a: number) => { return -17.2973064259 * a ** 4 + 155.8920623226 * a ** 3 - 471.5079870677 * a ** 2 + 482.3528952725 * a - 3.5819536823 },
            (a: number) => { return 11.9244167337 * a ** 2 - 79.9482119938 * a ** + 140.0181065948 },
        ],
        'blue': [
            (a: number) => { return -432.3187790466 * a ** 4 + 4844.3907659246 * a ** 3 - 20351.2132865810 * a ** 2 + 37989.5444003501 * a - 26593.1590790576 },
            (a: number) => { return 64.2415377544 * a ** 4 - 716.2518817838 * a ** 3 + 2993.0524145205 * a ** 2 - 5551.5482754012 * a + 3848.8331639064 },
            (a: number) => { return -1.8118436212 * a ** 2 + 12.6764507556 * a - 25.9497039289 },
        ],
        'bright': [
            (a: number) => { return 496.2961271126 * a ** 4 - 5416.9941114328 * a ** 3 + 22145.4191356992 * a ** 2 - 40191.1352476384 * a + 27312.8317216371 },
            (a: number) => { return 415.1740517030 * a ** 4 - 4647.3324718671 * a ** 3 + 19494.9006610996 * a ** 2 - 36323.2785086341 * a + 25353.6661077333 },
            (a: number) => { return 10.8290320338 * a ** 2 - 71.5469551223 * a + 105.6498422000 },
        ]
    };
}


/**
 * Constant of the value of wavelength each filter has
 * in micrometer
 */
export const filterWavelength: { [key: string]: number } = {
    U: 0.364,
    B: 0.442,
    V: 0.54,
    R: 0.647,
    I: 0.7865,
    "u\'": 0.354,
    "g\'": 0.475,
    "r\'": 0.622,
    "i\'": 0.763,
    "z\'": 0.905,
    J: 1.25,
    H: 1.65,
    K: 2.15,
    Ks: 2.15,
    W1: 3.4,
    W2: 4.6,
    W3: 12,
    W4: 22,
    GBP: 0.532,
    G: 0.673,
    GRP: 0.797,
};

/**Get http request asynchronously
 * @param {string} theUrl -request ultra link
 * @param {function} callback -function to execute with http response
 * @param {function} failedCallback -function to execute when http request failed
 */
export function httpGetAsync(theUrl: string, callback: Function, failedCallback: Function = () => { }) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            try {
                callback(xmlHttp.responseText);
            } catch (e) {
                console.trace(e)
                console.log(JSON.parse(xmlHttp.responseText))
            }
        } else if (xmlHttp.status != 200 && xmlHttp.readyState == 4 && xmlHttp.response == "") {
            try {
                failedCallback(xmlHttp.responseText);
            } catch (e) {
                console.log(e)
                console.log(JSON.parse(xmlHttp.responseText))
            }
        }
    };
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}
//create and export a function that uses the http push to send the data to the server
export function httpPostAsync(theUrl: string, data: any, callback: Function, failedCallback: Function) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {  // Function to be called when the request is completed
        if (xmlHttp.status == 200 && xmlHttp.readyState == 4 && xmlHttp.response != "") {
            try {
                callback(xmlHttp.responseText);
            } catch {
                failedCallback(xmlHttp.responseText);
                console.log(JSON.parse(xmlHttp.responseText))
            }
        } else if (xmlHttp.status != 200 && xmlHttp.readyState == 4 && xmlHttp.response == "") {
            try {
                failedCallback(xmlHttp.responseText);
            } catch {
                console.log(xmlHttp.responseText)
            }
        }
    };
    xmlHttp.open("POST", theUrl, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(JSON.stringify(data));
}


export function modelFormKey(chartNum: number, color: string) {
    return chartNum > 0 ? (color + (chartNum + 1).toString()) : color
}

export function modelFormKeys(chartNum: number, form: ClusterForm) {
    function getFilter(key: string): string {
        return form[key].value
    }
    let returnArray = []
    let filterList = ['blue', 'red', 'lum']
    for (let i = 0; i < filterList.length; i++) {
        returnArray.push(getFilter(modelFormKey(chartNum, filterList[i])))
    }
    return returnArray
}

/**
 * Return the new paried key-value of min and max of x and y values compared to the new ones
 * @param scaleLimits the old paired key-value of coordinates min/max
 * @param x the new x for comparison
 * @param y the new y for comparison
 */
export function pointMinMax(scaleLimits: { [key: string]: number }, x: number, y: number) {
    let newLimits = scaleLimits;
    if (isNaN(newLimits["minX"]) || isNaN(newLimits["maxX"]) || isNaN(newLimits["minY"]) || isNaN(newLimits["maxY"])) {
        newLimits["minX"] = x;
        newLimits["maxX"] = x;
        newLimits["minY"] = y;
        newLimits["maxY"] = y;
    } else if (x !== 0 && y !== 0) {
        newLimits["maxY"] = Math.max(newLimits["maxY"], y);
        newLimits["maxX"] = Math.max(newLimits["maxX"], x)
        newLimits["minY"] = Math.min(newLimits["minY"], y)
        newLimits["minX"] = Math.min(newLimits["minX"], x)
    }
    return newLimits
}

/**
 * Calculate actual wavlength based on filter and reddening parameters.
 * @param A_v The reddening value based on user input
 * @param filterlambda the wavelength of the filter in meter
 */
export function calculateLambda(A_v: Number, filterlambda = 10 ** -6) {
    let lambda = filterlambda;
    let R_v = 3.1;
    let x = (lambda / 1) ** -1;
    let y = x - 1.82;
    let a = 0;
    let b = 0;
    if (x > 0.3 && x < 1.1) {
        a = 0.574 * x ** 1.61;
    } else if (x > 1.1 && x < 3.3) {
        a =
            1 +
            0.17699 * y -
            0.50447 * y ** 2 -
            0.02427 * y ** 3 +
            0.72085 * y ** 4 +
            0.01979 * y ** 5 -
            0.7753 * y ** 6 +
            0.32999 * y ** 7;
    }

    if (x > 0.3 && x < 1.1) {
        b = -0.527 * x ** 1.61;
    } else if (x > 1.1 && x < 3.3) {
        b =
            1.41338 * y +
            2.28305 * y ** 2 +
            1.07233 * y ** 3 -
            5.38434 * y ** 4 -
            0.62251 * y ** 5 +
            5.3026 * y ** 6 -
            2.09002 * y ** 7;
    }

    return Number(A_v) * (a + b / R_v);
}

/**
 * create a color gradient for HR stars
 * @param chart the chart to be colored
 * @param red the red filter name
 * @param blue the blue filter name
 * @constructor
 */
export function HRrainbow(chart: Chart, red: string, blue: string): CanvasGradient | Color {
    let { ctx, chartArea } = chart;
    let rl = isNaN(filterWavelength[red]) ? Math.log10(0.442 * 1000) : Math.log10(filterWavelength[red] * 1000);//default to B-V for unknowns
    let bl = isNaN(filterWavelength[blue]) ? Math.log10(0.54 * 1000) : Math.log10(filterWavelength[blue] * 1000);

    let filters: string[] = [red, blue];
    let magIndex: number[] = [0, 0];
    // console.log(filters)
    for (let i = 0; i < filters.length; i++) {
        if ("UBVRI".includes(filters[i])) {
            magIndex[i] = Number(0);
        } else if ("u\'g\'r\'i\'z\'".includes(filters[i])) {
            magIndex[i] = Number(1);
        } else if ("JHKs".includes(filters[i])) {
            magIndex[i] = Number(2);
        }
    }

    let mags: { [key: string]: Function[] } = filterMags()


    let mColor = mags.red[magIndex[0]](bl) - mags.red[magIndex[0]](rl);
    let oColor = mags.blue[magIndex[1]](bl) - mags.blue[magIndex[1]](rl)

    let max = chart.options.scales["x"].max;
    let min = chart.options.scales["x"].min;

    //p(c)=(W/DC)*c-(W/DC)*min+left
    let pixelrat = chartArea.width / (max - min);
    let start = chartArea.left + (pixelrat * oColor) - (pixelrat * min);
    let stop = chartArea.left + (pixelrat * mColor) - (pixelrat * min);

    if (isNaN(start) || isNaN(stop)) {//stop div/0
        return "red"
    }
    else {

        let gradient = ctx.createLinearGradient(start, 0, stop, 0);

        gradient.addColorStop(1, "red");        //M
        gradient.addColorStop(0.929, "#ff6600"); //K
        gradient.addColorStop(0.526, "#ffdc60");//G
        gradient.addColorStop(0.441, "#fdffe0");//F
        gradient.addColorStop(0.357, "white");  //A
        //gradient.addColorStop(0.107,"#baf9ff");//B
        gradient.addColorStop(0, "#38eeff");    //O
        //From: https://asterism.org/wp-content/uploads/2019/03/tut39-HR-Diagram.pdf

        return gradient;
    }
}
