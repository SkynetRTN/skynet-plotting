'use strict';

import { Chart, LinearScaleOptions, ScatterDataPoint } from "chart.js";
import Handsontable from "handsontable";
import { clamp, round } from "./my-math";

/**
 *  This function takes the data in a dictionary object and updates a Chart object with the data. The
 *  dataset number for the Chart object and the keys for the x and y values are given in order to
 *  correctly update when there are multiple datasets in the Chart object or in the dictionary.
 *  @param tableData:   The dictionary object that provides data
 *  @param myChart:     The Chart object
 *  @param dataSetIndex:The index of the dataset to be updated in the Chart object.
 *  @param xKey:        The key for x values in the dictionary.
 *  @param yKey:        The key for y values in the dictionary.
 */
export function updateLine(tableData: any[], myChart: Chart, dataSetIndex = 0, xKey = 'x', yKey = 'y') {
    let start = 0;
    let data = myChart.data.datasets[dataSetIndex].data;
    for (let i = 0; i < tableData.length; i++) {
        if (tableData[i][xKey] === '' || tableData[i][yKey] === '' ||
            tableData[i][xKey] === null || tableData[i][yKey] === null) {
            continue;
        }
        data[start++] = { x: tableData[i][xKey], y: tableData[i][yKey] };
    }
    while (data.length !== start) {
        data.pop();
    }
    myChart.update('none');
}

/**
 *  This function takes the labels from the chart and updates the the data property of the form with the labels.
 *  @param myChart:     The Chart object
 *  @param form:        The form to be updated.
 */
export function updateLabels(myChart: Chart, form: ChartInfoForm, immData = false, immTitle = false, immX = false, immY = false) {
    let labels = "";
    for (let i = 0; i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].hidden && !(myChart.data.datasets[i] as any).immutableLabel) {
            if (labels !== "") {
                labels += ", ";
            }
            labels += myChart.data.datasets[i].label;
        }
    }
    form.elements['data'].value = labels;

    if (myChart.options.plugins.title.text) {
        form.elements['title'].value = myChart.options.plugins.title.text as string;
    }
    if ((myChart.options.scales['x'] as LinearScaleOptions).title.text) {
        form.elements['xAxis'].value = (myChart.options.scales['x'] as LinearScaleOptions).title.text as string;
    }
    if ((myChart.options.scales['y'] as LinearScaleOptions).title.text) {
        form.elements['yAxis'].value = (myChart.options.scales['y'] as LinearScaleOptions).title.text as string;
    }

    form.elements['data'].disabled = immData;
    form.elements['title'].disabled = immTitle;
    form.elements['xAxis'].disabled = immX;
    form.elements['yAxis'].disabled = immY;
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
export function linkInputs(slider: HTMLInputElement, number: HTMLInputElement, min: number, max: number, step: number, value: number, 
    log = false, numOverride = false, numMin = 0, numMax = 0
) {
    if (!numOverride) {
        numMin = min;
        numMax = max;
    }
    number.min = numMin.toString();
    number.max = numMax.toString();
    number.step = step.toString();
    number.value = value.toString();
    if (!log) {
        slider.min = min.toString();
        slider.max = max.toString();
        slider.step = step.toString();
        slider.value = value.toString();

        slider.oninput = function () {
            number.value = slider.value;
        };
        number.oninput = function () {
            number.value = clamp(number.value, numMin, numMax);
            slider.value = clamp(number.value, min, max);
        };
    } else {
        slider.min = Math.log(min * 0.999).toString();
        slider.max = Math.log(max * 1.001).toString();
        slider.step = ((Math.log(max) - Math.log(min)) / ((max - min) / step)).toString();
        slider.value = Math.log(value).toString();
        slider.oninput = function () {
            /**  
             * Note that we exp() first then clamp(), in contrast to below log() first then clamp(). 
             * The reason is that the slider has min and max values defined for log. Also this is
             * clamped to min and max instead of numMin and numMax, because the slider logically
             * still correspond to min and max, even though the implementation changed to accomodate
             * the log behavior.
            */
            number.value = clamp(round(Math.exp(parseFloat(slider.value)), 2), min, max);
        };
        number.oninput = function () {
            number.value = clamp(number.value, numMin, numMax);
            // Note that we clamp() to min and max instead of numMin and numMax.
            slider.value = Math.log(parseFloat(clamp(number.value, min, max))).toString();
        }
    }
}

