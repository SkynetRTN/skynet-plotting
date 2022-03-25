/**
 * This file contains functions that fetch/process/plot HR model for Cluster interfaces
 */


import { Chart, ScatterDataPoint } from "chart.js";
import Handsontable from "handsontable";
import {baseUrl, httpGetAsync, modelFormKey, modelFormKeys, pointMinMax } from "./chart-cluster-util";


/**
 *  This function takes a form to obtain the 5 parameters (age, metallicity, red, blue, and lum filter)
 *  request HR diagram model from server and plot on the graph.
 *  @param table:     A table used to determine the max and min value for the range
 *  @param form:      A form containing the 5 parameters (age, metallicity, red, blue, and lum filter)
 *  @param chart:     The Chartjs object to be updated.
 *  @param callback:  callback function asynchronously execute stuff after model is updated
 */
export function updateHRModel(modelForm: ModelForm, hot: Handsontable, charts: Chart[], callback: Function = () => { }, isChart: boolean = false) {
    function modelFilter(dataArray: number[][], iSkip: number): [ScatterDataPoint[], ScatterDataPoint[], { [key: string]: number }] {
        let form: ScatterDataPoint[] = [] //the array containing all model points
        let scaleLimits: { [key: string]: number } = {minX: NaN, minY: NaN, maxX: NaN, maxY: NaN,};
        for (let i = 0; i < dataArray.length; i++) {
            let x_i: number = dataArray[i][0];
            let y_i: number = dataArray[i][1];
            let row: ScatterDataPoint = {x: x_i, y: y_i};
            scaleLimits = pointMinMax(scaleLimits, dataArray[i][0], dataArray[i][1]);
            form.push(row);
        }
        iSkip = iSkip > 0? iSkip : 0;
        let age = parseFloat(modelForm['age'].value)
        let iEnd =  Math.round(((-25.84 * age + 451.77) + (-17.17*age**2+264.30*age-753.93))/2)
        return [form.slice(0, iSkip), form.slice(iSkip, iEnd), scaleLimits]
    }
    let reveal: string[] = [];
    for (let c = 0; c < charts.length; c++) {
        let chart = charts[c];
        reveal = reveal.concat(modelFormKeys(c, modelForm));
        httpGetAsync(generateURL(modelForm, c),
            (response: string) => {
                let json = JSON.parse(response);
                let dataTable: number[][] = json['data'];
                let filteredModel = modelFilter(dataTable, json['iSkip'])
                chart.data.datasets[0].data = filteredModel[0];
                chart.data.datasets[1].data = filteredModel[1];
                callback(c);
                if (!isChart)
                    chart.update("none");
            },
            () => {
                callback(c);
                if (!isChart)
                    chart.update("none");
            },
        );
    }
    //update table
    let columns: string[] = hot.getColHeader() as string[];
    let hidden: number[] = [];
    for (const col in columns) {
        if (columns[col].includes('Mag')){
            columns[col] = columns[col].substring(0, columns[col].length - 4); //cut off " Mag"
        }
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
     return baseUrl + "/isochrone?"
        + "age=" + HRModelRounding(form['age_num'].value)
        + "&metallicity=" + HRModelRounding(form['metal_num'].value)
        + "&filters=[%22" + form[blueKey].value.replace('\'', 'prime')
        + "%22,%22" + form[redKey].value.replace('\'', 'prime')
        + "%22,%22" + form[lumKey].value.replace('\'', 'prime') + "%22]"
}


/**
 * Round a float to closest .05
 * @param number number to be rounded
 * @constructor
 */
function HRModelRounding(number: number | string) {
    return (Math.round(Number(number) * 20) / 20).toFixed(2)
}

