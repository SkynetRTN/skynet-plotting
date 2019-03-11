'use strict';

/**
 * TODO: Redesign the page, makes the left side a lifted space with chart type selection at top
 * and all data input. The right side would have the chart related operations. Remove the headings
 * "Data" and "Chart", and add a title bar at the top of the page.
 */

// The hexToDecimal() function only accepts lower case (can make it supports upper case)
const colors = {
    'blue':     '#41a3d1',
    'red':      '#cf4e49',
    'yellow':   '#ced139',
    'purple':   '#c382d1',
    'gray':     '#9a9a9a',
    'orange':   '#ff8e21',
    'bright':   '#ffee51',
    'white':    '#ffffff',
    'black':    '#000000',
};

const tableCommonOptions = {
    rowHeights: 23,
    columnHeaderHeight: 26,
    rowHeaders: true,
    width: '100%',
    stretchH: 'all',
    contextMenu: [
        'undo',
        'redo',
        '---------',
        'row_above',
        'row_below',
        '---------',
        'remove_row'
    ],
    fillHandle: {
        autoInsertRow: true,
    },
};

let init = function () {
    let form = document.getElementById('chart-type-form');
    form.onchange = function () {
        chartType(form.elements['chart'].value);
    };
    chartType(form.elements['chart'].value);

    // Following code for working with Edge
    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {
                let dataURL = this.toDataURL(type, quality).split(',')[1];
                setTimeout(function() {
                    let binStr = atob( dataURL ),
                        len = binStr.length,
                        arr = new Uint8Array(len);
                    for (let i = 0; i < len; i++ ) {
                        arr[i] = binStr.charCodeAt(i);
                    }
                    callback( new Blob( [arr], {type: type || 'image/png'} ) );
                });
            }
        });
    }
};

window.onload = init;

function chartType(chart) {
    // rewrite HTML content of table & chart
    document.getElementById('input-div').innerHTML = '';
    document.getElementById('table-div').innerHTML = '';
    document.getElementById("chart-div").innerHTML =
        '<canvas id="myChart" width="300" height="200"></canvas>\n';

    // Enabling download function
    document.getElementById('save-button').onclick = function () {
        let canvas = document.getElementById('myChart');

        // Create a dummy canvas
        let destinationCanvas = document.createElement("canvas");
        destinationCanvas.width = canvas.width;
        destinationCanvas.height = canvas.height;

        let destCtx = destinationCanvas.getContext('2d');

        // Create a rectangle with the desired color
        destCtx.fillStyle = "#FFFFFF";
        destCtx.fillRect(0,0, canvas.width, canvas.height);

        // Draw the original canvas onto the destination canvas
        destCtx.drawImage(canvas, 0, 0);

        // Download the dummy canvas
        destinationCanvas.toBlob(function(blob) {
            saveAs(blob, "chart.png");
        });
    };

    let objects;

    if (chart === "curve") {
        objects = curve();
    } else if (chart === "moon") {
        objects = moon();
    } else if (chart === "scatter") {
        objects = scatter();
    } else if (chart === "venus") {
        objects = venus();
    } else {
        objects = dual();
    }

    updateTableHeight(objects[0]);
    initializeChart(objects[1], objects[0]);

    /**
     * TODO: Find a way to align add-row-button while still putting it directly below
     * the table element, so that in smaller screen it will be next to the table instead
     * of being under the chart with the save-button.
     */
    let addRow = document.getElementById('add-row-button');
    addRow.onclick = function () {
        objects[0].alter('insert_row');
        updateTableHeight(objects[0]);
    };

    let chartInfoForm = document.getElementById('chart-info-form');
    chartInfoForm.oninput = function () {
        updateChartInfo(objects[1], chartInfoForm);
    };
    updateChartInfo(objects[1], chartInfoForm);
}

