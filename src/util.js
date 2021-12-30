'use strict';

import Handsontable from "handsontable";
import { clamp, round } from "./my-math.js";

/**
 *  This function takes the data in a dictionary object and updates a Chartjs object with the data. The
 *  dataset number for the Chartjs object and the keys for the x and y values are given in order to
 *  correctly update when there are multiple datasets in the Chartjs object or in the dictionary.
 *  @param tableData:   The dictionary object that provides data
 *  @param myChart: The Chartjs object
 *  @param dataSet: The number of line to be updated in the Chartjs object.
 *  @param xKey:    The key for x values in the dictionary.
 *  @param yKey:    The key for y values in the dictionary.
 */
export function updateLine(tableData, myChart, dataSet = 0, xKey = 'x', yKey = 'y') {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < tableData.length; i++) {
        if (tableData[i][xKey] === '' || tableData[i][yKey] === '' ||
            tableData[i][xKey] === null || tableData[i][yKey] === null) {
            continue;
        }
        chart[start++] = { x: tableData[i][xKey], y: tableData[i][yKey] };
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

/**
 *  This function takes the labels from the chart and updates the the data property of the form with the labels.
 *  @param myChart: The Chartjs object
 *  @param form:    The form to be updated.
 */
export function updateLabels(myChart, form, immData = false, immTitle = false, immX = false, immY = false) {
    let labels = "";
    for (let i = 0; i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].hidden && !myChart.data.datasets[i].immutableLabel) {
            if (labels !== "") {
                labels += ", ";
            }
            labels += myChart.data.datasets[i].label;
        }
    }
    form.data.value = labels;

    if (myChart.options.plugins.title.text) {
        form.title.value = myChart.options.plugins.title.text;
    }
    if (myChart.options.scales['x'].title.text) {
        form.xAxis.value = myChart.options.scales['x'].title.text;
    }
    if (myChart.options.scales['y'].title.text) {
        form.yAxis.value = myChart.options.scales['y'].title.text;
    }

    form.data.disabled = immData;
    form.title.disabled = immTitle;
    form.xAxis.disabled = immX;
    form.yAxis.disabled = immY;
}

/**
*  This function links a <input type="range"> and a <input type="number"> together so changing the value
*  of one updates the other. This function also sets the min, max and step properties for both the inputs.
*  @param slider:       A <input type="range"> to be linked.
*  @param number:       A <input type"number"> to be linked.
*  @param min:          The min value for both inputs.
*  @param max:          The max value for both inputs.
*  @param step:         The step of changes for both inputs.
*  @param value:        The initial value of both inputs.
*  @param log:          A boolean that determines whether the slider uses logarithmic scale.
*  @param numOverride:  A boolean that, when true, allow the number field to exceed the range of the slider.
*  @param numMin:       Min value for number field when @param numOverride is true.
*  @param numMax:       Max value for number field when @param numOverride is true.
*/
export function linkInputs(slider, number, min, max, step, value, 
    log = false, numOverride = false, numMin = 0, numMax = 0
) {
    if (!numOverride) {
        numMin = min;
        numMax = max;
    }
    number.min = numMin;
    number.max = numMax;
    number.step = step;
    number.value = value;
    if (!log) {
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;

        slider.oninput = function () {
            number.value = slider.value;
        };
        number.oninput = function () {
            number.value = clamp(number.value, numMin, numMax);
            slider.value = clamp(number.value, min, max);
        };
    } else {
        slider.min = Math.log(min * 0.999);
        slider.max = Math.log(max * 1.001);
        slider.step = (Math.log(max) - Math.log(min)) / ((max - min) / step);
        slider.value = Math.log(value);
        slider.oninput = function () {
            /**  
             * Note that we exp() first then clamp(), in contrast to below log() first then clamp(). 
             * The reason is that the slider has min and max values defined for log. Also this is
             * clamped to min and max instead of numMin and numMax, because the slider logically
             * still correspond to min and max, even though the implementation changed to accomodate
             * the log behavior.
            */
            number.value = clamp(round(Math.exp(slider.value), 2), min, max);
        };
        number.oninput = function () {
            number.value = clamp(number.value, numMin, numMax);
            // Note that we clamp() to min and max instead of numMin and numMax.
            slider.value = Math.log(clamp(number.value, min, max));
        }
    }
}

/**
 *  This function updates the height for the Handsontable object based on the number of rows it has.
 *  The min and max height is set to be 5 rows and the height of the right side of the page, respectively.
 *  @param {Handsontable} table:   The Handsontable object whose height is to be updated.
 */
export function updateTableHeight(table) {
    const rowHeights = 23;
    const columnHeaderHeight = 26;

    let typeForm = document.getElementById('chart-type-form').clientHeight;
    let inputDiv = document.getElementById('input-div').clientHeight;
    let chartDiv = document.getElementById('chart-div').clientHeight;
    let infoForm = document.getElementById('chart-info-form').clientHeight;

    let minHeight = Math.min(5, table.countRows()) * rowHeights + columnHeaderHeight + 5;
    let maxHeight = Math.max(minHeight, chartDiv + infoForm - typeForm - inputDiv);
    let height = table.countRows() * rowHeights + columnHeaderHeight + 5;

    if (height > maxHeight) {
        height = maxHeight;
    }

    table.updateSettings({ stretchH: 'none' });
    table.updateSettings({ height: height });
    table.updateSettings({ stretchH: 'all' });
}

