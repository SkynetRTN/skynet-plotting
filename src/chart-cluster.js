'use strict';

import Chart from "chart.js";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config.js"
import { linkInputs, throttle, updateLabels, updateTableHeight } from "./util.js"
import { round } from "./my-math.js"

/**
 *  This function is for the moon of a planet.
 *  @returns {any[]}:
 */
export function cluster() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Cluster Diagram" id="cluster-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Distance (kpc):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance" name="d"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Distance" name="d-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4 des">Max Error (mag)</div>\n' +
        '<div class="col-sm-5 range"><input type="range" title="Error" name="err"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Error" name="err-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">log(Age (yr)):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Age" name="age"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Age" name="age-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Reddening (mag):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Reddening" name="red"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Reddening" name="red-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Metallicity (solar):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Metallicity" name="metal"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Metallicity" name="metal-num" class="field"></div>\n' +
        '</div>\n' +
        '</form>\n' +
        '<form title="Filters" id="filter-form" style="padding-bottom: .5em">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6" style="color: grey;">Select Filters:</div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4">Blue:</div>\n' +
        '<div class="col-sm-4">Red:</div>\n' +
        '<div class="col-sm-4">Luminosity:</div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4"><select name="blue" style="width: 100%;" title="Select Blue Color Filter">\n' +
        '<option value="b" title="B filter" selected>B</option></div>\n' +
        '<option value="r" title="V filter">V</option></select></div>\n' +
        '<div class="col-sm-4"><select name="red" style="width: 100%;" title="Red Color Filter" disabled>\n' +
        '<option value="b" title="B filter">B</option></div>\n' +
        '<option value="r" title="V filter" selected>V</option></select></div>\n' +
        '<div class="col-sm-4"><select name="lum" style="width: 100%;" title="Select Luminosity Filter">\n' +
        '<option value="b" title="B filter">B</option></div>\n' +
        '<option value="r" title="V filter" selected>V</option></select></div>\n' +
        '</div>\n' +
        '</form>\n');

    // Link each slider with corresponding text box
    let clusterForm = document.getElementById("cluster-form");
    let filterForm = document.getElementById("filter-form");
    linkInputs(clusterForm.elements['d'], clusterForm.elements['d-num'], 0.1, 100, 0.01, 3, true);
    linkInputs(clusterForm.elements['err'], clusterForm.elements['err-num'], 0, 1, 0.01, 1);
    linkInputs(clusterForm.elements['age'], clusterForm.elements['age-num'], 6, 11, 0.01, 6);
    linkInputs(clusterForm.elements['red'], clusterForm.elements['red-num'], 0, 1, 0.01, 0);
    linkInputs(clusterForm.elements['metal'], clusterForm.elements['metal-num'], -3, 1, 0.01, -3);

    let tableData = [];



    let chartData = [];

    // create table
    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ["B Mag", "V Mag", "B Err", "V Err"], // need to change to filter1, filter2
        maxCols: 4,
        columns: [
            { data: 'b', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'r', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'bErr', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'rErr', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } }
        ],
    }));

    // create chart
    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Model',
                    data: null, // will be generated later
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                },{
                    label: 'Data',
                    data: chartData,
                    backgroundColor: colors['red'],
                    fill: false,
                    showLine: false,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    immutableLabel: false,
                }
            ]
        },
        options: {
            hover: {
                mode: 'nearest'
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        return '(' + round(tooltipItem.xLabel, 2) + ', ' +
                            round(tooltipItem.yLabel, 2) + ')';
                    },
                },
            },
            scales: {
                xAxes: [{
                    //label: 'B-V',
                    type: 'linear',
                    position: 'bottom',
                }],
                yAxes: [{
                    //label: 'V',
                    ticks: {
                        reverse: true,
                        suggestedMin: 0,
                    },
                }],
            }
        }
    });

    let update = function () {
        //console.log(tableData);
        updateTableHeight(hot);
        updateScatter(hot, myChart,
            clusterForm.elements['d-num'].value,
            filterForm, clusterForm.elements['err-num'].value);
        updateHRModel(clusterForm, myChart);
    };

    // link chart to table
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    let fps = 60;
    let frameTime = Math.floor(1000 / fps);

    // link chart to model form (slider + text)
    clusterForm.oninput = throttle(update, frameTime);

    filterForm.oninput = function () {
        //console.log(tableData);
        let red = filterForm.elements["red"];
        let blue = filterForm.elements["blue"];
        let lum = filterForm.elements["lum"];
        if (red.value === blue.value) {
            red.value = red.options[(red.selectedIndex + 1) % 2].value;
        }
        //myChart.options.scales.xAxes[0].scaleLabel.labelString = blue.value+"-"+red.value;
        //myChart.options.scales.yAxes[0].scaleLabel.labelString = red.value;

        update();
        updateLabels(myChart, document.getElementById('chart-info-form'));
        myChart.update(0);
    }
    update();



    myChart.options.title.text = "Title"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = 'x';
    myChart.options.scales.yAxes[0].scaleLabel.labelString = 'y';
    updateLabels(myChart, document.getElementById('chart-info-form'), false, false, false, false);

    return [hot, myChart];
}


