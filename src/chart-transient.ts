'use strict';

//import Chart from "chart.js/auto";
import "chartjs-chart-error-bars";
import Handsontable from "handsontable";

import { initializeHTMLElements, disableDropdown } from "./chart-transient-utils/chart-transient-html";
import { TransientChart } from "./chart-transient-utils/chart-transient-chart";
import { readCSVData, verifyCSV } from "./chart-transient-utils/chart-transient-file"; 
import { tableCommonOptions } from "./config"
import { linkInputs, updateTableHeight, sanitizeTableData } from "./util"


const generateRandomData = (numOfPoints: number) => {
    // filters array is arbitrary
    const filters = ['B', 'V', 'R', 'I'];
    let data = [];

    for (let i=0; i < numOfPoints; i++)  {
        let idx = Math.floor(Math.random() * filters.length);

        data.push({
            'jd': i * 10 + Math.random() * 10,
            'magnitude': Math.random() * 20,
            'filter': filters[idx],
        });
        
    }
    //data.forEach(d => console.log(d));
    return data;
};


const sortDataByFilter = (usData: {jd: number, magnitude: number, filter: string}[]) => {
    // grab filter names 
    let filters = [] as string[];
    for (let i = 0; i < usData.length; i++) {
        if (!filters.some(f => f === usData[i].filter)) {
            filters.push(usData[i].filter);  
        }
    }

    let sData = new Map();

    filters.forEach(f => {
        if (!sData.has(f)) {
            sData.set(f, []);
        }
        for (let i = 0; i < usData.length; i++) {
            if (f === usData[i].filter) {
                sData.get(f).push([
                    usData[i].jd, usData[i].magnitude
                ]);
            }
        }
    });
    //sData.forEach(d => console.log(d));
    return sData;
}


const initializeTable = (data: {jd: number, magnitude: number, filter: string}[]) => {
    const container = document.getElementById('table-div');

    return new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: data,
        colHeaders: ['Julian Date', 'Magnitude', 'Filter'],
        maxCols: 3,
        columns: [
            { data: 'jd', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'magnitude', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'filter', type: 'text' },
        ],
    }));
}


const shiftMagnitudes = (hot: Handsontable, myChart: TransientChart, form: ChartInfoForm) => {
    let shiftedData = [];
    let delim = '';
    let sign = 1;
    let numOfRows = hot.getDataAtCol(0).length;
    const elementStringArray = form.elements['data'].value.split(',');

    // prevent large inputs
    if (elementStringArray.length > 500) {
        return;
    }

    const hasPlusSign = (str: string) => {
        return /[+]/g.test(str);
    }

    const hasMinusSign = (str: string) => {
        return /[-]/g.test(str);
    }

    /* Determine the shift in mag the user wants and apply it */
    /* mjdIdx = 0 , magIdx = 1 , flterIdx = 2 */

    for (let str of elementStringArray) {
        str = str.trim(); // remove leading/trailing whitespaces

        // get sign of shift
        if (hasPlusSign(str) && !hasMinusSign(str)) {
            delim = '+';
            sign = 1;
        } else if (hasMinusSign(str) && !hasPlusSign(str)) {
            delim = '-';
            sign = -1;
        } else {
            return; // do nothing
        }

        let updatedFilter = str.split(delim)[0];
        let shiftVal = parseFloat(str.split(delim)[1]);

        if (isNaN(shiftVal)) {
            continue;
        }
        if (shiftVal > 100 || shiftVal < -100) {
            alert('Magnitudes can only be shifted +/- 100');
            continue;
        }

        // search chart data
        for (let i = 0; i < myChart.getDatasets().length; i++) {
            if (myChart.getDataset(i).label.search(updatedFilter) !== -1) {

                shiftedData = [];
                // search table data
                for (let j = 0; j < numOfRows; j++) {
                    let tableFilter = hot.getDataAtCol(2)[j];

                    if (tableFilter === updatedFilter) {

                        let mjd = hot.getDataAtCol(0)[j];
                        let mag = hot.getDataAtCol(1)[j];
                        shiftedData.push({
                            'x': mjd - (myChart.eventShift),//(myChart.timeShift),// - (myChart.eventShift),
                            'y': mag + (sign * shiftVal),
                        })
                    }
                }
                // update chart
                myChart.clearDataFromDataset(i);
                myChart.updateDataFromDataset(shiftedData, i);
                myChart.update();
            }
        }
    }
};