// Credits: https://stackoverflow.com/a/30407959/1154380
export function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Get the current date in the format of "YYYY:MM:DD HH:MM:SS"
 */
export function getDateString() {
    let date = new Date();
    let year = '' + date.getFullYear();
    let month = dateAppendZero(date.getMonth());
    let days = dateAppendZero(date.getDate());

    let hour = dateAppendZero(date.getHours());
    let minute = dateAppendZero(date.getMinutes());
    let second = dateAppendZero(date.getSeconds());

    return year + ':' + month + ':' + days + ' ' + hour + ':' + minute + ':' + second;
}

/**
 * This function takes in an array from Handsontable.getData() and returns a new array
 * with rows with not meeting requirement removed. A row meets the requirement if it has
 * valid number values in all columns specified by @param cols.
 * @param {Array} data An array representing the table data. Each element of the array
 * is also an array, which represents one row of the table data.
 * @param {Array} cols An array containing, in increasing order, the index of the columns
 * that needs to be filled in.
 * @returns Sanitized table data. 
 */
export function sanitizeTableData(data, cols) {
    return data.filter(row => cols.reduce(
        (pre, col) => pre && (!isNaN(parseFloat(row[col]))), true
    ));
    // return data.filter(row => {
    //     for (const col of cols)
    //         if (isNaN(parseFloat(row[col])))
    //             return false;
    //     return true;
    // });
}

/**
 * Pre-fix a number with '0' if it is less then 10. Otherwise just convert it to string.
 * @param num: A number between 1 and 99.
 * @returns two-character string containing the number and a leading 0 if necessary.
 */
function dateAppendZero(num) {
    return num < 10 ? '0' + num : '' + num;
}
export function sanitizeData(dataset) {
    //Function for cleaning blanks from coordinate arrays.
    var newdataset = dataset;
    for (let i = 0; i < dataset.length; i++) {
        try {
            newdataset[i].x = ((dataset[i].x === '') ? undefined : dataset[i].x);
        }
        catch { }
        try {
            newdataset[i].y = ((dataset[i].y === '') ? undefined : dataset[i].y);
        }
        catch { }
        try {
            newdataset[i].wl = ((dataset[i].wl === '') ? undefined : dataset[i].wl);
        }
        catch { }
    };
    return newdataset;
}

/**
 * This function takes in two datasets and returns diff for the points from the two
 * datasets that have the same x-coordinates. Assumes both datasets are sorted.
 * @param {Array} data1 Array of points in dataset 1
 * @param {Array} data2 Array of points in dataset 2
 * @returns Diff between two datasets
 */
export function chartDataDiff(data1, data2) {
    let p1 = 0;
    let p2 = 0;
    let result = [];
    while (p1 < data1.length && p2 < data2.length) {
        if (data1[p1].x == data2[p2].x) {
            result.push({ x: data1[p1].x, y: data1[p1].y - data2[p2].y });
            p1++;
            p2++;
        } else if (data1[p1].x < data2[p2].x) {
            p1++;
        } else {
            p2++;
        }
    }
    return result;
}

/**
 * This function takes a function @param func and a wait time @param wait, and returns a 
 * version of the function that will execute at max once per @param wait interval.
 * 
 * @param {function} func               The function to be throttled
 * @param {number} wait                 Wait time in (ms).
 * @param {boolean} extraTrailExecution If set to true, the function will be executed one
 * extra time after the @param wait interval if an execution attemp was made during the 
 * blocking period. This will be useful if @param func is some sort of update function that
 *  will update a view based on the underlying model.
 * @returns Throttled version of @param func.
 */
export function throttle(func, wait, extraTrailExecution = true) {
    /**
     *  This part of code (throttle) limits the maximum fps of the chart to change, so that it
     *  is possible to increase the sampling precision without hindering performance.
     */
    let changed = false;        // Indicates whether a change occurred while waiting for lock
    let lock = false;           // Lock for throttle

    let callback = function (...args) {
        if (changed) {
            changed = false;
            
            // This is WRONGGG, becaues func() is NOT DEFINED IN the triggering event.
            //   We want to bind `this` only so that we have access to the values that
            //   came with the triggering event (usually a changed input field).
            // this.func(...args);
            func.apply(this, args);

            // BADDDDDDD! callback(...args) will run here and now ;_;
            // setTimeout(callback(...args), wait);
            setTimeout(() => { callback.apply(this, args); }, wait);
        } else {
            lock = false;
        }
    }

    // link chart to input form (slider + text)
    return function (...args) {
        if (!lock) {
            lock = true;

            // This is WRONGGG, becaues func() is NOT DEFINED IN the triggering event.
            //   We want to bind `this` only so that we have access to the values that
            //   came with the triggering event (usually a changed input field).
            // this.func(...args);
            func.apply(this, args);

            // BADDDDDDD! callback(...args) will run here and now ;_;
            // setTimeout(callback(...args), wait);
            if (extraTrailExecution) {
                setTimeout(() => { callback.apply(this, args); }, wait);
            } else {
                setTimeout(() => { lock = false; }, wait);
            }
        } else {
            changed = true;
        }
    };
}

export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => { func.apply(this, args); }, wait);
    }
}

export function formatTime(time) {
    //takes in date/times asreturned by getDateString() and formats them as Year-Month-DayTHourMinuteSecond
    let tarray = ['','']
    tarray = time.split(' ');
    tarray[0] = tarray[0].split(':').join('-');
    tarray[1] = tarray[1].split(':').join('');
    return tarray.join('T');
}