/**
 *  This function updates the height for the Handsontable object based on the number of rows it has.
 *  The min and max height is set to be 5 rows and the height of the right side of the page, respectively.
 *  @param table:   The Handsontable object whose height is to be updated.
 */
export function updateTableHeight(table: Handsontable) {
    const rowHeights = 23;
    const columnHeaderHeight = 26;

    const typeForm = document.getElementById('chart-type-form').clientHeight;
    const inputDiv = document.getElementById('input-div').clientHeight;
    const chartDiv = document.getElementById('chart-div').clientHeight;
    const infoForm = document.getElementById('chart-info-form').clientHeight;

    const minHeight = Math.min(5, table.countRows()) * rowHeights + columnHeaderHeight + 5;
    const maxHeight = Math.max(minHeight, chartDiv + infoForm - typeForm - inputDiv);
    
    let height = table.countRows() * rowHeights + columnHeaderHeight + 5;
    if (height > maxHeight) {
        height = maxHeight;
    }

    /**
     * Not ideal. But this seems benign and I REALLY CAN'T FIGURE OUT WHAT'S WRONG
     */
    try {
        table.updateSettings({ stretchH: 'none' });
        table.updateSettings({ height: height });
        table.updateSettings({ stretchH: 'all' });
    } catch (error) {
        // console.error(error);
    }
}

// Credits: https://stackoverflow.com/a/30407959/1154380
export function dataURLtoBlob(dataurl: string) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
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
export function sanitizeTableData(data: any[], cols: number[]) {
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
function dateAppendZero(num: number): string {
    return num < 10 ? '0' + num : '' + num;
}

/**
 * This function takes in two datasets and returns diff for the points from the two
 * datasets that have the same x-coordinates. Assumes both datasets are sorted.
 * @param data1 Array of points in dataset 1
 * @param data2 Array of points in dataset 2
 * @returns Diff between two datasets
 */
export function chartDataDiff(data1: ScatterDataPoint[], data2: ScatterDataPoint[]) {
    let p1 = 0;
    let p2 = 0;
    const result = [];
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
 * @param func                  The function to be throttled
 * @param wait                  Wait time in (ms).
 * @param extraTrailExecution   If set to true, the function will be executed one
 * extra time after the @param wait interval if an execution attemp was made during the 
 * blocking period. This will be useful if @param func is some sort of update function that
 *  will update a view based on the underlying model.
 * @returns Throttled version of @param func.
 */
export function throttle(func: Function, wait: number, extraTrailExecution: boolean = true) {
    /**
     *  This part of code (throttle) limits the maximum fps of the chart to change, so that it
     *  is possible to increase the sampling precision without hindering performance.
     */
    let changed = false;        // Indicates whether a change occurred while waiting for lock
    let lock = false;           // Lock for throttle

    const trailFunc = function (...args: any[]) {
        if (changed) {
            changed = false;
            
            // This is WRONGGG, becaues func() is NOT DEFINED IN the triggering event.
            //   We want to bind `this` only so that we have access to the values that
            //   came with the triggering event (usually a changed input field).
            // this.func(...args);
            func.apply(this, args);

            // BADDDDDDD! callback(...args) will run here and now ;_;
            // setTimeout(callback(...args), wait);
            setTimeout(() => { trailFunc.apply(this, args); }, wait);
        } else {
            lock = false;
        }
    }

    return function (...args: any[]) {
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
                setTimeout(() => { trailFunc.apply(this, args); }, wait);
            } else {
                setTimeout(() => { lock = false; }, wait);
            }
        } else {
            changed = true;
        }
    };
}

export function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function (...args: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => { func.apply(this, args); }, wait);
    }
}

/**
 * 
 * @param time A string in returned by getDateString()
 * @returns Formatted time string as Year-Month-DayTHourMinuteSecond
 */
export function formatTime(time: string) {
    const tarray = time.split(' ');
    tarray[0] = tarray[0].split(':').join('-');
    tarray[1] = tarray[1].split(':').join('');
    return tarray.join('T');
}

//takes an html drop down and a array of objects, replaces the drop downs existing options using
//objects of the form:
//{value: value, title: title, text: text}
export function changeOptions(element: HTMLInputElement, newOptions: { value: string, title: string, text: string }[]) {
    element.innerHTML='';//empty the drop down options
    let result = '';
    for (let i=0; i<newOptions.length; i++){
        result +='<option value="'+newOptions[i].value+'" title="'+newOptions[i].title+'">'+newOptions[i].text+'</option></div>\n';
    }
    element.innerHTML=result;
}