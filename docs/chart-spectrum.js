'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLine, updateLabels, updateTableHeight } from "./shared-util.js"
import { round } from "./my-math.js"

export function spectrum() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
    '<form title="Spectrum" id="spectrum-form" style="padding-bottom: 1em">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">Select Channel: </div>\n' +
        '<div class="col-sm-5"><select name="channel" style="width: 100%;" title="Select Channel">\n' +
        '<option value="x" title="XX1" selected>XX1</option>\n' +
        '<option value="y" title="YY1">YY1</option>' +
        '</div>'
    );
    
    let tableData = [];
    for (let i = 0; i < 200; i++) {
        let wl = i / 200 * 0.03 + 21.09;
        tableData.push({
            'wl': wl,
            'x': 100 - Math.pow(100 * (wl - 21.105), 2) / 0.015 + Math.random() * 21,
            'y': 100 - Math.pow(100 * (wl - 21.105), 2) / 0.015 + Math.random() * 21,
        });
    }

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Wave Length', 'XX1', 'YY1'],
        maxCols: 3,
        columns: [
            { data: 'wl', type: 'numeric', numericFormat: { pattern: { mantissa: 4 } } },
            { data: 'x', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'XX1',
                    data: [],
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: false,
                }, {
                    label: 'YY1',
                    data: [],
                    borderColor: colors['red'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: true,
                }
            ]
        },
        options: {
            legend: {
                labels: {
                    filter: function (legendItem, chartData) {
                        return !legendItem.hidden;
                    }
                }
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return '(' + round(tooltipItem.xLabel, 4) + ', ' +
                               round(tooltipItem.yLabel, 2) + ')';
                    },
                },
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }]
            }
        }
    });

    let update = function () {
        updateSpectrum(hot, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    let spectrumForm = document.getElementById("spectrum-form");
    spectrumForm.onchange = function () {
        let channel = spectrumForm.elements["channel"].value;
        if (channel === "x") {
            myChart.data.datasets[0].hidden = false;
            myChart.data.datasets[1].hidden = true;
        } else {
            myChart.data.datasets[0].hidden = true;
            myChart.data.datasets[1].hidden = false;
        }
        myChart.update(0);
    }
    
    updateSpectrum(hot, myChart);
    updateTableHeight(hot);

    return [hot, myChart];
}
/**
 * This function takes the updated value from the table and uses it to update the chart.
 * @param {*} table Handsontable object
 * @param {*} myChart Chartjs object
 */
function updateSpectrum(table, myChart) {
    for (let i = 0; i < 2; i++) {
        myChart.data.datasets[i].data = [];
    }

    let tableData = table.getData();
    let src1Data = [];
    let src2Data = [];

    for (let i = 0; i < tableData.length; i++) {
        src1Data.push({
            "x": tableData[i][0],
            "y": tableData[i][1],
        })
        src2Data.push({
            "x": tableData[i][0],
            "y": tableData[i][2],
        })
    }

    myChart.data.datasets[0].data = src1Data;
    myChart.data.datasets[1].data = src2Data;

    myChart.update(0);
}

/**
 * This function handles the uploaded file to the spectrum chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 */
export function spectrumFileUpload(evt, table, myChart) {
    // console.log("spectrumFileUpload called");
    let file = evt.target.files[0];

    if (file === undefined) {
        return;
    }

    // File type validation
    if (!file.type.match("text/plain") ||
        !file.name.match(".*\.txt")) {
        console.log("Uploaded file type is: ", file.type);
        console.log("Uploaded file name is: ", file.name);
        alert("Please upload a .txt file.");
        return;
    }

    let reader = new FileReader();
    reader.onload = () => {
        let data = reader.result.split("\n").filter(str => (str !== null && str !== undefined && str !== ""));
        data = data.filter(str => (str[0] !== '#'));

        let tableData = [];
        for (let i = 0; i < data.length; i++) {
            "Use regular expression `/\s+/` to handle more than one space"
            let entry = data[i].trim().split(/\s+/);

            let wl = freqToWL(parseFloat(entry[0]));
            let x = parseFloat(entry[1]);
            let y = parseFloat(entry[2]);
            if (isNaN(wl) || isNaN(x) || isNaN(y) || wl < 21.085 || wl > 21.125) {
                continue;
            }
            tableData.push({
                "wl": wl,
                "x": x,
                "y": y,
            });
        }
        tableData.sort((a, b) => a.wl - b.wl);
        
        let spectrumForm = document.getElementById("spectrum-form");
        spectrumForm.elements['channel'].selectedIndex = 0;

        // Need to put this line down in the end, because it will trigger update on the Chart, which will 
        // in turn trigger update to the variable form and the light curve form, which needs to be cleared
        // prior to being triggered by this upload.
        table.updateSettings({ data: tableData });
    }
    reader.readAsText(file);
}

/**
 * This function converts a specific light wave's frequency, in MHz, to its corresponding wavelength, in cm.
 * @param {number} freq The frequency of the light in MHz
 */
function freqToWL(freq) {
    const c = 3e8;
    return c / (freq * 1e4);
}

/**
 * This function converts a wavelength in cm to its frequency in MHz
 * @param {number} wl The wavelength of the light in centimeters
 */
function wlToFreq(wl) {
    const c = 3e8;
    return c / (wl * 1e4)
}