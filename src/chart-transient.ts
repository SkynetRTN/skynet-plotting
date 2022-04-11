'use strict';

import Chart from "chart.js/auto";
import { CategoryScale, LinearScale, registerables, ScatterDataPoint } from "chart.js";
import { ScatterWithErrorBarsController, PointWithErrorBar } from 'chartjs-chart-error-bars';
import Handsontable from "handsontable";

import { initializeHTMLElements } from "./chart-transient-utils/chart-transient-html";
import { tableCommonOptions } from "./config"
import { updateTableHeight, sanitizeTableData } from "./util"
import { round } from "./my-math"


/**
 * Generates data set using random values
 * @param numOfPoints number of data points to generate
 * @returns array of { julian data, magnitude, filter }
 */
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
    console.log(filters);

    let sData = new Map();
    // sort

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

    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    // register controller in chart.js and ensure the defaults are set
    Chart.register(ScatterWithErrorBarsController, PointWithErrorBar, LinearScale, CategoryScale, ...registerables);

const initializeChart = () => {
    const ctx = (document.getElementById("myChart") as HTMLCanvasElement)
        .getContext('2d');

    const chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            maxMJD: Number.NEGATIVE_INFINITY,
            minMJD: Number.POSITIVE_INFINITY,
            labels: [],
            datasets: []
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return '(' + round(context.parsed.x, 4) + ', ' +
                                round(context.parsed.y, 4) + ')';
                        },
                    },
                },
            },
            scales: {
                x: {
                    display: true,
                    type: 'logarithmic',
                    position: 'bottom',
                }
            }
        }
    });
    chart.options.plugins.title.text = "Title";
    chart.options.scales['x'].title.text = "x";
    chart.options.scales['y'].title.text = "y";

    return chart;
};


const shiftMagnitudes = (hot: Handsontable, myChart: Chart, form: ChartInfoForm) => {
    let shiftedData = [];
    let delim = '';
    let sign = 1;
    let numOfRows = hot.getDataAtCol(0).length;
    const elementStringArray = form.elements['data'].value.split(',');

    // prevent massive datasets
    if (numOfRows > 10000) {
        return;
    } // prevent large inputs
    if (elementStringArray.length > 1000) {
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
        let shiftVal = parseInt(str.split(delim)[1]);

        // search chart data
        for (let i = 0; i < myChart.data.datasets.length; i++) {
            if (myChart.data.datasets[i].label.search(updatedFilter) !== -1) {

                shiftedData = [];
                // search table data
                for (let j = 0; j < numOfRows; j++) {
                    let tableFilter = hot.getDataAtCol(2)[j];

                    if (tableFilter === updatedFilter) {
                        let mjd = hot.getDataAtCol(0)[j];
                        let mag = hot.getDataAtCol(1)[j];

                        shiftedData.push({
                            'x': mjd,
                            'y': mag + (sign * shiftVal),
                        })
                    }
                }
                // update chart
                myChart.data.datasets[i].data = [];
                myChart.data.datasets[i].data = shiftedData;
                myChart.update('none');
            }
        }
    }
};


const handleDropdownInput = (chart: Chart) => {
    const dropdown = document.getElementById('dropdown') as HTMLSelectElement;
        dropdown.onchange = () => {
            const sel = dropdown.selectedIndex;
            const opt = dropdown.options[sel];
            const temporalModel = (<HTMLOptionElement>opt).value

            if (temporalModel === 'Power Law') {
                chart.options.scales['x'].type = 'logarithmic';
            } 
            else if (temporalModel === 'Exponential') {
                chart.options.scales['x'].type = 'linear';
            } else {
                chart.options.scales['x'].type = 'logarithmic'; // default
            }
            chart.update('none');
        }
};


const verifyCSV = (file: File) => {
    // file empty?
    if (file === undefined) {
        return false;
    }

    // file exists - is it .csv?
    if (!file.type.match("(text/csv|application/vnd.ms-excel)")) {
        if (!file.name.match(".*\.csv")) {
            console.log("Uploaded file type is: ", file.type);
            console.log("Uploaded file name is: ", file.name);
            alert("Please upload a CSV file.");

            return false;
        }
    }
    return true;
};