const handleDropdownInput = (chart: TransientChart) => {
    const dropdown = document.getElementById('temporal') as HTMLSelectElement;
    dropdown.onchange = () => {
        const sel = dropdown.selectedIndex;
        const opt = dropdown.options[sel];
        const temporalModel = (<HTMLOptionElement>opt).value

        chart.setScaleType(temporalModel);
    }

    const spectralDD = document.getElementById('spectral') as HTMLSelectElement;
    spectralDD.onchange = () => {
        const sel = spectralDD.selectedIndex;
        const opt = spectralDD.options[sel];
        const spectralModel = (<HTMLOptionElement>opt).value

        if (spectralModel === 'Power Law') {
            disableDropdown('ebv', true);
        } else {
            disableDropdown('ebv', false);
        }
    }
};


const handleEventTimeInput = (chart: TransientChart) => {
    const eventTimeInput = document.getElementById('time') as HTMLInputElement;

    eventTimeInput.oninput = () => {
        if (eventTimeInput.value === '') {
            return;
        } 
        const eventTime = parseFloat(eventTimeInput.value);
        if (eventTime < 0 || isNaN(eventTime)) {
            return;
        }
        chart.shiftData(eventTime);
        chart.update();
    }
}


const handleChartZoomOptions = (chart: TransientChart) => {
    let Reset = document.getElementById("Reset") as HTMLInputElement;
    let panLeft = document.getElementById("panLeft") as HTMLInputElement;
    let panRight = document.getElementById("panRight") as HTMLInputElement;
    let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
    let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;

    const myChart = chart.chart;
    let pan: number;

    panLeft.onmousedown = function() {
        pan = setInterval( () => {chart.chart.pan(5)}, 20 )
    }
    panLeft.onmouseup = panLeft.onmouseleave = function() {
        clearInterval(pan);
    }
    panRight.onmousedown = function() {
        pan = setInterval( () => {chart.chart.pan(-5)}, 20 )
      }
    panRight.onmouseup = panRight.onmouseleave = function() {
        clearInterval(pan);
    }

    Reset.onclick = function(){
        chart.resetView();
        chart.update();
    }

    let zoom: number;
    zoomIn.onmousedown = function () {
    zoom = setInterval(() => { myChart.zoom(1.03) }, 20);;
    }
    zoomIn.onmouseup = zoomIn.onmouseleave = function () {
    clearInterval(zoom);
    }
    zoomOut.onmousedown = function () {
    zoom = setInterval(() => { myChart.zoom(0.97); }, 20);;
    }
    zoomOut.onmouseup = zoomOut.onmouseleave = function () {
    clearInterval(zoom);
    }
}