/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 */
export function clusterFileUpload(evt, table, myChart) {
    // console.log("clusterFileUpload called");
    let file = evt.target.files[0];

    if (file === undefined) {
        return;
    }

    // File type validation
    if (!file.type.match("(text/csv|application/vnd.ms-excel)") &&
        !file.name.match(".*\.csv")) {
        console.log("Uploaded file type is: ", file.type);
        console.log("Uploaded file name is: ", file.name);
        alert("Please upload a CSV file.");
        return;
    }

    let reader = new FileReader();
    reader.onload = () => {

        let clusterForm = document.getElementById("cluster-form");

        //set graph options to default:
        // console.log(clusterForm.elements['d'].value);
        clusterForm.elements['d'].value = Math.log(3);
        // console.log(clusterForm.elements['d'].value);
        clusterForm.elements['age'].value = 6;
        clusterForm.elements['red'].value = 0;
        clusterForm.elements['metal'].value = -3;
        clusterForm.elements['d-num'].value = 3;
        clusterForm.elements['age-num'].value = 6;
        clusterForm.elements['red-num'].value = 0;
        clusterForm.elements['metal-num'].value = -3;

        myChart.options.title.text = "Title";
        myChart.data.datasets[1].label = "Data";
        myChart.options.scales.xAxes[0].scaleLabel.labelString = 'x';
        myChart.options.scales.yAxes[0].scaleLabel.labelString = 'y';
        updateLabels(myChart, document.getElementById('chart-info-form'), false, false, false, false);

        let data = reader.result.split("\n").filter(str => (str !== null && str !== undefined && str !== ""));
        let last = data.length;
        let filter1 = data[1].trim().split(",")[10]; // identify first filter

        let filter2 = data[last - 1].trim().split(",")[10]; // because afterglow stacks filters in chunks, the first filter is in row 1 and the last filter is in the last row.

        let blue = document.getElementById("filter-form").elements["blue"];
        let red = document.getElementById("filter-form").elements["red"];
        let lum = document.getElementById("filter-form").elements["lum"];

        //Change filter oprions to match file
        let filter1num, filter2num;
        if (filter1.toUpperCase() === "U") {
            filter1num = 1
        } else if (filter1.toUpperCase() === "UPRIME") {
            filter1num = 2
        } else if (filter1.toUpperCase() === "B") {
            filter1num = 3
        } else if (filter1.toUpperCase() === "GPRIME") {
            filter1num = 4
        } else if (filter1.toUpperCase() === "V") {
            filter1num = 5
        } else if (filter1.toUpperCase() === "RPRIME") {
            filter1num = 6
        } else if (filter1.toUpperCase() === "R") {
            filter1num = 7
        } else if (filter1.toUpperCase() === "IPRIME") {
            filter1num = 8
        } else if (filter1.toUpperCase() === "I") {
            filter1num = 9
        } else if (filter1.toUpperCase() === "ZPRIME") {
            filter1num = 10
        } else if (filter1.toUpperCase() === "J") {
            filter1num = 11
        } else if (filter1.toUpperCase() === "H") {
            filter1num = 12
        } else if (filter1.toUpperCase() === "K") {
            filter1num = 13
        } else {
            filter1num = 14
        }

        if (filter2.toUpperCase() === "U") {
            filter2num = 1
        } else if (filter2.toUpperCase() === "UPRIME") {
            filter2num = 2
        } else if (filter2 === "B") {
            filter2num = 3
        } else if (filter2.toUpperCase() === "GPRIME") {
            filter2num = 4
        } else if (filter2.toUpperCase() === "V") {
            filter2num = 5
        } else if (filter2.toUpperCase() === "RPRIME") {
            filter2num = 6
        } else if (filter2.toUpperCase() === "R") {
            filter2num = 7
        } else if (filter2.toUpperCase() === "IPRIME") {
            filter2num = 8
        } else if (filter2.toUpperCase() === "I") {
            filter2num = 9
        } else if (filter2.toUpperCase() === "ZPRIME") {
            filter2num = 10
        } else if (filter2.toUpperCase() === "J") {
            filter2num = 11
        } else if (filter2.toUpperCase() === "H") {
            filter2num = 12
        } else if (filter2.toUpperCase() === "K") {
            filter2num = 13
        } else {
            filter2num = 14
        }
        let filter1temp = filter1
        let filter2temp = filter2
        if (filter1num > filter2num) {
            filter1 = filter2temp
            filter2 = filter1temp
        }

        blue.options[0].textContent = filter1;
        blue.options[1].textContent = filter2;
        red.options[0].textContent = filter1;
        red.options[1].textContent = filter2;
        lum.options[0].textContent = filter1;
        lum.options[1].textContent = filter2;

        let data1 = []; // initialize arrays for the values associated with 
        let data2 = []; // the first and second filter

        data.splice(0, 1);



        for (const row of data) {
            let items = row.trim().split(",");


            // adds id, magnitude, magnitude error to data1 if filter is filter 1
            if (items[10] === filter1) {
                data1.push([items[1], parseFloat(items[12]), parseFloat(items[13])])
            }
            // otherwise adds id, magnitude, error to data2
            else {
                data2.push([items[1], parseFloat(items[12]), parseFloat(items[13])])
            }
        }



        table.updateSettings({
            colHeaders: [filter1 + " Mag", filter2 + " Mag", filter1 + " Err", filter2 + " Err"],
        })

        data1.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
        data2.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

        let left = 0;
        let right = 0;
        let tableData = [];


        while (left < data1.length && right < data2.length) {
            if (data1[left][0] === data2[right][0]) {
                tableData.push({
                    'b': data1[left][1],
                    'r': data2[right][1],
                    'bErr': data1[left][2],
                    'rErr': data2[right][2]
                });
                left++;
                right++;
            } else if (data1[left][0] < data2[right][0]) {
                tableData.push({
                    'b': data1[left][1],
                    'r': null,
                    'bErr': data1[left][2],
                    'rErr': null
                });
                left++;
            } else {
                tableData.push({
                    'b': null,
                    'r': data2[right][1],
                    'bErr': null,
                    'rErr': data2[right][2]
                });
                right++;
            }
        }
        while (left < data1.length) {
            tableData.push({
                'b': data1[left][1],
                'r': null,
                'bErr': data1[left][2],
                'rErr': null
            });
            left++;
        }
        while (right < data2.length) {
            tableData.push({
                'b': null,
                'r': data2[right][1],
                'bErr': null,
                'rErr': data2[right][2]
            });
            right++;
        }

        tableData = tableData.filter(entry => !isNaN(entry.b) || !isNaN(entry.r));
        tableData = tableData.map(entry => ({
            'b': isNaN(entry.b) ? null : entry.b,
            'r': isNaN(entry.r) ? null : entry.r,
            'bErr': isNaN(entry.bErr) ? null : entry.bErr,
            'rErr': isNaN(entry.rErr) ? null : entry.rErr
        }));

        // Here we have complete tableData
        table.updateSettings({ data: tableData });
        updateTableHeight(table);
        updateScatter(table, myChart,
            document.getElementById('cluster-form').elements["d-num"].value,
            document.getElementById('filter-form'), 
            document.getElementById('cluster-form').elements["err-num"].value
        )
    }
    reader.readAsText(file);
}

