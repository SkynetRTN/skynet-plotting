import Handsontable from "handsontable";
import Chart from "chart.js/auto";
import {modelFormKey} from "./chart-cluster-util";
import {linkInputs} from "../util";

export function updateClusterProScatter(
    table: Handsontable,
    proChart: Chart,
    clusterForm: ClusterForm
) {
    let chart = proChart.data.datasets[2].data;
    let tableData = table.getData();
    let columns = table.getColHeader();

    let blueKey = modelFormKey(0, 'blue')
    let redKey = modelFormKey(0, 'red')
    let lumKey = modelFormKey(0, 'lum')

    //Identify the column the selected filter refers to
    let bluera = columns.indexOf(clusterForm[blueKey].value + " pmra");
    let bluedec = columns.indexOf(clusterForm[blueKey].value + " pmdec");
    let blueDist = columns.indexOf(clusterForm[blueKey].value + " dist");

    let blueErr =
        columns.indexOf(clusterForm[blueKey].value + " err") < 0
            ? null
            : columns.indexOf(clusterForm[blueKey].value + " err"); //checks for supplied err data
    let redErr =
        columns.indexOf(clusterForm[redKey].value + " err") < 0
            ? null
            : columns.indexOf(clusterForm[redKey].value + " err");
    let lumErr =
        columns.indexOf(clusterForm[lumKey].value + " err") < 0
            ? null
            : columns.indexOf(clusterForm[lumKey].value + " err");

    let err = parseFloat(clusterForm['err_num'].value); // 3 sigma value = 0.312347, now using user inputs
    let isRange = (document.getElementById("distrangeCheck") as HTMLInputElement).checked
    let dist = parseFloat(clusterForm["d_num"].value);
    let range = parseFloat(clusterForm["distrange_num"].value);
    let distHighLim = (dist + (dist * (range / 100))) * 1000;
    let distLowLim = (dist - (dist * (range / 100))) * 1000;
    let proMinMax: { [key: string]: number } = {minX: 0, maxX: 0, minY: 0, maxY: 0,};
    let start = 0;
    for (let i = 0; i < tableData.length; i++) {
        let x = tableData[i][bluera];
        let y = tableData[i][bluedec];
        let distance: number = tableData[i][blueDist];
        let isDistNotValid = isNaN(distance) || distance === null
        if (!(
            typeof (x) != 'number' || typeof (y) != 'number'
            ||
            ((blueErr != null && tableData[i][blueErr] > err || tableData[i][blueErr] == "") ||
                (redErr != null && tableData[i][redErr] > err || tableData[i][redErr] == "") ||
                (lumErr != null && tableData[i][lumErr] > err || tableData[i][lumErr] == ""))
            ||
            (isRange && (isDistNotValid || (distance > distHighLim) || distance < distLowLim))
        )) {
            chart[start++] = {
                x: x,
                y: y
            };
            if (x > proMinMax['maxX'])
                proMinMax['maxX'] = x;
            else if (x < proMinMax['minX'])
                proMinMax['minX'] = x;
            if (y > proMinMax['maxY'])
                proMinMax['maxY'] = y;
            else if (y < proMinMax['minY'])
                proMinMax['minY'] = y;
        }
    }
    // updateProChartScale(proChart, proMinMax)
    chart = chart.slice(0, start++);
    proChart.data.datasets[2].data = chart;
    proChart.update()
} //create a function that defines constant x and y scale values for the chart
export function updateProForm(minmax: number[], clusterProForm: ClusterProForm) {
    let maxRa = floatTo1(minmax[0]);
    let minRa = floatTo1(minmax[1]);
    let maxDec = floatTo1(minmax[2]);
    let minDec = floatTo1(minmax[3]);
    let medRa = floatTo1(minmax[4]);
    let medDec = floatTo1(minmax[5]);
    let stdRa = floatTo1(minmax[6]);
    let stdDec = floatTo1(minmax[7]);
    linkInputs(clusterProForm["ramotion"], clusterProForm["ramotion_num"], minRa, maxRa, 0.1, medRa, false, true, -999, 999);
    linkInputs(clusterProForm["rarange"], clusterProForm["rarange_num"], 0, (2 * stdRa), 0.1, (2 * stdRa), false, true, 0, 999);
    linkInputs(clusterProForm["decmotion"], clusterProForm["decmotion_num"], minDec, maxDec, 0.1, medDec, false, true, -99, 999);
    linkInputs(clusterProForm["decrange"], clusterProForm["decrange_num"], 0, (2 * stdDec), 0.1, (2 * stdDec), false, true, 0, 999);
    //make sliders precise to the nearest thousandth
    clusterProForm["ramotion"].step = "0.001";
    clusterProForm["decmotion"].step = "0.001";
    clusterProForm["rarange"].step = "0.001";
    clusterProForm["decrange"].step = "0.001";

}