/*
    DRIVER 
*/
export function transient(): [Handsontable, TransientChart] {
    /* INITIALIZE PAGE ELEMENTS */
    initializeHTMLElements();

    const tableData = generateRandomData(14);
    let randomData = sortDataByFilter(tableData);

    // create data table 
    const hot = initializeTable(tableData);

    // 'Data' element receives input from user (unfortunately)
    const chartInfoForm = document
        .getElementById('chart-info-form') as ChartInfoForm;

    populateDataElement(randomData, chartInfoForm);

    // create chart using ChartJS
    const myChart = new TransientChart();
    myChart.initialize();

    // populate chart with random data
    addDataSetsToChart(myChart, randomData, 0);

    /* Handle updates to forms */

    const update = function () {
        updateVariable(hot, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    // handle user shifting mags
    chartInfoForm.elements['data'].oninput = () => {
        shiftMagnitudes(hot, myChart, chartInfoForm);
    }

    const parameterForm = document
        .getElementById('transient-form') as VariableLightCurveForm;

    // handle user changing dropdown
    parameterForm.oninput = () => {
        handleDropdownInput(myChart);
        handleEventTimeInput(myChart);
        myChart.update();
    }
    handleChartZoomOptions(myChart);
    updateVariable(hot, myChart);
    updateTableHeight(hot);
    myChart.update();

    /* sliders */
    const tAvg = (myChart.getMinMJD() + myChart.getMaxMJD()) / 2.
    const mAvg = (myChart.getMinMag() + myChart.getMaxMag()) / 2.

    linkInputs(parameterForm["b"], parameterForm["b_num"], -2, 1, 0.01, -0.5, false);
    linkInputs(parameterForm["ebv"], parameterForm["ebv_num"], 0, 1, 0.01, 0, false);
    linkInputs(parameterForm["t"], parameterForm["t_num"], myChart.getMinMJD(), 
        myChart.getMaxMJD(), 0.01, tAvg, false);
    linkInputs(parameterForm["mag"], parameterForm["mag_num"], myChart.getMinMag(),
        myChart.getMaxMag(), 0.01, mAvg, false);
    linkInputs(parameterForm["a"], parameterForm["a_num"], -3, 1, 0.01, -1, false);

    return [hot, myChart];
}


export function transientFileUpload(evt: Event, table: Handsontable, myChart: TransientChart) {

    let file = (evt.target as HTMLInputElement).files[0];

    if (!verifyCSV(file)) { return; }

    let reader = new FileReader();
    reader.onload = () => {
        const fileData = readCSVData(reader);
        if (!fileData.valid) { return; }

        const source = fileData.source;
        const filterSortedValues = fileData.filter;

        const itr = source.keys();
        let sourceData = itr.next().value;

        if (!sourceData) {
            alert('No source detected in file!');
            return;
        }
        
        myChart.setMinMJD(Number.POSITIVE_INFINITY);
        myChart.setMaxMJD(0);

        // remove bad data and sort my date
        let data = source.get(sourceData)
            .filter((val: number[]) => !isNaN(val[0]))
            .sort((a: number[], b: number[]) => a[0] - b[0]);

        let min = myChart.getMinMJD();
        let max = myChart.getMaxMJD();

        const tableData: any[] = [];
        for (let i = 0; i < data.length; i++) {
            min = Math.min(min, data[i][0]);
            max = Math.max(max, data[i][0]);
            pushTableData(tableData, data[i][0], data[i][1], data[i][2]);
        }
        myChart.setMinMJD(min);
        myChart.setMaxMJD(max);

        // shift x axis for event time
        const time = myChart.getMinMJD() - (myChart.getMaxMJD() - myChart.getMinMJD())*0.1;
        const shift = time;
        myChart.setEventShift(time);
        const eventTime = document.getElementById('time') as HTMLInputElement;
        eventTime.value = String(time);

        myChart.clearDatasets();
        const chartForm = document
            .getElementById('chart-info-form') as ChartInfoForm;

        // update chart data
        addDataSetsToChart(myChart, filterSortedValues, shift);
        populateDataElement(filterSortedValues, chartForm);

        myChart.setScaleType('logarithmic');

        // reset dropdown
        const dropdown = document.getElementById('temporal') as HTMLSelectElement;
        dropdown.selectedIndex = 0;

        myChart.update();
        table.updateSettings({ data: tableData });
    }
    reader.readAsText(file);
}


function pushTableData(tableData: any[], jd: number, mag: number, filter: string) {
    if (isNaN(jd)) {
        // Ignore entries with invalid timestamp.
        return;
    }
    tableData.push({
        'jd': jd,
        'magnitude': isNaN(mag) ? null : mag,
        'filter': filter
    });
}


function updateVariable(table: Handsontable, myChart: TransientChart) {
    console.log('update Variable called');

    // can't pass filter col ([2]) to sanitize since is string
    const tableData = sanitizeTableData(table.getData(), [0, 1]);
    const map = new Map();

    const form = document
        .getElementById('chart-info-form') as ChartInfoForm;

    myChart.setMinMJD(Number.POSITIVE_INFINITY);
    myChart.setMaxMJD(0);

    let minMJD = myChart.getMinMJD();
    let maxMJD = myChart.getMaxMJD();
    let minMag = myChart.getMinMag();
    let maxMag = myChart.getMaxMag();

    for (let i = 0; i < tableData.length; i++) {
        minMJD = Math.min(minMJD, tableData[i][0]);
        maxMJD = Math.max(maxMJD, tableData[i][0]);
        minMag = Math.min(minMag, tableData[i][1]);
        maxMag = Math.max(maxMag, tableData[i][1]);
    }
    myChart.setMinMJD(minMJD);
    myChart.setMaxMJD(maxMJD);
    myChart.setMinMag(minMag);
    myChart.setMaxMag(maxMag);

    let time = myChart.getMinMJD() - ((myChart.getMaxMJD() - myChart.getMinMJD())*0.1);

    if (time < 0) {
        time = 0;
    }
    myChart.setTimeShift(time);

    if (isNaN(myChart.eventShift)) {
        myChart.eventShift = 0;
    }

    // get data from table
    for (let i = 0; i < tableData.length; i++) {
        let julianDate = tableData[i][0] - time;
        let magnitude = tableData[i][1];
        let filter = tableData[i][2];

        if (!map.has(filter)) {
            map.set(filter, []);
        }
        map.get(filter).push({
            x:julianDate,
            y:magnitude
        });
    }

    let currentFilters = [] as string[];
    for (let i=0; i < myChart.getDatasets().length; i++) {
        // delete any unused datasets
        if (!map.has(myChart.getDataset(i).label)) {
            let ss = ', '; 
            ss += myChart.getDataset(i).label;
            myChart.getDatasets().splice(i, 1);
            ss+= '+0';
            //console.log(ss);
            form.elements['data'].value.replace(ss, '');
            //console.log(form.elements['data'].value.search(', gprime'));
            continue;
        } 
        currentFilters.push(myChart.getDataset(i).label);
    }

    // supported filters
    const colorMap = getColorMap();
    const supportedFilters = [] as string[];

    for (const [key] of colorMap.entries()) {
        supportedFilters.push(key);
    }

    // update data sets
    for (const [key, value] of map.entries()) {
        if (!supportedFilters.includes(key)) {
            continue;
        }

        if (currentFilters.includes(key)) {
            for (let i=0; i < myChart.getDatasets().length; i++) {
                if (myChart.getDataset(i).label.search(key) !== -1) {
                    myChart.getDataset(i).data = value;
                    break;
                }
            }
        } else {
            myChart.addDataset({
                label: key,
                data: value,
                backgroundColor: colorMap.get(key),
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 2,
                hidden: false,
            });
            // update labels here
            form.elements['data'].value += `, ${key}+0`;
        }
    }
    myChart.setReverseScale(true);
    myChart.update();
}


const populateDataElement = (filterMap: Map<number, number>, form: ChartInfoForm) => {
    let labels = "";
    const itr = filterMap.keys();
    // change this to grab unique filters from table
    for (let key of itr) {
        if (labels !== '') {
            labels += ', ';
        }
        labels += key;
        labels += '+0';
    }
    form.elements['data'].value = labels;
}


const addDataSetsToChart = (myChart: TransientChart, filters: Map<string, Array<Array<number>>>, xShift:number) => {
    // colorMap maps filter name to color
    let colorMap = getColorMap();
    const itr = filters.keys();

    myChart.clearDatasets();
    for (let i = 0; i < filters.size; i++) {
        let key = itr.next().value;

        let data: Array<{x: number, y: number}> = [];
        let xyData = filters.get(key);

        for (let j = 0; j < xyData.length; j++) {
            data.push({
                'x': xyData[j][0] - xShift,
                'y': xyData[j][1],
                //'yMin': xyData[j][1]-1,
                //'yMax': xyData[j][1]+0.5,
            });
        }
        myChart.addDataset({
            label: key, // 'filter+0'
            data: data,
            backgroundColor: colorMap.get(key),
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            hidden: false,
        });
    }
}


const getColorMap = () => {
    let filterColorArray = [
        ['U', '#8601AF'],
        ['B', '#0247FE'],
        ['V', '#66B032'],
        ['R', '#FE2712'],
        ['I', '#4424D6'],
        ['Y', '#347C98'],
        ['J', '#66B032'],
        ['H', '#FC600A'],
        ['K', '#FE2712'],
        ['uprime', '#4424D6'],
        ['gprime', '#347C98'],
        ['rprime', '#FC600A'],
        ['iprime', '#8601AF'],
        ['zprime', '#0247FE'],
    ]; // colors hand picked by Dan himself!

    let colorMap = new Map();

    for (let i = 0; i < filterColorArray.length; i++) {
        colorMap.set(filterColorArray[i][0], filterColorArray[i][1]);
    }

    return colorMap;
}

/*const people = [
        [{email: 'email1@email', y:[1,2,3]},
        {email: 'email2@email', y:'y2'}],
        [{email: 'email3@email', y:'y3'}]
    ];
    let emails = [people.map(([{ email, y }]) => [email, y])];
    console.log(emails);

    const dataTest = 
    [
        {
            label:'gen1',
            backgroundColor: 'blue',
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            hidden: false,
            data:[
                {x:3., y:0.5, yMin:0.4, yMax:0.6}, 
                {x:2., y:0.5, yMin:0.45, yMax:0.60}
        ]},
        {
            label: 'gen2',
            backgroundColor: 'red',
            data:[
                {x:7., y:0.5, yMin:0.4, yMax:0.6}, 
                {x:4., y:0.5, yMin:0.48, yMax:0.8}
        ]},
    ];*/