const getDataFromCSV = (data: string[], cols: string[], colIds: number[], key: string) => {

    const keyIdx = cols.indexOf(key);
    const cMagIdx = cols.indexOf('calibrated_mag');
    const map = new Map();

    for (const row of data) {
        let items = row.trim().split(',');

        if (!map.has(items[keyIdx])) {
            map.set(items[keyIdx], []);
        }
        if (key === 'id' && colIds.length === 3) {
            const [col1, col2, col3] = colIds;

            if (items[cMagIdx] !== "") {
                map.get(items[keyIdx]).push([
                    parseFloat(items[col1]),
                    parseFloat(items[col2]),
                    items[col3]
                ]);
            }
        } else if (key === 'filter' && colIds.length === 2) {
            const [col1, col2] = colIds;

            map.get(items[keyIdx]).push([
                parseFloat(items[col1]),
                parseFloat(items[col2])
            ]);
        } else {
            return map;
        };
    }
    return map;
};

/**]
 *  Returns generated table and chart for variable.
 *  @returns {[Handsontable, Chart]}
 */
export function transient(): [Handsontable, Chart] {
    /* Initialize page elements */

    // insert/format HTML
    initializeHTMLElements();

    // generate initial 'junk' data
    const tableData = generateRandomData(14);

    // sort 'junk' data by filter
    let randomData = sortDataByFilter(tableData);

    // 'Data' element receives input from user (unfortunately)
    const chartInfoForm = document
        .getElementById('chart-info-form') as ChartInfoForm;

    populateDataElement(randomData, chartInfoForm);

    // create data table 
    const hot = initializeTable(tableData);

    // create chart using ChartJS
    const myChart = initializeChart();

    // populate chart with random data
    addDataSetsToChart(myChart, randomData);

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
    chartInfoForm.elements['data'].onchange = () => {
        shiftMagnitudes(hot, myChart, chartInfoForm);
    }

    const parameterForm = document
        .getElementById('light-curve-form') as VariableLightCurveForm;

    // handle user changing dropdown
    parameterForm.oninput = () => {
        handleDropdownInput(myChart);

        myChart.data.maxMJD = 0;
        myChart.data.minMJD = Number.POSITIVE_INFINITY;

        const tableData = sanitizeTableData(hot.getData(), [0, 1]);

        // get data from table
        for (let i = 0; i < tableData.length; i++) {
            let julianDate = tableData[i][0];

            myChart.data.minMJD = Math.min(myChart.data.minMJD, julianDate);
            myChart.data.maxMJD = Math.max(myChart.data.maxMJD, julianDate);
        }
        const minBuffer = myChart.data.minMJD * 0.05;
        const maxBuffer = myChart.data.maxMJD * 0.05;

        myChart.options.scales['x'].min = myChart.data.minMJD - minBuffer;
        myChart.options.scales['x'].max = myChart.data.maxMJD + maxBuffer;
    }

    const variableForm = document
        .getElementById("variable-form") as VariableForm;

    // handle user changing input boxes
    variableForm.onchange = function () {
        const lightCurveForm = document.getElementById("light-curve-form");
        lightCurveForm.oninput(null);

        myChart.update('none');
        updateTableHeight(hot);
    }

    updateVariable(hot, myChart);
    updateTableHeight(hot);

    return [hot, myChart];
}


/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param evt The uploadig event
 * @param table The table to be updated
 * @param myChart
 */
export function transientFileUpload(evt: Event, table: Handsontable, myChart: Chart<'line'>) {

    /* Read in data from csv */
    let file = (evt.target as HTMLInputElement).files[0];

    // do nothing if file fails verification
    if (!verifyCSV(file)) {
        return;
    }

    let reader = new FileReader();
    reader.onload = () => {
        let csvData = (reader.result as string).split("\n")
            .filter(str => (str !== null && str !== undefined && str !== ""));

        //let magErrorIdx = columns.indexOf('mag_error');
        //let cZeroPointIdx = columns.indexOf('calibrated_zero_point');*/        

        let cols = csvData[0].trim().split(",");
        csvData.splice(0, 1);

        // columns must be in order that get pushed to map
        const sourceCols = [cols.indexOf('mjd'),
            cols.indexOf('mag'),
            cols.indexOf('filter')];
        const source = getDataFromCSV(csvData, cols, sourceCols, 'id')

        const filterCols = [cols.indexOf('mjd'),
            cols.indexOf('mag')];
        const filterSortedValues = getDataFromCSV(csvData, cols, filterCols, 'filter')

        if (!source.size || !filterSortedValues.size) {
            console.log('Data sorting failed!');
            return;
        }

        const itr = source.keys();
        let sourceData = itr.next().value;

        if (!sourceData) {
            alert('No source detected in file!');
            return;
        }

        /* Push data to table and chart */
        myChart.data.maxMJD = 0;
        myChart.data.minMJD = Number.POSITIVE_INFINITY;

        // remove bad data and sort my date
        let data = source.get(sourceData)
            .filter((val: number[]) => !isNaN(val[0]))
            .sort((a: number[], b: number[]) => a[0] - b[0]);

        const tableData: any[] = [];
        for (let i = 0; i < data.length; i++) {
            myChart.data.minMJD = Math.min(myChart.data.minMJD, data[i][0]);
            myChart.data.maxMJD = Math.max(myChart.data.maxMJD, data[i][0]);
            pushTableData(tableData, data[i][0], data[i][1], data[i][2]);
        }

        myChart.options.scales['x'].min = myChart.data.minMJD;
        myChart.options.scales['x'].max = myChart.data.maxMJD;

        myChart.data.datasets = [];
        const chartForm = document
            .getElementById('chart-info-form') as ChartInfoForm;

        // update chart data
        addDataSetsToChart(myChart, filterSortedValues);
        populateDataElement(filterSortedValues, chartForm);
        //updateVariable(table, myChart)

        myChart.options.scales['x'].type = 'logarithmic'; // reset to default when uploading file
        myChart.update('none');

        // reset dropdown
        const dropdown = document.getElementById('dropdown') as HTMLSelectElement;
        dropdown.selectedIndex = 0;

        // update table data
        table.updateSettings({ data: tableData });
    }
    reader.readAsText(file);
}