function curve() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Lines" id="line-form" style="padding-bottom: 1em">\n' +
            '<div class="flex-container">\n' +
                '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="1" checked><span>1</span></label></div>\n' +
                '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="2"><span>2</span></label></div>\n' +
                '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="3"><span>3</span></label></div>\n' +
                '<div class="flex-item-grow1"><label><input type="radio" name="lineCount" value="4"><span>4</span></label></div>\n' +
                '<div class="flex-item-grow0"><label><input type="checkbox" name="magnitude"><span>Magnitudes</span></label></div>\n' +
            '</div>' +
        '</form>\n');

    let lineForm = document.getElementById('line-form');

    let lines = 1;

    let tableData = [
        {x: 0,  y1: 25, y2: '', y3: '', y4: ''},
        {x: 1,  y1: 16, y2: '', y3: '', y4: ''},
        {x: 2,  y1: 9,  y2: '', y3: '', y4: ''},
        {x: 3,  y1: 4,  y2: '', y3: '', y4: ''},
        {x: 4,  y1: 1,  y2: '', y3: '', y4: ''},
        {x: 5,  y1: 4,  y2: '', y3: '', y4: ''},
        {x: 6,  y1: 9,  y2: '', y3: '', y4: ''},
        {x: 7,  y1: 16, y2: '', y3: '', y4: ''},
        {x: 8,  y1: 25, y2: '', y3: '', y4: ''},
        {x: 9,  y1: 36, y2: '', y3: '', y4: ''},
        {x: '', y1: '', y2: '', y3: '', y4: ''},
        {x: '', y1: '', y2: '', y3: '', y4: ''},
        {x: '', y1: '', y2: '', y3: '', y4: ''},
        {x: '', y1: '', y2: '', y3: '', y4: ''},
        {x: '', y1: '', y2: '', y3: '', y4: ''},
    ];

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['x', 'y1', 'y2', 'y3', 'y4'],
        maxCols: 5,
        columns: [
            {data: 'x',  type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y1', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'y1',
                    data: chartData[0],
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: false,
                    immutableLabel: false,
                }, {
                    label: 'y2',
                    data: chartData[1],
                    borderColor: rgbString(colors['red']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }, {
                    label: 'y3',
                    data: chartData[2],
                    borderColor: rgbString(colors['purple']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }, {
                    label: 'y4',
                    data: chartData[3],
                    borderColor: rgbString(colors['orange']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: true,
                    immutableLabel: false,
                }
            ]
        },
        options: {
            hover: {
                mode: 'nearest'
            },
            legend: {
                onClick: function (e) {
                    e.stopPropagation();
                },
                labels: {
                    filter: function (legendItem, chartData) {
                        return !legendItem.hidden;
                    }
                }
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
                yAxes: [{
                    ticks: {
                        reverse: false,
                    }
                }]
            }
        }
    });

    let update = function () {
        updateTableHeight(hot);
        for (let i = 0; i < lines; i++) {
            updateLine(tableData, myChart, i, 'x', 'y' + (i+1));
        }
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
    });

    updateLine(tableData, myChart, 0, 'x', 'y1');
    updateLabels(myChart, document.getElementById('chart-info-form'));

    lineForm.onchange = function () {
        myChart.options.scales.yAxes[0].ticks.reverse = lineForm.elements['magnitude'].checked;
        let lineCount = lineForm.elements['lineCount'].value;
        if (lineCount !== lines) {
            let newCols = [{data: 'x',  type: 'numeric', numericFormat: {pattern: {mantissa: 2}}}];
            for (let i = 0; i < lineCount; i++) {
                newCols.push({
                    data: 'y' + (i+1), type: 'numeric', numericFormat: {pattern: {mantissa: 2}}
                });
            }

            // Turning off stretchH and then turn it back on -- a workaround
            //   to fix the horizontal scroll bar issue when adding more cols.
            hot.updateSettings({
                stretchH: 'none',
            });
            hot.updateSettings({
                columns: newCols,
            });
            hot.updateSettings({
                stretchH: 'all',
            });
            for (let i = 0; i < 4; i++) {
                myChart.data.datasets[i].hidden = (i >= lineCount);
            }
            lines = lineCount;
            for (let i = 0; i < lines; i++) {
                updateLine(tableData, myChart, i, 'x', 'y' + (i+1));
            }
        }
        myChart.update(0);
        updateLabels(myChart, document.getElementById('chart-info-form'));
    };

    return [hot, myChart];
}

function moon() {
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
    console.log(tableData);

    let chartData = [];
    let formula = [];

    // create table
    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Julian Date', 'Angular Distance'],
        maxCols: 2,
        columns: [
            {data: 'x', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
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
                    backgroundColor: rgbString(colors['red']),
                    fill: false,
                    showLine: false,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    immutableLabel: false,
                }, {
                    label: 'Prediction',
                    data: formula,
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['white'], 0),
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
    });

    // link chart to input form (slider + text)
    moonForm.oninput = function () {
        updateFormula(tableData, moonForm, myChart);
    };

    updateLine(tableData, myChart);
    updateFormula(tableData, moonForm, myChart);

    return [hot, myChart];
}

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
        500
    );
    chart.update(0);
}

