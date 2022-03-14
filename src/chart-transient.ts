'use strict';

import Chart from "chart.js/auto";
import { CategoryScale, LinearScale, registerables, ScatterDataPoint } from "chart.js";
import { ScatterWithErrorBarsController, PointWithErrorBar } from 'chartjs-chart-error-bars';
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config"
import { updateLabels, updateTableHeight, sanitizeTableData } from "./util"
import { round } from "./my-math"

/**
 *  Returns generated table and chart for variable.
 *  @returns {[Handsontable, Chart]} Returns the table and the chart object.
 */
export function transient(): [Handsontable, Chart] {

    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Variable" id="variable-form" style="padding-bottom: 1em"></form>\n' +
        '<div id="light-curve-div"></div>\n'
    );

    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y Axis";

    // initialize table with random data
    const tableData = [];
    const numOfRndmValues = 14; // arbitrary
    const randomFilters = ['B', 'V', 'R', 'I'];

    for (let i = 0; i < numOfRndmValues; i++) {
        tableData[i] = {
            'jd': i * 10 + Math.random() * 10 - 5,
            'magnitude': Math.random() * 20,
            'filter': randomFilters[Math.floor(Math.random() * 4)],
        };
    }
    // initialize 'data' element text 
    populateDataElement(randomFilters, document.getElementById('chart-info-form') as ChartInfoForm);

    const container = document.getElementById('table-div');
    const hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Julian Date', 'Magnitude', 'Filter'],
        maxCols: 3,
        columns: [
            { data: 'jd', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'magnitude', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'filter', type: 'text' },
        ],
    }));

    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    // register controller in chart.js and ensure the defaults are set
    Chart.register(ScatterWithErrorBarsController, PointWithErrorBar, LinearScale, CategoryScale, ...registerables);

    const myChart = new Chart(ctx, {
        type: 'scatter',
        //type: ScatterWithErrorBarsController.id,
        data: {
            maxMJD: Number.NEGATIVE_INFINITY,
            minMJD: Number.POSITIVE_INFINITY,
            labels: [],
            datasets: [
                {
                    label: 'Source',
                    data: [],
                    backgroundColor: '',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    hidden: false,
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        filter: function (legendItem) {
                            return !legendItem.hidden;
                        }
                    }
                },
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
                    type: 'linear',
                    position: 'bottom',
                }
            }
        }
    });

    const update = function () {
        updateVariable(hot, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    lightCurve(myChart);

    const variableForm = document.getElementById("variable-form") as VariableForm;

    variableForm.onchange = function () {

        const lightCurveForm = document.getElementById("light-curve-form");
        lightCurveForm.oninput(null);

        myChart.update('none');
        // shiftFilterMagnitudes();

        //updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);

        updateTableHeight(hot);
    }

    myChart.options.plugins.title.text = "Title";
    myChart.options.scales['x'].title.text = "x";
    myChart.options.scales['y'].title.text = "y";
    //updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);

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
    // no file
    let file = (evt.target as HTMLInputElement).files[0];
    if (file === undefined) {
        return;
    }

    // file exists - is it .csv?
    if (!file.type.match("(text/csv|application/vnd.ms-excel)")) {
        if (!file.name.match(".*\.csv")) {
            console.log("Uploaded file type is: ", file.type);
            console.log("Uploaded file name is: ", file.name);
            alert("Please upload a CSV file.");

            return;
        }
    }

    let reader = new FileReader();
    reader.onload = () => {
        let data = (reader.result as string).split("\n")
            .filter(str => (str !== null && str !== undefined && str !== ""));

        // remove zeroth column (col[0] = file_id as of Mar 2022)
        let columns = data[0].trim().split(",");
        data.splice(0, 1);

        // column indices of interest
        let sourceIdIdx = columns.indexOf('id');
        let mJDateIdx = columns.indexOf('mjd');
        let filterIdx = columns.indexOf('filter');
        let magIdx = columns.indexOf('mag');
        let cMagIdx = columns.indexOf('calibrated_mag');
        //let magErrorIdx = columns.indexOf('mag_error');
        //let cZeroPointIdx = columns.indexOf('calibrated_zero_point');

        // creates a map where each src item has an array [mjd, magnitude, filter]
        let sources = new Map(); // only using one source depsite plural

        for (const row of data) {
            let items = row.trim().split(',');

            // create key for each new source
            if (!sources.has(items[sourceIdIdx])) {
                sources.set(items[sourceIdIdx], []);
            }

            // populate source data if calibrated mag data exists
            if (items[cMagIdx] !== "") {
                sources.get(items[sourceIdIdx]).push([
                    parseFloat(items[mJDateIdx]),
                    parseFloat(items[magIdx]),
                    items[(filterIdx)]
                ]);
            }
        }

        const itr = sources.keys();
        let sourceData = itr.next().value;
        // if we want more sources in future, use itr.next().value again

        if (!sourceData) {
            alert('No sources detected in file!');
            return;
        }

        // remove NaNs and sort ascending
        let data1 = sources.get(sourceData)
            .filter((val: number[]) => !isNaN(val[0]))
            .sort((a: number[], b: number[]) => a[0] - b[0]);

        const tableData: any[] = [];
        // push data to the table to be displayed
        for (let i = 0; i < data1.length; i++) {
            pushTableData(tableData, data1[i][0], data1[i][1], data1[i][2]);
        }

        table.updateSettings({
            colHeaders: ['Julian Date', 'Magnitude', 'Filter'],
        })

        myChart.data.datasets[0].label = sourceData;
        myChart.options.plugins.title.text = "Title";
        myChart.options.scales['x'].title.text = "x";
        myChart.options.scales['y'].title.text = "y";

        const filterList = ['B', 'V', 'R', 'I']; // hard-coded
        populateDataElement(filterList, document.getElementById('chart-info-form') as ChartInfoForm);

        //updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);

        lightCurve(myChart);

        // Need to put this line down in the end, because it will trigger update on the Chart, which will 
        // in turn trigger update to the variable form and the light curve form, which needs to be cleared
        // prior to being triggered by this upload.
        table.updateSettings({ data: tableData });
    }
    reader.readAsText(file);
}


/**
 * This function checks the potential entry to the tableData. If jd is not NaN,
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
 * This function is called when the values in table is changed (either by manual input or by file upload).
 * It then updates the chart according to the data in the table.
 * DATA FLOW: table -> chart
 * @param table The table object
 * @param myChart The chart object
 */
function updateVariable(table: Handsontable, myChart: Chart) {

    myChart.data.maxMJD = 0;
    myChart.data.minMJD = Number.POSITIVE_INFINITY;

    const numOfDatasets = myChart.data.datasets.length;

    for (let i = 0; i < numOfDatasets; i++) {
        myChart.data.datasets[i].data = [];
    }

    // can't pass filter col ([2]) to sanitize since is string
    const tableData = sanitizeTableData(table.getData(), [0, 1]);
    let sourceData = [];

    // hard-coded to be consistnent and intuitive
    let colorMap = new Map<string, string>([
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
    ]); // colors hand picked by Dan himself!

    let pointColors = [];
    for (let i = 0; i < tableData.length; i++) {
        let julianDate = tableData[i][0];
        let magnitude = tableData[i][1];

        // Each point is a different color depending on filter
        if (colorMap.has(tableData[i][2])) {
            pointColors.push(colorMap.get(tableData[i][2]));
        } else {
            pointColors.push('black');
        }

        myChart.data.minMJD = Math.min(myChart.data.minMJD, julianDate);
        myChart.data.maxMJD = Math.min(myChart.data.maxMJD, julianDate);

        sourceData.push({
            //'label': 'new label',
            'x': julianDate,
            'y': magnitude,
            //'yMin': magnitude,
            //'yMax': magnitude,
        });
    }

    //console.log(sourceData);
    myChart.data.datasets[0].data = sourceData;
    myChart.data.datasets[0].backgroundColor = pointColors;
    myChart.data.labels = pointColors;

    // accounts for reverse magnitude scale
    myChart.options.scales['y'].reverse = true;

    const variableForm = document.getElementById("variable-form") as VariableForm;
    variableForm.onchange(null);
}


/**
 * Takes an array of values and populates
 * the 'Data' element in index.html.
 * @param array array of strings containing form text
 * @param form form containing the element to be populated
 */
const populateDataElement = (array: Array<string>, form: ChartInfoForm,) => {
    let labels = "";
    for (let i = 0; i < array.length; i++) {
        if (true) {
            if (labels !== '') {
                labels += ', ';
            }
            labels += array[i];
            labels += '+0';
        }
    }
    form.elements['data'].value = labels;
    shiftFilterMagnitudes(form);
}


/**
 * 
 * @param myChart 
 * 
 */
const shiftFilterMagnitudes = (form: ChartInfoForm) => {
    console.log(form.elements['data'].value);

    const elementStringArray = form.elements['data'].value.split(',');
    console.log(elementStringArray);

    for (let str of elementStringArray) {
        str.trim(); // remove leading/trailing whitespaces
        //console.log(str.search('B'));
        if (str.search('B') !== -1) { // if str has any filter from full list in it - enter here
            console.log(str);
            // split again at + sign to get [filter, shift-value]
            // update chart to shift all filter mags by shift-value
            // need to update Magnitude table as well? probably not
        }
    }
}


/**
 * This function is called whenever the data sources change (i.e. the values in the table change). 
 * It creates the specific input form that is used by the light curve mode.
 * DATA FLOW: chart[0], chart[1] -> chart[2]
 * @param myChart The chart object
 */
function lightCurve(myChart: Chart) {
    // this will be replaced with generic value once I have better understanding of project
    const numOfLabels = 1;

    // dropdown Input Option
    let HTML =
        '<form title="Light Curve" id="light-curve-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Select Variable Star: </div>\n' +
        '<div class="col-sm-5"><select name="source" style="width: 100%;" title="Select Source">\n' +
        '<option value="none" title="None" selected>None</option>\n';

    // add options to variable star dropdown
    for (let i = 0; i < numOfLabels; i++) {
        let label = myChart.data.datasets[i].label;
        HTML +=
            '<option value="' + label +
            '"title="' + label +
            '">' + label + '</option>\n';
    }

    // dropdown input option
    HTML +=
        '</select></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Reference Star Actual Mag: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number" step="0.001" name="mag" title="Magnitude" value=0></input></div>\n' +
        '</div>\n' +
        '</form>\n';

    document.getElementById('light-curve-div').innerHTML = HTML;

    const lightCurveForm = document.getElementById('light-curve-form') as VariableLightCurveForm;

    // occurs when a dropdown is updated
    lightCurveForm.oninput = function () {
        // do something when inputs are updated
    }
}