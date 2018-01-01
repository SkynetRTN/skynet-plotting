// const Jquery = require('jquery');
// const Bootstrap = require('bootstrap');
// const Chartjs = require('chart.js');
// const Handsontable = require('handsontable');
// const FileSaver = require('file-saver');

// initialize the page

"use strict";

const colors = {
    'blue':     '#41a3d1',
    'red':      '#cf4e49',
    'yellow':   '#ced139',
    'purple':   '#c382d1',
    'gray':     '#9a9a9b',
    'orange':   '#ff8e21',
    'bright':   '#ffee51',
    'white':    '#ffffff',
    'black':    '#000000',
};

const tableCommonOptions = {
    rowHeaders: true,
    height: 395,
    width: '100%',
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
    }
};

window.onload = function () {
    let form = document.getElementById('chart-type-form');
    form.onchange = function () {
        chartType(form.elements['chart'].value);
    };
    chartType(form.elements['chart'].value);
};

function chartType(chart) {
    // rewrite HTML content of table & chart
    document.getElementById('input-div').innerHTML = '';
    document.getElementById('table-div').innerHTML = '';
    document.getElementById("chart-div").innerHTML = '<h2>Chart</h2>\n' +
        '<canvas id="myChart" width="300" height="200"></canvas>\n';

    // Enabling download function
    document.getElementById('save-button').onclick = function () {
        let canvas = document.getElementById('myChart');
        canvas.toBlob(function(blob) {
            saveAs(blob, "chart.png");
        });
    };

    let objects;

    if (chart === "line") {
        objects = line();
    } else if (chart === "moon") {
        objects = moon();
    } else if (chart === "scatter") {
        objects = scatter();
    } else if (chart === "venus") {
        objects = venus();
    } else {
        objects = dual();
    }

    let addRow = document.getElementById('add-row-button');
    Handsontable.dom.addEvent(addRow, 'click', function () {
        objects[0].alter('insert_row');
    });
}

function line() {
    // TODO: add multi-line support.
    // document.getElementById('input-div').innerHTML =
    //     '<form title="line" id="line-form">\n' +
    //         '<input type="radio" name="" value="" ' +
    //     '</form>\n';
    //
    // let lines = 1;

    let tableData = [
        {x: 0, y: 25},
        {x: 1, y: 16},
        {x: 2, y: 9},
        {x: 3, y: 4},
        {x: 4, y: 1},
        {x: 5, y: 4},
        {x: 6, y: 9},
        {x: 7, y: 16},
        {x: 8, y: 25},
        {x: 9, y: 36},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
    ];

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['x', 'y'],
        maxCols: 2,
        columns: [
            {data: 'x', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
    }));

    let ctx = document.getElementById("myChart").getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'y value',
                data: chartData,
                borderColor: rgbString(colors['blue']),
                backgroundColor: rgbString(colors['white'], 0),
                borderWidth: 2,
                lineTension: 0.1,
                fill: false,
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
            }
        }
    });

    hot.updateSettings({
        afterChange: function () {
            updateLine(tableData, myChart);
        }
    });

    updateLine(tableData, myChart);

    return [hot, myChart];
}

