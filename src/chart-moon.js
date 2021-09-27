'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLine, updateLabels, updateTableHeight } from "./util.js"
import { round, sqr, rad } from "./my-math.js"

/**
 *  This function is for the moon of a planet.
 *  @returns {any[]}:
 */
export function moon() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Moon" id="moon-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">a (")</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="a" name="a"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="a" name="a-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">P (d)</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="P" name="p"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="P" name="p-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">Phase (°)</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="Phase" name="phase"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Phase" name="phase-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">Tilt (°)</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="Tilt" name="tilt"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Tilt" name="tilt-num" class="field"></div>\n' +
        '</div>\n' +
        '</form>\n');

    // Link each slider with corresponding text box
    let moonForm = document.getElementById("moon-form");
    linkInputs(moonForm.elements['a'], moonForm.elements['a-num'], 1, 750, 0.01, 30, true);
    linkInputs(moonForm.elements['p'], moonForm.elements['p-num'], 2, 20, 0.01, 10);
    linkInputs(moonForm.elements['phase'], moonForm.elements['phase-num'], 0, 360, 1, 0);
    linkInputs(moonForm.elements['tilt'], moonForm.elements['tilt-num'], 0, 90, 1, 0);

    let tableData = generateMoonData();

    let chartData = [];

    // create table
    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Julian Date', 'Angular Separation'],
        maxCols: 2,
        columns: [
            { data: 'x', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    // create chart
    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Data',
                    data: chartData,
                    backgroundColor: colors['red'],
                    fill: false,
                    showLine: false,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    immutableLabel: false,
                }, {
                    label: 'Model',
                    data: null, // will be generated later
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
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
                    type: 'linear',
                    position: 'bottom',
                }],
                yAxes: [{
                    ticks: {
                        suggestedMin: 0,
                    },
                }],
            }
        }
    });

    let update = function () {
        updateTableHeight(hot);
        updateLine(tableData, myChart);
        updateFormula(tableData, moonForm, myChart);
    };

    // link chart to table
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    /**
     *  This part of code limits the maximum fps of the chart to change, so that it
     *  is possible to increase the sampling precision without hindering performance.
     */
    let lastChange = Date.now();
    let lock = false;

    let fps = 60;
    let frameTime = Math.floor(1000 / fps);

    // link chart to input form (slider + text)
    moonForm.oninput = function () {
        if (Date.now() - lastChange > frameTime) {
            // Immediate update.
            updateFormula(tableData, moonForm, myChart);
            lock = false;
            lastChange = Date.now();
        } else if (!lock) {
            // Delayed update to ensure the newest changes are recorded.
            setTimeout(function () {
                updateFormula(tableData, moonForm, myChart);
                lock = false;
                lastChange = Date.now();
            }, frameTime);
            lock = true;
        }
    };

    updateLine(tableData, myChart);
    updateFormula(tableData, moonForm, myChart);
    
    myChart.options.title.text = "Title"
    myChart.options.scales.xAxes[0].scaleLabel.labelString = "x";
    myChart.options.scales.yAxes[0].scaleLabel.labelString = "y";
    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}

/**
 *  This function takes a form to obtain the 4 parameters (a, p, phase, tilt) that determines the
 *  relationship between a moon's angular distance and Julian date, and generates a dataset that
 *  spans over the range determined by the max and min value present in the table.
 *  @param table:   A table used to determine the max and min value for the range
 *  @param form:    A form containing the 4 parameters (amplitude, period, phase, tilt)
 *  @param chart:   The Chartjs object to be updated.
 */
function updateFormula(table, form, chart) {
    // Can't just set min and max to the first values in the table because it might be invalid
    let min = null;
    let max = null;
    for (let i = 0; i < table.length; i++) {
        let x = table[i]['x'];
        let y = table[i]['y'];
        if (x === '' || y === '' || x === null || y === null) {
            continue;
        }
        if (max === null || x > max) {
            max = x;
        }
        if (min === null || x < min) {
            min = x;
        }
    }
    chart.data.datasets[1].data = trigGenerator(
        form.elements['a-num'].value,
        form.elements['p-num'].value,
        form.elements['phase-num'].value,
        form.elements['tilt-num'].value,
        min - 2,
        max + 2,
        2000
    );
    chart.update(0);
}

/**
*  This function links a <input type="range"> and a <input type="number"> together so changing the value
*  of one updates the other. This function also sets the min, max and step properties for both the inputs.
*  @param slider:  A <input type="range"> to be linked.
*  @param number:  A <input type"number"> to be linked.
*  @param min:     The min value for both inputs.
*  @param max:     The max value for both inputs.
*  @param step:    The step of changes for both inputs.
*  @param value:   The initial value of both inputs.
*  @param log:     A true or false value that determines whether the slider uses logarithmic scale.
*/
function linkInputs(slider, number, min, max, step, value, log = false) {
    number.min = min;
    number.max = max;
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
            slider.value = number.value;
        };
    } else {
        slider.min = Math.log(min * 0.999);
        slider.max = Math.log(max * 1.001);
        slider.step = (Math.log(max) - Math.log(min)) / ((max - min) / step);
        slider.value = Math.log(value);
        slider.oninput = function () {
            let x = Math.exp(slider.value);
            if (x > max) {
                number.value = max;
            } else if (x < min) {
                number.value = min;
            } else {
                number.value = round(x, 2);
            }
        };
        number.oninput = function () {
            slider.value = Math.log(number.value);
        }
    }
}

/**
*  This function generates the data used for function "updateFormula" with the four parameters provided.
*
*  @param a:       Amplitude of the moon's orbit
*  @param p:       The period of the moon's orbit
*  @param phase:   The phase of the orbit
*  @param tilt:    The tilt of the orbit
*  @param start:   The starting point of the data points
*  @param end:     The end point of the data points
*  @param steps:   Steps generated to be returned in the array. Default is 500
*  @returns {Array}
*/
function trigGenerator(a, p, phase, tilt, start, end, steps = 500) {
    let data = [];
    let x = start;
    let step = (end - start) / steps;
    for (let i = 0; i < steps; i++) {
        let theta = (x - start - 2) / p * Math.PI * 2 - rad(phase);
        let alpha = rad(tilt);
        data.push({
            x: x,
            // y = a * sqrt(cos(theta)^2 + sin(theta)^2 * sin(alpha)^2)
            y: a * Math.sqrt(sqr(Math.cos(theta)) + sqr(Math.sin(theta)) * sqr(Math.sin(alpha))),
        });
        x += step;
    }
    return data;
}

/**
*  This function returns an array of data points that represent a moon's orbit with randomly
*  generated parameters. This function also introduce a 5% noise to all data points.
*  @returns    {Array}
*/
function generateMoonData() {
    /**
     *  ln(750) = 6.62
     *  ln(1) = 0
     */
    let a = Math.exp(Math.random() * 4 + 1.62);
    let p = Math.random() * 10 + 5;
    let phase = Math.random() * 360;
    let tilt = Math.random() * 45;

    let returnData = [];

    for (let i = 0; i < 10; i++) {
        let x = i * 2 + Math.random() * 2;
        let theta = x / p * Math.PI * 2 - rad(phase);
        let alpha = rad(tilt);
        returnData[i] = {
            x: x,
            y: (a * Math.sqrt(sqr(Math.cos(theta)) + sqr(Math.sin(theta)) * sqr(Math.sin(alpha))))
                * (1 + Math.random() * 0.05),
        }
    }

    console.log('Cheat code:', round(a, 2), round(p, 2), round(phase, 0), round(tilt, 0));
    return returnData;
}
