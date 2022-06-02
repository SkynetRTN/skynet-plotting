'use strict';

import Chart, { ScatterDataPoint } from "chart.js/auto";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config"
import { updateLine, updateLabels, updateTableHeight, linkInputs, throttle } from "./util"
import {sqr, rad } from "./my-math"

/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart]}:
 */
export function moon(): [Handsontable, Chart] {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Moon" id="moon-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">a ("):</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="a" name="a"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="a" name="a_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">P (d):</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="P" name="p"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="P" name="p_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">Phase (°):</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="Phase" name="phase"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Phase" name="phase_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-3 des">Tilt (°):</div>\n' +
        '<div class="col-sm-6 range"><input type="range" title="Tilt" name="tilt"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Tilt" name="tilt_num" class="field"></div>\n' +
        '</div>\n' +
        '</form>\n');
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y Axis";

    // Link each slider with corresponding text box
    const moonForm = document.getElementById("moon-form") as MoonForm;
    linkInputs(moonForm.elements['a'], moonForm.elements['a_num'], 1, 750, 0.01, 30, true);
    linkInputs(moonForm.elements['p'], moonForm.elements['p_num'], 0.5, 20, 0.01, 10, false, true, 0.5, Number.POSITIVE_INFINITY);
    linkInputs(moonForm.elements['phase'], moonForm.elements['phase_num'], 0, 360, 1, 0);
    linkInputs(moonForm.elements['tilt'], moonForm.elements['tilt_num'], 0, 90, 1, 0);

    const tableData = generateMoonData();

    // create table
    const container = document.getElementById('table-div');
    const hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Julian Date', 'Angular Separation'],
        maxCols: 2,
        columns: [
            { data: 'x', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    }));

    // create chart
    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Data',
                    data: [],
                    backgroundColor: colors['red'],
                    fill: false,
                    showLine: false,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    immutableLabel: false,
                }, {
                    label: 'Model',
                    data: [], // will be generated later
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                }
            ],
             
        },
        options: {
            hover: {
                mode: 'nearest'
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                },
                y: {
                    suggestedMin: 0,
                },
            }
        }
    });

    const update = function () {
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

    const fps = 100;
    const frameTime = Math.floor(1000 / fps);

    // link chart to input form (slider + text)
    const throttledUpdateFormula = throttle(updateFormula, frameTime);
    moonForm.oninput = function () {
        throttledUpdateFormula(tableData, moonForm, myChart);
    };

    updateLine(tableData, myChart);
    updateFormula(tableData, moonForm, myChart);

    myChart.options.plugins.title.text = "Title";
    myChart.options.scales['x'].title.text = "x";
    myChart.options.scales['y'].title.text = "y";
    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);

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
function updateFormula(table: ScatterDataPoint[], form: MoonForm, chart: Chart) {
    // Can't just set min and max to the first values in the table because it might be invalid
    let min = NaN;
    let max = NaN;
    for (let i = 0; i < table.length; i++) {
        const x = table[i]['x'];
        const y = table[i]['y'];
        if (isNaN(x) || isNaN(y) || x === null || y === null) {
            continue;
        }
        if (isNaN(max) || x > max) {
            max = x;
        }
        if (isNaN(min) || x < min) {
            min = x;
        }
    }
    chart.data.datasets[1].data = trigGenerator(
        parseFloat(form.elements['a_num'].value),
        parseFloat(form.elements['p_num'].value),
        parseFloat(form.elements['phase_num'].value),
        parseFloat(form.elements['tilt_num'].value),
        min - 2,
        max + 2,
        2000
    );
    chart.update('none');
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
function trigGenerator(a: number, p: number, phase: number, tilt: number, start: number, end: number, steps: number = 500): ScatterDataPoint[] {
    const data: ScatterDataPoint[] = [];
    const step = (end - start) / steps;

    let x = start;
    for (let i = 0; i < steps; i++) {
        const theta = (x - start - 2) / p * Math.PI * 2 - rad(phase);
        const alpha = rad(tilt);
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
function generateMoonData(): ScatterDataPoint[] {
    /**
     *  ln(750) = 6.62
     *  ln(1) = 0
     */
    const a = Math.exp(Math.random() * 4 + 1.62);
    const p = Math.random() * 10 + 5;
    const phase = Math.random() * 360;
    const tilt = Math.random() * 45;

    const returnData: ScatterDataPoint[] = [];

    for (let i = 0; i < 10; i++) {
        const x = i * 2 + Math.random() * 2;
        const theta = x / p * Math.PI * 2 - rad(phase);
        const alpha = rad(tilt);
        returnData[i] = {
            x: x,
            y: (a * Math.sqrt(sqr(Math.cos(theta)) + sqr(Math.sin(theta)) * sqr(Math.sin(alpha))))
                * (1 + Math.random() * 0.05),
        }
    }
    // console.log('Cheat code:', round(a, 2), round(p, 2), round(phase, 0), round(tilt, 0));
    return returnData;
}
