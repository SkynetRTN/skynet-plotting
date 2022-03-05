/**
 * This file contains functions that fetch/process/plot HR model for Cluster interfaces
 */


import { Chart, ScatterDataPoint } from "chart.js";
import Handsontable from "handsontable";
import {httpGetAsync, modelFormKey, modelFormKeys, pointMinMax } from "./chart-cluster-util";
import { median } from "../my-math";


/**
 *  This function takes a form to obtain the 5 parameters (age, metallicity, red, blue, and lum filter)
 *  request HR diagram model from server and plot on the graph.
 *  @param table:     A table used to determine the max and min value for the range
 *  @param form:      A form containing the 5 parameters (age, metallicity, red, blue, and lum filter)
 *  @param chart:     The Chartjs object to be updated.
 *  @param callback:  callback function asynchronously execute stuff after model is updated
 */
export function updateHRModel(modelForm: ModelForm, hot: Handsontable, charts: Chart[], callback: Function = () => { }) {
    function modelFilter(dataArray: number[][]): [ScatterDataPoint[], ScatterDataPoint[], { [key: string]: number }] {
        let form: ScatterDataPoint[] = [] //the array containing all model points
        let scaleLimits: { [key: string]: number } = {minX: NaN, minY: NaN, maxX: NaN, maxY: NaN,};
        let deltas: number[] = [NaN];
        let deltaXs: number [] = [NaN];
        let deltaYs: number [] = [NaN];
        let maxDeltaIndex: number = 0;
        let count: number[] = [0];
        for (let i = 0; i < dataArray.length; i++) {
            let x_i: number = dataArray[i][0];
            let y_i: number = dataArray[i][1];
            let row: ScatterDataPoint = {x: x_i, y: y_i};
            scaleLimits = pointMinMax(scaleLimits, dataArray[i][0], dataArray[i][1]);
            form.push(row);
            if (i > 0) {
                let deltaX: number = Math.abs(x_i - dataArray[i - 1][0]);
                let deltaY: number = Math.abs(y_i - dataArray[i - 1][1]);
                deltaXs.push(deltaX);
                deltaYs.push(deltaY);
            }
        }
        let xMedianValue: number = median(deltaXs);
        let yMedianValue: number = median(deltaYs);
        //From the beginning of delta_i, find the nth = 1st i such that delta_i < sqrt(2).
        // Call it iBeg. KEEP all points before iBeg.
        let N = deltaXs.length
        let c1: number = 0;
        let c2: number = 0;
        let c3: number = 0;
        for (let i = 0; i < N; i++) {
            let delta = 0
            if (i > 0) {
                delta = ((deltaXs[i] / xMedianValue) ** 2 + (deltaYs[i] / yMedianValue) ** 2) ** 0.5
                if (delta < (2 ** 0.5)) {
                    count.push(count[i-1] - 1)
                } else {
                    count.push(count[i-1] + 1)
                }
            }
            let sqaure: number = (i ** 2) - N*i
            c1 += count[i] * sqaure;
            c2 += i * sqaure;
            c3 += sqaure ** 2;
            deltas.push(delta);
        }
        let countN = count[N-1]
        c2 *= countN/N;
        let c = (c1 - c2) / c3
        let b = countN/N - c*N

        // let a: number = 0;
        // let y: number[] = [0];
        // for (let i = 1; i <= N; i++) {
        //   y.push((a + b * i + c * i ** 2))
        // }
        // console.log(y)

        //From the end of delta_i, find the nth = 1st i such that delta_i < sqrt(2).
        // Call it iEnd. REMOVE all points after iEnd.
        let iBeg: number = 0; //init iBeg to be 0
        let iEnd: number = N; //init iEnd as the last the last count
        let min = 0;
        let max = 0;
        deltas.shift();
        for (let i = 1; i <= N; i++) {
            // let temp = count[i] - i/N*count[N+1]
            let temp = count[i] - (b * i + c * (i ** 2));
            if (temp < min) {
                min = temp;
                iEnd = i;
            } else if (temp >= max) {
                max = temp;
                iBeg = i;
            }
        }
        if (iBeg > iEnd) {
            iBeg = 0;
            max = 0;
            for (let i = 1; i < iEnd; i++) {
                let temp = count[i] - i/(N)*count[N-1]
                if (temp >= max) {
                    max = temp;
                    iBeg = i;
                }
            }
        }
        maxDeltaIndex = deltas.indexOf(Math.max.apply(null, deltas.slice(iBeg-1, iEnd+1)));
        return [form.slice(0, maxDeltaIndex), form.slice(maxDeltaIndex, iEnd), scaleLimits]
    }
    let reveal: string[] = [];
    for (let c = 0; c < charts.length; c++) {
        let chart = charts[c];
        reveal = reveal.concat(modelFormKeys(c, modelForm));
        httpGetAsync(generateURL(modelForm, c),
            (response: string) => {
                let dataTable: number[][] = JSON.parse(response);
                let filteredModel = modelFilter(dataTable);
                chart.data.datasets[0].data = filteredModel[0];
                chart.data.datasets[1].data = filteredModel[1];
                chart.update("none");
                callback(c);
            },
            () => {
                callback(c);
            },
        );
    }
    //update table
    let columns: string[] = hot.getColHeader() as string[];
    let hidden: number[] = [];
    for (const col in columns) {
        columns[col] = columns[col].substring(0, columns[col].length - 4); //cut off " Mag"
        if (!reveal.includes(columns[col])) {
            //if the column isn't selected in the drop down, hide it
            hidden.push(parseFloat(col));
        }
    }
    hot.updateSettings({hiddenColumns: {columns: hidden, indicators: false,}});
}

/**
 * generate url for HRModel data fetching
 * @param form
 * @param chartNum
 */
function generateURL(form: ModelForm, chartNum: number) {
    let blueKey = modelFormKey(chartNum, 'blue')
    let redKey = modelFormKey(chartNum, 'red')
    let lumKey = modelFormKey(chartNum, 'lum')
    return "http://localhost:5000/isochrone?" //local testing url
        //return "http://152.2.18.8:8080/isochrone?" //testing server url
        // return "https://skynet.unc.edu/graph-api/isochrone?" //production url
        + "age=" + HRModelRounding(form['age_num'].value)
        + "&metallicity=" + HRModelRounding(form['metal_num'].value)
        + "&filters=[%22" + form[blueKey].value
        + "%22,%22" + form[redKey].value
        + "%22,%22" + form[lumKey].value + "%22]"
}


/**
 * Round a float to closest .05
 * @param number number to be rounded
 * @constructor
 */
export function HRModelRounding(number: number | string) {
    return (Math.round(Number(number) * 20) / 20).toFixed(2)
}

