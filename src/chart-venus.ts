'use strict';

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import { ChartConfiguration, ScatterDataPoint } from "chart.js";

import { tableCommonOptions, colors } from "./config"
import { updateLine, updateLabels, updateTableHeight } from "./util"
import { sqr, rad } from "./my-math"

/**
 *  Function for comparing data points with both Heliocentric and geocentric models.
 *  @returns {[Handsontable, Chart]}
 */
export function venus(): [Handsontable, Chart] {
    /**
     *  The following lines are used for exploring the effect of changing x have in geocentric model.
     *  The final value selected for rendering the chart is x = 0.445 (upper) and x = 0.8 (lower).
     */
    // document.getElementById('input-div').innerHTML =
    //     '<form title="Venus" id="venus-form">\n' +
    //         '<div class="row">\n' +
    //             '<div class="col-sm-2"><p>x</p></div>\n' +
    //             '<div class="col-sm-6"><input type="range" title="x" name="x"></div>\n' +
    //             '<div class="col-sm-4"><input type="number" title="x" name="x-num"></div>\n' +
    //         '</div>\n' +
    //     '</form>\n';

    // const venusForm = document.getElementById("venus-form");
    // linkInputs(venusForm.elements['x'], venusForm.elements['x-num'], 0.414, 1, 0.001, 0.5);

    // venusForm.oninput = function () {
    //     myChart.data.datasets[1].data = geocentric(10, 60, venusForm.elements['x-num'].value);
    //     // console.log(geocentricData);
    //     myChart.update('none');
    // };
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    const tableData = [
        { x: 15, y: 0.7 },
        { x: 30, y: 0.53 },
        { x: 45, y: 0.27 },
        { x: 60, y: 0 },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
        { x: '', y: '' },
    ];

    // create table
    const container = document.getElementById('table-div');
    const tableOptions: Handsontable.GridSettings = {
        data: tableData,
        colHeaders: ['Angular Diameter', 'Phase of Venus'],
        maxCols: 2,
        columns: [
            { data: 'x', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'y', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
    };
    const hot = new Handsontable(container, { ...tableCommonOptions, ...tableOptions });

    // create chart
    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    const chartOptions: ChartConfiguration = {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Data',
                    data: [],
                    backgroundColor: colors['orange'],
                    fill: false,
                    showLine: false,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    immutableLabel: false,
                }, {
                    data: geocentric(10.15, 60, 0.8),
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                }, {
                    label: 'Geocentric',
                    data: geocentric(10.15, 60, 0.445),
                    borderColor: colors['blue'],
                    backgroundColor: colors['blue-0.5'],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: '-1',
                    immutableLabel: true,
                }, {
                    label: 'Heliocentric',
                    data: heliocentric(10.15, 60),
                    borderColor: colors['red'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
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
            plugins: {
                legend: {
                    labels: {
                        filter: function (legendItem) {
                            return legendItem.datasetIndex !== 1;
                        }
                    }
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    suggestedMin: 5,
                    suggestedMax: 65,
                }
            }
        }
    };
    const myChart = new Chart(ctx, chartOptions) as Chart<'line'>;

    const update = function () {
        updateLine(tableData, myChart);
        updateTableHeight(hot);
    };

    // link chart to table
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    updateLine(tableData, myChart);

    myChart.options.plugins.title.text = "Title";
    myChart.options.scales['x'].title.text = "x";
    myChart.options.scales['y'].title.text = "y";
    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);

    return [hot, myChart];
}

// Distance from Sun to Earth in km
const dE = 1.496e8;
// Distance from Sun to Venus in km
const dV = 1.082e8;
// Diameter of Venus in km
const DV = 1.210e4;
// Max angular separation between Venus and Sun in radians.
const beta = rad(45);
// Angular diameter of Venus as its closest in arc-seconds.
const maxA = 60;

/**
*  This function generates the data points for the Geocentric model.
*  @param start:   The start point of data points.
*  @param end:     The end point of data points.
*  @param x:       The parameter x that represents the ratio of distance of Sun to Venus versus the
*                  distance of Sun to Earth.
*  @param steps:   The number of data points to be generated. Default is 500.
*  @returns {Array}
*/
function geocentric(start: number, end: number, x: number, steps: number = 500): ScatterDataPoint[] {
    const data: ScatterDataPoint[] = [];
    const step = (end - start) / steps;

    let a = start;
    for (let i = 0; i < steps; i++) {
        const d: number = (1 - x) * (1 - Math.sin(beta)) * maxA * dE / a;

        // In geocentric model dV is a variable, so we need to override it
        const dV: number = Math.sqrt((1 - x) * sqr(Math.sin(beta)) * sqr(dE) + x * sqr(dE) - x / (1 - x) * sqr(d));
        const cosPhi: number = (sqr(d) + sqr(dV) - sqr(dE)) / (2 * d * dV);

        data.push({
            x: a,
            y: (1 + cosPhi) / 2 > 0 ? (1 + cosPhi) / 2 : 0,
            // How is below different from above????
            // y: Math.max((1 + cosPhi) / 2, 0) // this doesn't work. I'm so confused
        });
        a += step;
    }
    return data;
}

/**
*  This function generates the data points for the Heliocentric model.
*  @param start:   The start point of data points.
*  @param end:     The end point of data points.
*  @param steps:   The number of data points to be generated. Default is 500.
*  @returns {Array}
*/
function heliocentric(start: number, end: number, steps: number = 500): ScatterDataPoint[] {
    const data: ScatterDataPoint[] = [];
    const step = (end - start) / steps;

    let a = start;
    for (let i = 0; i < steps; i++) {
        const theta = Math.acos((sqr(DV) / sqr(rad(a / 3600)) - (sqr(dE) + sqr(dV))) / (2 * dE * dV));
        const alpha = Math.atan(dV * Math.sin(theta) / (dE + dV * Math.cos(theta)));
        data.push({
            x: a,
            y: (1 - Math.cos(Math.PI - theta + alpha)) / 2,

            // Below is the percentage of illumination of the whole observable surface,
            //   while the above is the actual phase calculation based on observed width over height.
            // y: (Math.PI - theta + alpha) / Math.PI,
        });
        a += step;
    }
    return data;
}