function linkInputs(slider, number, min, max, step, value, log=false) {
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
        slider.step = (Math.log(max)-Math.log(min)) / ((max-min)/step);
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

function trigGenerator(a, p, phase, tilt, start, end, steps=500) {
    let data = [];
    let x = start;
    let step = (end - start) / steps;
    for (let i = 0; i < steps; i++) {
        let theta = x / p * Math.PI * 2 - rad(phase);
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

function scatter() {
    let tableData = [];
    for (let i = 0; i < 15; i++) {
        tableData[i] = {
            'lo': Math.random() * 40.0 - 20.0,
            'la': Math.random() * 40.0 - 20.0,
            'di': Math.random() * 20.0,
        };
    }

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Longitude', 'Latitude', 'Distance'],
        maxCols: 3,
        columns: [
            {data: 'lo', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'la', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'di', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Data',
                    data: chartData,
                    backgroundColor: rgbString(colors['orange']),
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    immutableLabel: false,
                }, {
                    label: 'Sun',
                    data: [{x: 0, y: 0}],
                    backgroundColor: rgbString(colors['bright']),
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    pointBorderWidth: 2,
                    immutableLabel: true,
                },
            ],
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
                    position: 'bottom'
                }]
            }
        }
    });

    let update = function () {
        updateScatter(tableData, myChart);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
    });

    updateScatter(tableData, myChart);

    return [hot, myChart];
}

function venus() {
    /**
     * The following lines are used for exploring the effect of changing x have in geocentric model.
     * The final value selected for rendering the chart is x = 0.445 (upper) and x = 0.8 (lower).
     * To use it enable the 'venusForm.oninput = function ()' part as well in the end of venus() function.
     */
    // document.getElementById('input-div').innerHTML =
    //     '<form title="Venus" id="venus-form">\n' +
    //         '<div class="row">\n' +
    //             '<div class="col-sm-2"><p>x</p></div>\n' +
    //             '<div class="col-sm-6"><input type="range" title="x" name="x"></div>\n' +
    //             '<div class="col-sm-4"><input type="number" title="x" name="x-num"></div>\n' +
    //         '</div>\n' +
    //     '</form>\n';

    // let venusForm = document.getElementById("venus-form");
    // linkInputs(venusForm.elements['x'], venusForm.elements['x-num'], 0.414, 1, 0.001, 0.5);

    let tableData = [
        {x: 15, y: 0.7},
        {x: 30, y: 0.53},
        {x: 45, y: 0.27},
        {x: 60, y: 0},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
    ];

    let chartData = [];

    // create table
    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Angular Diameter', 'Phase'],
        maxCols: 2,
        columns: [
            {data: 'x', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
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
                    backgroundColor: rgbString(colors['orange']),
                    fill: false,
                    showLine: false,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    immutableLabel: false,
                }, {
                    data: geocentric(10.15, 60, 0.8),
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                }, {
                    label: 'Geocentric',
                    data: geocentric(10.15, 60, 0.445),
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['blue'], 0.5),
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: '-1',
                    immutableLabel: true,
                }, {
                    label: 'Heliocentric',
                    data: heliocentric(10.15, 60),
                    borderColor: rgbString(colors['red']),
                    backgroundColor: rgbString(colors['white'], 0),
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
            legend: {
                labels: {
                    filter: function (legendItem, chartData) {
                        return legendItem.datasetIndex !== 1;
                    }
                }
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        suggestedMin: 5,
                        suggestedMax: 65,
                    }
                }],
                yAxes: [{
                    // stacked: true,
                    ticks: {
                        // suggestedMin: -2,
                    }
                }]
            }
        }
    });

    let update = function () {
        updateLine(tableData, myChart);
        updateTableHeight(hot);
    };

    // link chart to table
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
    });

    // venusForm.oninput = function () {
    //     myChart.data.datasets[1].data = geocentric(10, 60, venusForm.elements['x-num'].value);
    //     // console.log(geocentricData);
    //     myChart.update(0);
    // };

    updateLine(tableData, myChart);

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