/**
 * Checks the potential entry to the tableData. If jd is not NaN,
 * the entry will be pushed to tableData with `NaN` turned to `null`.
 * @param {List} tableData tableData list to be updated
 * @param {number} jd Julian date of the row
 * @param {number} mag Magnitude of source
 * @param {string} filter Filter used for exposure
 */
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


/**
 * Called when the values in table is changed (either by manual input or by file upload).
 * It then updates the chart according to the data in the table.
 * DATA FLOW: table -> chart
 * @param table The table object
 * @param myChart The chart object
 */
function updateVariable(table: Handsontable, myChart: Chart) {

    // can't pass filter col ([2]) to sanitize since is string
    const tableData = sanitizeTableData(table.getData(), [0, 1]);
    const map = new Map();

    const form = document
        .getElementById('chart-info-form') as ChartInfoForm;

    // get data from table
    for (let i = 0; i < tableData.length; i++) {
        let julianDate = tableData[i][0];
        let magnitude = tableData[i][1];
        let filter = tableData[i][2];

        if (!map.has(filter)) {
            map.set(filter, []);
        }

        map.get(filter).push({
            'x':julianDate,
            'y':magnitude
        });
    }

    // current filters
    let currentFilters = [] as string[];
    for (let i=0; i < myChart.data.datasets.length; i++) {
        // delete any unused datasets
        if (!map.has(myChart.data.datasets[i].label)) {
            let ss = ', '; 
            ss += myChart.data.datasets[i].label;
            myChart.data.datasets.splice(i, 1);
            ss+= '+0';
            //console.log(ss);
            form.elements['data'].value.replace(ss, '');
            //console.log(form.elements['data'].value.search(', gprime'));
            continue;
        } 
        currentFilters.push(myChart.data.datasets[i].label);
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
            for (let i=0; i < myChart.data.datasets.length; i++) {
                if (myChart.data.datasets[i].label.search(key) !== -1) {
                    myChart.data.datasets[i].data = value;
                    break;
                }
            }
        } else {
            myChart.data.datasets.push({
                label: key,
                data: value,
                backgroundColor: colorMap.get(key),
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 2,
                hidden: false,
            });
            // update labels here
            console.log(key);
            form.elements['data'].value += `, ${key}+0`;
        }
    }

    // accounts for reverse magnitude scale
    myChart.options.scales['y'].reverse = true;

    const variableForm = document.getElementById("variable-form") as VariableForm;
    variableForm.onchange(null);
}


/**
 * Takes an map of values and populates
 * the 'Data' element in index.html.
 * @param array array of strings containing form text
 * @param form form containing the element to be populated
 */
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


/**
 * 
 * 
 * 
 */
const addDataSetsToChart = (myChart: Chart, filters: Map<string, Array<Array<number>>>) => {
    // colorMap maps filter name to color
    let colorMap = getColorMap();
    const itr = filters.keys();

    for (let i = 0; i < filters.size; i++) {
        let key = itr.next().value;

        let data = [];
        let xyData = filters.get(key);

        for (let j = 0; j < xyData.length; j++) {
            data.push({
                'x': xyData[j][0],
                'y': xyData[j][1],
            });
        }

        myChart.data.datasets.push({
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


/**
 * hard-coded to be consistent and intuitive
 * @return Map for filter -> color
 */
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