function moon() {
    document.getElementById('input-div').innerHTML =
        '<form title="Moon" id="moon-form">\n' +
            '<div class="row">\n' +
                '<div class="col-sm-2"><p>a</p></div>\n' +
                '<div class="col-sm-6"><input type="range" title="a" name="a"></div>\n' +
                '<div class="col-sm-4"><input type="number" title="a" name="a-num">"</div>\n' +
            '</div>\n' +
            '<div class="row">\n' +
                '<div class="col-sm-2"><p>P</p></div>\n' +
                '<div class="col-sm-6"><input type="range" title="P" name="p"></div>\n' +
                '<div class="col-sm-4"><input type="number" title="P" name="p-num">d</div>\n' +
            '</div>\n' +
            '<div class="row">\n' +
                '<div class="col-sm-2"><p>Phase</p></div>\n' +
                '<div class="col-sm-6"><input type="range" title="Phase" name="phase"></div>\n' +
                '<div class="col-sm-4"><input type="number" title="Phase" name="phase-num">°</div>\n' +
            '</div>\n' +
            '<div class="row">\n' +
                '<div class="col-sm-2"><p>Tilt</p></div>\n' +
                '<div class="col-sm-6"><input type="range" title="Tilt" name="tilt"></div>\n' +
                '<div class="col-sm-4"><input type="number" title="Tilt" name="tilt-num"">°</div>\n' +
            '</div>\n' +
        '</form>\n';

    // Link each slider with corresponding text box
    let moonForm = document.getElementById("moon-form");
    linkInputs(moonForm.elements['a'], moonForm.elements['a-num'], 1, 750, 0.01, 30, true);
    linkInputs(moonForm.elements['p'], moonForm.elements['p-num'], 2, 20, 0.01, 10);
    linkInputs(moonForm.elements['phase'], moonForm.elements['phase-num'], 0, 360, 1, 0);
    linkInputs(moonForm.elements['tilt'], moonForm.elements['tilt-num'], 0, 90, 1, 0);

    let tableData = [
        {x: 1, y: Math.random() * 100 + 150},
        {x: 2, y: Math.random() * 100 + 150},
        {x: 3, y: Math.random() * 100 + 150},
        {x: 4, y: Math.random() * 100 + 150},
        {x: 5, y: Math.random() * 100 + 150},
        {x: 6, y: Math.random() * 100 + 150},
        {x: 7, y: Math.random() * 100 + 150},
        {x: 8, y: Math.random() * 100 + 150},
        {x: 9, y: Math.random() * 100 + 150},
        {x: 10, y: Math.random() * 100 + 150},
    ];

    let chartData = [];
    let formula = [];

    // create table
    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Julian Date', 'Distance'],
        maxCols: 2,
        columns: [
            {data: 'x', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'y', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
        ],
        height: 280,
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
                }, {
                    label: 'Prediction',
                    data: formula,
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: false,
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
            }
        }
    });

    // link chart to table
    hot.updateSettings({
        afterChange: function () {
            updateLine(tableData, myChart);
            updateFormula(tableData, moonForm, myChart);
        }
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
    let min = NaN;
    let max = NaN;
    for (let i = 0; i < table.length; i++) {
        if (table[i]['x'] === '' || table[i]['y'] === '') {
            continue;
        }
        if (table[i]['x'] > max || isNaN(max)) {
            max = table[i]['x'];
        }
        if (table[i]['x'] < min || isNaN(min)) {
            min = table[i]['x'];
            console.log('updated min at i = ' + i);
        }
    }
    console.log("min = " + min + " and max = " + max);
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
                number.value = x;
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
            y: a * Math.sqrt(Math.pow(Math.cos(theta), 2) +
                Math.pow(Math.sin(theta), 2) * Math.pow(Math.sin(alpha), 2)),
        });
        x += step;
    }
    return data;
}

function scatter() {
    let tableData = [];
    for (let i = 0; i < 15; i++) {
        tableData[i] = {
            'la': Math.random() * 40.0 - 20.0,
            'lo': Math.random() * 40.0 - 20.0,
            'di': Math.random() * 20.0,
        };
    }

    let chartData = [];

    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ['Latitude', 'Longitude', 'Distance'],
        maxCols: 3,
        columns: [
            {data: 'la', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
            {data: 'lo', type: 'numeric', numericFormat: {pattern: {mantissa: 2}}},
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
                }, {
                    label: 'Sun',
                    data: [{x: 0, y: 0}],
                    backgroundColor: rgbString(colors['bright']),
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    pointBorderWidth: 2,
                },
            ],
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }]
            }
        }
    });

    hot.updateSettings({
        afterChange: function () {
            updateScatter(tableData, myChart);
        }
    });

    updateScatter(tableData, myChart);

    return [hot, myChart];
}