function geocentric(start, end, x, steps=500) {
    let data = [];
    let a = start;
    let step = (end - start) / steps;
    for (let i = 0; i < steps; i++) {
        let d = (1 - x) * (1 - Math.sin(beta)) * maxA * dE / a;

        // In geocentric model dV is a variable, so we need to override it
        let dV = Math.sqrt((1 - x) * sqr(Math.sin(beta)) * sqr(dE) + x * sqr(dE) - x / (1 - x) * sqr(d));

        let cosPhi = (sqr(d) + sqr(dV) - sqr(dE)) / (2 * d * dV);

        data.push({
            x: a,
            y: (1 + cosPhi) / 2 > 0 ? (1 + cosPhi) / 2 : '',
        });
        a += step;
    }
    return data;
}

function heliocentric(start, end, steps=500) {
    let data = [];
    let a = start;
    let step = (end - start) / steps;
    for (let i = 0; i < steps; i++) {
        let theta = Math.acos((sqr(DV) / sqr(rad(a/3600)) - (sqr(dE) + sqr(dV))) / (2 * dE * dV));
        let alpha = Math.atan(dV*Math.sin(theta) / (dE + dV*Math.cos(theta)));
        data.push({
            x: a,
            y: (1 - Math.cos(Math.PI - theta + alpha))/ 2,

            // Below is the percentage of illumination of the whole observable surface,
            //   while the above is the actual phase calculation based on observed width over height.
            // y: (Math.PI - theta + alpha) / Math.PI,
        });
        a += step;
    }
    return data;
}

function dual() {
    let tableData = [
        {x1: 0, y1: 25, x2: 1, y2: Math.sqrt(100)},
        {x1: 1, y1: 16, x2: 2, y2: Math.sqrt(200)},
        {x1: 2, y1: 9, x2: 3, y2: Math.sqrt(300)},
        {x1: 3, y1: 4, x2: 4, y2: Math.sqrt(400)},
        {x1: 4, y1: 1, x2: 5, y2: Math.sqrt(500)},
        {x1: 5, y1: 4, x2: 6, y2: Math.sqrt(600)},
        {x1: 6, y1: 9, x2: 7, y2: Math.sqrt(700)},
        {x1: 7, y1: 16, x2: 8, y2: Math.sqrt(800)},
        {x1: 8, y1: 25, x2: 9, y2: Math.sqrt(900)},
        {x1: 9, y1: 36, x2: 10, y2: Math.sqrt(1000)},
        {x1: '', y1: '', x2: 11, y2: Math.sqrt(1100)},
        {x1: '', y1: '', x2: 12, y2: Math.sqrt(1200)},
        {x1: '', y1: '', x2: 13, y2: Math.sqrt(1300)},
        {x1: '', y1: '', x2: 14, y2: Math.sqrt(1400)},
        {x1: '', y1: '', x2: 15, y2: Math.sqrt(1500)},
    ];

    let chartData1 = [];
    let chartData2 = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['x1', 'y1', 'x2', 'y2'],
        maxCols: 4,
        columns: [
            {data: 'x1', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y1', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'x2', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y2', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'y1',
                    data: chartData1,
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: false,
                    immutableLabel: false,
                }, {
                    label: 'y2',
                    data: chartData2,
                    borderColor: rgbString(colors['red']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                    hidden: false,
                    immutableLabel: false,
                }
            ]
        },
        options: {
            hover: {
                mode: 'nearest'
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
            }
        }
    });

    let update = function () {
        updateDual(tableData, myChart, 0);
        updateDual(tableData, myChart, 1);
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
    });

    updateDual(tableData, myChart, 0);
    updateDual(tableData, myChart, 1);

    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}

const rowHeights = 23;
const columnHeaderHeight = 26;

function updateTableHeight(table) {
    let typeForm = document.getElementById('chart-type-form').clientHeight;
    let inputDiv = document.getElementById('input-div').clientHeight;
    let chartDiv = document.getElementById('chart-div').clientHeight;
    let infoForm = document.getElementById('chart-info-form').clientHeight;
    let minHeight = Math.min(5, table.countRows()) * rowHeights + columnHeaderHeight + 5;
    let maxHeight = Math.max(minHeight, chartDiv + infoForm - typeForm - inputDiv);

    let height = table.countRows() * rowHeights + columnHeaderHeight + 5;

    if (height > maxHeight) {
        height = maxHeight;
    }

    table.updateSettings({
        stretchH: 'none',
    });
    table.updateSettings({
        height: height,
    });
    table.updateSettings({
        stretchH: 'all',
    });
}