export function proFormMinmax(hot: Handsontable, clusterForm: ClusterForm) {
    let tableData2 = hot.getData();
    let columns = hot.getColHeader();
    let blueKey = modelFormKey(1, 'blue');
    //let minRa = Math.min(...tableData2.map(row=> row[columns.indexOf(clusterForm[blueKey].value + " pmra")]));
    //let minDec = Math.min(...tableData2.map(row => row[columns.indexOf(clusterForm[blueKey].value + " pmdec")]));
    //make an array of all the ra values in numerical order from smallest to largest
    let raArray = tableData2.filter((numList) => numList[0] !== null).map(row => row[columns.indexOf(clusterForm[blueKey].value + " pmra")]).sort((a, b) => a - b);
    //find the number in the array that is in the middle, if there are an even number of values, take the average of the two middle values
    let raArrayLength = raArray.length;
    let raArrayHalfLength = Math.floor(raArrayLength / 2);
    let medRa = 0;
    if (raArrayLength % 2 === 0) {
        medRa = (raArray[raArrayHalfLength] + raArray[raArrayHalfLength - 1]) / 2;
    } else {
        medRa = raArray[raArrayHalfLength];
    }
    let raArrayAbs = raArray.map(row => Math.abs(row - medRa)).sort((a, b) => a - b);
    //find the middle 68.3% of values in the ra array
    let raArray68 = raArrayAbs.slice(Math.floor(raArrayLength * 0), Math.ceil(raArrayLength * 0.683));
    //let raArray68Mean = raArray68.reduce((a, b) => a + b, 0) / raArray68.length;
    //find the standard deviation of the dec out of all stars
    let stdRa = 0;
    for (let i = 0; i < raArray68.length; i++) {
        stdRa += Math.pow(raArray68[i], 2);
    }
    stdRa = Math.sqrt(stdRa / raArray68.length);


    //make an array of all the dec values
    let decArray = tableData2.filter((numList) => numList[1] !== null).map(row => row[columns.indexOf(clusterForm[blueKey].value + " pmdec")]).sort((a, b) => a - b);
    //find the number in the array that is in the middle, if there are an even number of values, take the average of the two middle values
    let decArrayLength = decArray.length;
    let decArrayHalfLength = Math.floor(decArrayLength / 2);
    let medDec = 0;
    if (decArrayLength % 2 === 0) {
        medDec = (decArray[decArrayHalfLength] + decArray[decArrayHalfLength - 1]) / 2;
    } else {
        // medDec = decArray[raArrayHalfLength];
        medDec = decArray[decArrayHalfLength];
    }
    //make an array of the absolute value of the dec values minus the median
    let decArrayAbs = decArray.map(row => Math.abs(row - medDec)).sort((a, b) => a - b);
    //find the 68.3% of values in the dec array
    let decArray68 = decArrayAbs.slice(Math.floor(decArrayLength * 0), Math.ceil(decArrayLength * 0.683));
    //find the mean of this array
    //let decArray68Mean = decArray68.reduce((a, b) => a + b, 0) / decArray68.length;
    //find the standard deviation of the dec out of all stars
    let stdDec = 0;
    for (let i = 0; i < decArray68.length; i++) {
        stdDec += Math.pow(decArray68[i], 2);
    }
    stdDec = Math.sqrt(stdDec / decArray68.length);


    let maxRa = medRa + (2 * stdRa);
    let maxDec = medDec + (2 * stdDec);
    let minRa = medRa - (2 * stdRa);
    let minDec = medDec - (2 * stdDec);
    //report all values to the nearest thousandth
    maxRa = floatTo1(maxRa);
    minRa = floatTo1(minRa);
    maxDec = floatTo1(maxDec);
    minDec = floatTo1(minDec);
    medRa = floatTo1(medRa);
    medDec = floatTo1(medDec);
    stdRa = floatTo1(stdRa);
    stdDec = floatTo1(stdDec);
    return [maxRa, minRa, maxDec, minDec, medRa, medDec, stdRa, stdDec, raArray68.length];
}

export function updateChart2(myChart2: Chart, clusterProForm: ClusterProForm, minmax: number[]) {
    let ramotion_num = parseFloat(clusterProForm["ramotion_num"].value);
    let decmotion_num = parseFloat(clusterProForm["decmotion_num"].value);
    let rarange_num = parseFloat(clusterProForm["rarange_num"].value);
    let decrange_num = parseFloat(clusterProForm["decrange_num"].value);
    let maxRa = minmax[0]
    let minRa = minmax[1]
    let maxDec = minmax[2]
    let minDec = minmax[3]
    myChart2.data.datasets[0].data = [{x: maxRa + 10000, y: decmotion_num}, {x: minRa - 10000, y: decmotion_num}];
    myChart2.data.datasets[1].data = [{x: ramotion_num, y: maxDec + 10000}, {x: ramotion_num, y: minDec - 10000}];
    myChart2.data.datasets[3].data = [{
        x: ramotion_num - rarange_num,
        y: maxDec + 10000
    }, {x: ramotion_num - rarange_num, y: minDec - 10000}];
    myChart2.data.datasets[4].data = [{
        x: ramotion_num + rarange_num,
        y: maxDec + 10000
    }, {x: ramotion_num + rarange_num, y: minDec - 10000}];
    myChart2.data.datasets[5].data = [{x: maxRa + 10000, y: decmotion_num - decrange_num}, {
        x: minRa - 10000,
        y: decmotion_num - decrange_num
    }];
    myChart2.data.datasets[6].data = [{x: maxRa + 10000, y: decmotion_num + decrange_num}, {
        x: minRa - 10000,
        y: decmotion_num + decrange_num
    }];
    // chart2Scale(myChart2, minmax);
    myChart2.update();
}

export function chart2Scale(myChart2: Chart, minmax: number[]) {
    let medRa = minmax[4]
    let medDec = minmax[5]
    let stdRa = minmax[6]
    let stdDec = minmax[7]
    //make these values precise to the nearest thousandth
    //set the scales of the chart to match the new sensitivity fix
    //change xmax
    myChart2.options.scales["x"].max = medRa + (2 * stdRa);
    //change ymax
    myChart2.options.scales["y"].max = medDec + (2 * stdDec);
    //right now test with minimum values
    myChart2.options.scales['x'].min = medRa - (2 * stdRa);
    myChart2.options.scales['y'].min = medDec - (2 * stdDec);
}

function floatTo1(num: number) {
    return parseFloat(num.toFixed(1))
}