function venus() {
    document.getElementById('input-div').innerHTML =
        '<form title="Venus" id="venus-form">\n' +
            '<div class="row">\n' +
                '<div class="col-sm-2"><p>x</p></div>\n' +
                '<div class="col-sm-6"><input type="range" title="x" name="x"></div>\n' +
                '<div class="col-sm-4"><input type="number" title="x" name="x-num">"</div>\n' +
            '</div>\n' +
        '</form>\n';

    let venusForm = document.getElementById("venus-form");
    linkInputs(venusForm.elements['x'], venusForm.elements['x-num'], 0.414, 1, 0.001, 0.5);

    let tableData = [
        {x: 15, y: 0.7},
        {x: 30, y: 0.53},
        {x: 45, y: 0.27},
        {x: 60, y: 0},
        {x: '', y: ''},
        {x: '', y: ''},
        {x: '', y: ''},
    ];

    let chartData = [];
    let geocentricData = geocentric(3, 60);
    let heliocentricData = heliocentric(3, 60);

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
        height: 280,
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
                }, {
                    // data: geocentricData[1],
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: false,
                }, {
                    label: 'Geocentric',
                    // data: geocentricData[0],
                    borderColor: rgbString(colors['blue']),
                    backgroundColor: rgbString(colors['blue'], 0.5),
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: '-1',
                }, {
                    label: 'Heliocentric',
                    data: heliocentricData,
                    borderColor: rgbString(colors['red']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    pointRadius: 0,
                    fill: false,
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
                yAxes: [{
                    // stacked: true,
                }]
            }
        }
    });

    // link chart to table
    hot.updateSettings({
        afterChange: function () {
            updateLine(tableData, myChart);
        }
    });

    venusForm.oninput = function () {
        geocentricData = geocentric(3, 60, venusForm.elements['x-num'].value);
        myChart.update(0);
    };

    updateLine(tableData, myChart);

    return [hot, myChart];
}

function geocentric(start, end, c, steps=500) {
    let top = [];
    let bot = [];
    let x = start;
    let step = (end - start) / steps;
    for (let i = 0; i < steps; i++) {
        top.push({
            x: x,
            y: Math.max(0.5 - Math.pow(x - 30, 2) / 1800, 0),
        });
        bot.push({
            x: x,
            y: Math.max(0.25 - Math.pow(x - 30, 2) / 3600, 0),
        });
        x += step;
    }
    return [top, bot];
}

function heliocentric(start, end, steps=500) {
    let data = [];
    let x = start;
    let step = (end - start) / steps;
    for (let i = 0; i < steps; i++) {
        let theta = Math.acos((1.4641 / Math.pow(rad(x/3600), 2) - 341640000) / 324000000);
        let alpha = Math.atan(108*Math.sin(theta) / (150 + 108*Math.cos(theta)));
        data.push({
            x: x,
            y: (1 - Math.cos(Math.PI - theta + alpha))/ 2,

            // Below is the percentage of illumination of the whole observable surface,
            //   while the above is the actual phase calculation based on observed width over height.
            // y: (Math.PI - theta + alpha) / Math.PI,
        });
        x += step;
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
                }, {
                    label: 'y2',
                    data: chartData2,
                    borderColor: rgbString(colors['red']),
                    backgroundColor: rgbString(colors['white'], 0),
                    borderWidth: 2,
                    lineTension: 0.1,
                    fill: false,
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                }],
            }
        }
    });

    hot.updateSettings({
        afterChange: function () {
            updateDual(tableData, myChart, 0);
            updateDual(tableData, myChart, 1);
        }
    });

    updateDual(tableData, myChart, 0);
    updateDual(tableData, myChart, 1);

    return [hot, myChart];
}

function updateLine(table, myChart, dataSet=0) {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < table.length; i++) {
        if (table[i]['x'] === '' || table[i]['y'] === '') {
            continue;
        }
        chart[start++] = {x: table[i]['x'], y: table[i]['y']};
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
        let la = table[i]['la'];
        let lo = table[i]['lo'];
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