function initializeChart(chart, table) {
    chart.options.tooltips.mode = 'nearest';
    chart.options.tooltips.callbacks.title = function (tooltipItems, data) {
        return null;
    };
    chart.options.tooltips.callbacks.label = function (tooltipItem, data) {
        return '(' + round(tooltipItem.xLabel, 2) + ', ' +
            round(tooltipItem.yLabel, 2) + ')';
    };
    chart.options.legend.onClick = function (e) {
        e.stopPropagation();
    };
    chart.options.onResize = function () {
        updateTableHeight(table);
    }
}

function updateLine(table, myChart, dataSet=0, xKey='x', yKey='y') {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < table.length; i++) {
        if (table[i][xKey] === '' || table[i][yKey] === '') {
            continue;
        }
        chart[start++] = {x: table[i][xKey], y: table[i][yKey]};
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

function updateScatter(table, myChart) {
    let start = 0;
    let chart = myChart.data.datasets[0].data;
    for (let i = 0; i < table.length; i++) {
        let lo = table[i]['lo'];
        let la = table[i]['la'];
        let di = table[i]['di'];
        if (la === '' || lo === '' || di === '') {
            continue;
        }
        chart[start++] = {
            x: Math.cos(la / 180 * Math.PI) * di * Math.cos(lo / 180 * Math.PI),
            y: Math.cos(la / 180 * Math.PI) * di * Math.sin(lo / 180 * Math.PI),
        }
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

function updateDual(table, myChart, dataSet=0) {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < table.length; i++) {
        let xKey = 'x' + (dataSet + 1);
        let yKey = 'y' + (dataSet + 1);
        if (table[i][xKey] === '' || table[i][yKey] === '') {
            continue;
        }
        chart[start++] = {x: table[i][xKey], y: table[i][yKey]};
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

function rad(degree) {
    return degree / 180 * Math.PI;
}

function sqr(n) {
    return Math.pow(n, 2);
}

function round(value, digits) {
    return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
}

function rgbString(rgb, opacity=1) {
    let r = hexToDecimal(rgb, 1, 2);
    let g = hexToDecimal(rgb, 3, 4);
    let b = hexToDecimal(rgb, 5, 6);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
}

function hexToDecimal(hex, s, t) {
    let result = 0;
    for (let i = s; i <= t; i++) {
        result <<= 4;
        if (hex[i] >= '0' && hex[i] <='9') {
            result += hex[i].charCodeAt(0) - '0'.charCodeAt(0);
        } else {
            result += hex[i].charCodeAt(0) - 'a'.charCodeAt(0) + 10;
        }
    }
    return result;
}

function updateChartInfo(myChart, form) {
    myChart.options.title.display = true;
    myChart.options.title.fontSize = 18;
    myChart.options.title.fontColor = colors['black'];
    myChart.options.title.fontStyle = '';
    myChart.options.title.fontFamily = "'Lato', 'Arial', sans-serif";
    myChart.options.title.text = form.elements['title'].value;
    myChart.data.datasets[0].label = form.elements['data'].value;
    let labels = mySplit(form.elements['data'].value, ',');
    for (let i = 0; i < labels.length && i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].immutableLabel) {
            myChart.data.datasets[i].label = labels[i];
        }
    }
    myChart.options.scales.xAxes[0].scaleLabel.display = true;
    myChart.options.scales.xAxes[0].scaleLabel.labelString = form.elements['xAxis'].value;
    myChart.options.scales.yAxes[0].scaleLabel.display = true;
    myChart.options.scales.yAxes[0].scaleLabel.labelString = form.elements['yAxis'].value;
    myChart.update(0);
}

function updateLabels(myChart, form) {
    let labels = myChart.data.datasets[0].label;
    for (let i = 1; i < myChart.data.datasets.length; i++) {
        if (myChart.data.datasets[i].hidden === false && myChart.data.datasets[i].immutableLabel === false) {
            labels += ', ' + myChart.data.datasets[i].label;
        }
    }
    form.elements['data'].value = labels;
}

function mySplit(str, char) {
    let answer = [];
    let strings = str.split(char);
    for (let i = 0; i < strings.length; i++) {
        answer.push(removeSpaces(strings[i]));
    }
    return answer;
}

function removeSpaces(str) {
    let start = 0;
    let end = str.length - 1;
    while (start < str.length && str[start] === ' ') start++;
    while (end >= 0 && str[end] === ' ') end--;
    if (start === str.length) {
        return '';
    } else {
        return str.substr(start, end - start + 1);
    }
}