/**
 *  This function takes a form to obtain the 4 parameters (a, p, phase, tilt) that determines the
 *  relationship between a moon's angular distance and Julian date, and generates a dataset that
 *  spans over the range determined by the max and min value present in the table.
 *  @param table:   A table used to determine the max and min value for the range
 *  @param form:    A form containing the 4 parameters (amplitude, period, phase, tilt)
 *  @param chart:   The Chartjs object to be updated.
 */
function updateHRModel(form, chart) {
    chart.data.datasets[0].data = HRGenerator(
        //form.elements['r-num'].value,
        form.elements['age-num'].value,
        form.elements['red-num'].value,
        form.elements['metal-num'].value,
        -8,
        8,
        2000
    );
    chart.update(0);
}

/**
*  This function generates the data used for functions "updateHRModel" and "clusterGenerator."
*
*  @param d:            Distance to the Cluster
*  @param r:            % of the range
*  @param age:          Age of the Cluster
*  @param reddening:    The reddening of the observation
*  @param metallicity:  Metallicity of the cluster
*  @param start:        The starting point of the data points
*  @param end:          The end point of the data points
*  @param steps:        Steps generated to be returned in the array. Default is 500
*  @returns {Array}
*/
function HRGenerator(age, reddening, metallicity, start = -8, end = 8, steps = 500) {
    //To Change
    let data = [];
    let y = start;
    let step = (end - start) / steps;
    for (let i = 0; i < steps; i++) {
        let x3 = 0.2 * Math.pow(((y - 8) / (-22.706 + 2.7236 * age - 8)), 3);
        let x2 = -0.0959 + 0.1088 * y + 0.0073 * Math.pow(y, 2)
        let x1 = x3 + x2;
        if (x1 <= 2) {//cut off at x=2
            data.push({
                y: y,
                x: x1 + parseFloat(reddening)
            });
        }
        y += step;
    }
    return data;
}

function updateScatter(table, myChart, dist, form, err = 1, dataSet = 1) {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    let tableData = table.getData();
    //Determine what filters each is set to
    let blue = form.elements["blue"].value === 'b' ? 0 : 1;
    let red = form.elements["red"].value === 'b' ? 0 : 1;
    let lum = form.elements["lum"].value === 'b' ? 0 : 1;

    //Throw out high error or null data
    for (let i = 0; i < tableData.length; i++) {
        if (tableData[i][(blue+2)] >= err || tableData[i][(red+2)] >= err || 
            tableData[i][blue] === '' || tableData[i][red] === '' ||
            tableData[i][blue] === null || tableData[i][red] === null ) {
            console.log("You stupid")
            continue;
        }

        console.log("You made it!")

        //(red - blue , red)
        chart[start++] = {
            x: tableData[i][blue] - tableData[i][red],
            y: tableData[i][lum] - 5 * Math.log10(dist / 0.01)
        };
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(dataSet);
}