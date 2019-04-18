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

/**
 * This function initialize the page when the website loads
 */
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
                setTimeout(function () {
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
        destCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the original canvas onto the destination canvas
        destCtx.drawImage(canvas, 0, 0);

        // // Download the dummy canvas
        // destinationCanvas.toBlob(function (blob) {
        //     saveAs(blob, "chart.png");
        // });

        let img = destinationCanvas.toDataURL('image/jpeg', 0.5);
        let dummyLink = document.createElement('a');
        dummyLink.href = img;
        dummyLink.download = 'chart.jpg';
        dummyLink.click();
    };
};

window.onload = init;

/**
 * This function runs once each time the type of the chart changes. It resets various parts of the page
 * (input field, table, and the chart) and initialize the components.
 * @param chart:    A string represents the type of chart to be rendered. This string comes from the
 *                  chart-type-form
 */
function chartType(chart) {
    // rewrite HTML content of table & chart
    document.getElementById('input-div').innerHTML = '';
    document.getElementById('table-div').innerHTML = '';
    document.getElementById("chart-div").innerHTML =
        '<canvas id="myChart" width="300" height="200"></canvas>\n';

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
    };

    let chartInfoForm = document.getElementById('chart-info-form');
    chartInfoForm.oninput = function () {
        updateChartInfo(objects[1], chartInfoForm);
    };
    updateChartInfo(objects[1], chartInfoForm);
}

/**
 * The function for up to 4 curves in the same chart. The curves share the same x values.
 * @returns {any[]}
 */
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
        afterCreateRow: update,
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
            hot.updateSettings({stretchH: 'none'});
            hot.updateSettings({columns: newCols});
            hot.updateSettings({stretchH: 'all'});

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

/**
 * This function is for the moon of a planet.
 * @returns {any[]}:
 */
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
        afterCreateRow: update,
    });

    // link chart to input form (slider + text)
    moonForm.oninput = function () {
        updateFormula(tableData, moonForm, myChart);
    };

    updateLine(tableData, myChart);
    updateFormula(tableData, moonForm, myChart);
    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}

/**
 * This function takes a form to obtain the 4 parameters (a, p, phase, tilt) that determines the
 * relationship between a moon's angular distance and Julian date, and generates a dataset that
 * spans over the range determined by the max and min value present in the table.
 * @param table:    A table used to determine the max and min value for the range
 * @param form:     A form containing the 4 parameters (amplitude, period, phase, tilt)
 * @param chart:    The Chartjs object to be updated.
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
        500
    );
    chart.update(0);
}

/**
 * This function links a <input type="range"> and a <input type="number"> together so changing the value
 * of one updates the other. This function also sets the min, max and step properties for both the inputs.
 * @param slider:   A <input type="range"> to be linked.
 * @param number:   A <input type"number"> to be linked.
 * @param min:      The min value for both inputs.
 * @param max:      The max value for both inputs.
 * @param step:     The step of changes for both inputs.
 * @param value:    The initial value of both inputs.
 * @param log:      A true or false value that determines whether the slider uses logarithmic scale.
 */
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

/**
 * This function generates the data used for function "updateFormula" with the four parameters provided.
 *
 * @param a:        Amplitude of the moon's orbit
 * @param p:        The period of the moon's orbit
 * @param phase:    The phase of the orbit
 * @param tilt:     The tilt of the orbit
 * @param start:    The starting point of the data points
 * @param end:      The end point of the data points
 * @param steps:    Steps generated to be returned in the array. Default is 500
 * @returns {Array}
 */
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

/**
 * This function returns an array of data points that represent a moon's orbit with randomly
 * generated parameters. This function also introduce a 5% noise to all data points.
 * @returns {Array}
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

/**
 * Function for scatter chart.
 * @returns {any[]}
 */
function scatter() {
    let tableData = [];
    for (let i = 0; i < 17; i++) {
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
        afterCreateRow: update,
    });

    updateScatter(tableData, myChart);
    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}

/**
 * Function for comparing data points with both Heliocentric and geocentric models.
 * @returns {any[]}
 */
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
        {x: '', y: ''},
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
        afterCreateRow: update,
    });

    // venusForm.oninput = function () {
    //     myChart.data.datasets[1].data = geocentric(10, 60, venusForm.elements['x-num'].value);
    //     // console.log(geocentricData);
    //     myChart.update(0);
    // };

    updateLine(tableData, myChart);
    updateLabels(myChart, document.getElementById('chart-info-form'));

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
 * This function generates the data points for the Geocentric model.
 * @param start:    The start point of data points.
 * @param end:      The end point of data points.
 * @param x:        The parameter x that represents the ratio of distance of Sun to Venus versus the
 *                  distance of Sun to Earth.
 * @param steps:    The number of data points to be generated. Default is 500.
 * @returns {Array}
 */
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

/**
 * This function generates the data points for the Heliocentric model.
 * @param start:    The start point of data points.
 * @param end:      The end point of data points.
 * @param steps:    The number of data points to be generated. Default is 500.
 * @returns {Array}
 */
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

/**
 * Function for two curves with independent x values.
 * @returns {any[]}
 */
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
        {x1: '', y1: '', x2: 16, y2: Math.sqrt(1600)},
        {x1: '', y1: '', x2: 17, y2: Math.sqrt(1700)},
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
        updateLine(tableData, myChart, 0, 'x1', 'y1');
        updateLine(tableData, myChart, 1, 'x2', 'y2');
        updateTableHeight(hot);
    };

    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    updateLine(tableData, myChart, 0, 'x1', 'y1');
    updateLine(tableData, myChart, 1, 'x2', 'y2');

    updateLabels(myChart, document.getElementById('chart-info-form'));

    return [hot, myChart];
}

const rowHeights = 23;
const columnHeaderHeight = 26;

/**
 * This function updates the height for the Handsontable object based on the number of rows it has.
 * The min and max height is set to be 5 rows and the height of the right side of the page, respectively.
 * @param table:    The Handsontable object whose height is to be updated.
 */
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

    table.updateSettings({stretchH: 'none',});
    table.updateSettings({height: height,});
    table.updateSettings({stretchH: 'all',
    });
}

/**
 * This function initializes some settings for the chart and table objects. It runs once with chartType
 * each time the type of chart changes
 * @param chart:    The Chartjs object
 * @param table:    The Handsontable object
 */
function initializeChart(chart, table) {
    // Setting properties about the title.
    chart.options.title.display = true;
    chart.options.title.fontSize = 18;
    chart.options.title.fontColor = colors['black'];
    chart.options.title.fontStyle = '';
    chart.options.title.fontFamily = "'Lato', 'Arial', sans-serif";

    // Setting properties about the tooltips
    chart.options.tooltips.mode = 'nearest';
    chart.options.tooltips.callbacks.title = function (tooltipItems, data) {
        return null;
    };
    chart.options.tooltips.callbacks.label = function (tooltipItem, data) {
        return '(' + round(tooltipItem.xLabel, 2) + ', ' +
            round(tooltipItem.yLabel, 2) + ')';
    };

    // Disable hiding datasets by clicking their label in the legends.
    chart.options.legend.onClick = function (e) {
        e.stopPropagation();
    };

    // Enable axes labeling
    chart.options.scales.xAxes[0].scaleLabel.display = true;
    chart.options.scales.yAxes[0].scaleLabel.display = true;

    // Update the height of the table when the chart resizes.
    chart.options.onResize = function () {
        updateTableHeight(table);
    }
}

/**
 * This function takes the data in a dictionary object and updates a Chartjs object with the data. The
 * dataset number for the Chartjs object and the keys for the x and y values are given in order to
 * correctly update when there are multiple datasets in the Chartjs object or in the dictionary.
 * @param table:    The dictionary object that provides data
 * @param myChart:  The Chartjs object
 * @param dataSet:  The number of line to be updated in the Chartjs object.
 * @param xKey:     The key for x values in the dictionary.
 * @param yKey:     The key for y values in the dictionary.
 */
function updateLine(table, myChart, dataSet=0, xKey='x', yKey='y') {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    for (let i = 0; i < table.length; i++) {
        if (table[i][xKey] === '' || table[i][yKey] === '' ||
            table[i][xKey] === null || table[i][yKey] === null) {
            continue;
        }
        chart[start++] = {x: table[i][xKey], y: table[i][yKey]};
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}

/**
 * This function is similar to updateLine but transforms longitude, latitude and distance to x and y
 * coordinates to be rendered in the chart.
 * @param table:    The dictionary object holding longitude, latitude and distance
 * @param myChart:  The Chartjs object to be updated.
 */
function updateScatter(table, myChart) {
    let start = 0;

    // The initial value of mins and maxs are 0 becaues the Sun is located at (0, 0)
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;

    let chart = myChart.data.datasets[0].data;
    for (let i = 0; i < table.length; i++) {
        let lo = table[i]['lo'];
        let la = table[i]['la'];
        let di = table[i]['di'];
        if (la === '' || lo === '' || di === '' ||
            la === null || lo === null || di === null) {
            continue;
        }
        chart[start++] = {
            x: Math.cos(la / 180 * Math.PI) * di * Math.cos(lo / 180 * Math.PI),
            y: Math.cos(la / 180 * Math.PI) * di * Math.sin(lo / 180 * Math.PI),
        };

        minX = Math.min(chart[start - 1].x, minX);
        maxX = Math.max(chart[start - 1].x, maxX);
        minY = Math.min(chart[start - 1].y, minY);
        maxY = Math.max(chart[start - 1].y, maxY);
    }
    while (chart.length !== start) {
        chart.pop();
    }

    minX -= 3;
    maxX += 3;
    minY -= 3;
    maxY += 3;

    // This is the ratio of the length of X axis over the length of Y axis
    const screenRatio = 1.8;
    let dataRatio = (maxX - minX) / (maxY - minY);

    if (dataRatio < screenRatio) {
        let m = (maxX + minX) / 2;
        let d = (maxX - minX) / 2;
        maxX = m + d / dataRatio * screenRatio;
        minX = m - d / dataRatio * screenRatio;
    } else {
        let m = (maxY + minY) / 2;
        let d = (maxY - minY) / 2;
        maxY = m + d * dataRatio / screenRatio;
        minY = m - d * dataRatio / screenRatio;
    }

    myChart.options.scales.xAxes[0].ticks.min = Math.floor(minX);
    myChart.options.scales.xAxes[0].ticks.max = Math.ceil(maxX);
    myChart.options.scales.yAxes[0].ticks.min = Math.floor(minY);
    myChart.options.scales.yAxes[0].ticks.max = Math.ceil(maxY);
    myChart.options.scales.xAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);
    myChart.options.scales.yAxes[0].ticks.stepSize = Math.ceil((maxY - minY) / 7);

    myChart.update(0);
}

/**
 * This function takes a Chartjs object and a form containing information (Title, data labels, X axis label,
 * Y axis label) about the chart, and updates corresponding properties of the chart.
 * @param myChart:  The Chartjs object to be updated.
 * @param form:     The form containing information about the chart.
 */
function updateChartInfo(myChart, form) {
    myChart.options.title.text = form.elements['title'].value;
    let labels = mySplit(form.elements['data'].value, ',');
    for (let i = 0; i < labels.length && i < myChart.data.datasets.length; i++) {
        if (!myChart.data.datasets[i].immutableLabel) {
            myChart.data.datasets[i].label = labels[i];
        }
    }
    myChart.options.scales.xAxes[0].scaleLabel.labelString = form.elements['xAxis'].value;
    myChart.options.scales.yAxes[0].scaleLabel.labelString = form.elements['yAxis'].value;
    myChart.update(0);
}

/**
 * This function is similar to the updateChartInfo function but takes the labels from the chart and updates
 * the the data property of the form with the labels.
 * @param myChart:  The Chartjs object
 * @param form:     The form to be updated.
 */
function updateLabels(myChart, form) {
    let labels = myChart.data.datasets[0].label;
    for (let i = 1; i < myChart.data.datasets.length; i++) {
        if (myChart.data.datasets[i].hidden === false && myChart.data.datasets[i].immutableLabel === false) {
            labels += ', ' + myChart.data.datasets[i].label;
        }
    }
    form.elements['data'].value = labels;
}

/**
 * This function split a string into several strings separated by a specified character. Leading and trailing
 * spaces of each separated string are removed.
 * @param str:      The string to be slitted.
 * @param char:     The character used to separate strings.
 * @returns {Array}
 */
function mySplit(str, char) {
    let answer = [];
    let strings = str.split(char);
    for (let i = 0; i < strings.length; i++) {
        answer.push(removeSpaces(strings[i]));
    }
    return answer;
}

/**
 * Remove the leading and trailing spaces of a given string.
 * @param str:      The string whose leading and trailing spaces are to be removed.
 * @returns {string}
 */
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

/**
 * This function takes a string containing a hexadecimal number and return a rgb string represented
 * by the value of rgb.
 * @param rgb:      A string containing a hexadecimal number which represents a rgb value.
 * @param opacity:  Opacity of the returned rgb string. Default is 1.
 * @returns {string}
 */
function rgbString(rgb, opacity=1) {
    let r = hexToDecimal(rgb, 1, 2);
    let g = hexToDecimal(rgb, 3, 4);
    let b = hexToDecimal(rgb, 5, 6);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
}

/**
 * This function takes a portion of string which contains a hexadecimal number and returns a decimal
 * number of the same value with the hex number.
 * @param hex:      The whole string.
 * @param s:        The starting position of the portion of the string. Inclusive.
 * @param t:        The ending position of the portion of the string. Inclusive.
 * @returns {number}
 */
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

/**
 * This function takes an angle in degrees and returns it in radians.
 * @param degree:   An angle in degrees
 * @returns {number}
 */
function rad(degree) {
    return degree / 180 * Math.PI;
}

/**
 * This function returns the square of the input n.
 * @param n:        The input number to be squared.
 * @returns {number}
 */
function sqr(n) {
    return Math.pow(n, 2);
}

/**
 * This function takes a floating point number and round it to a specified decimal places.
 * @param value:    The value to be rounded.
 * @param digits:   The decimal places to round the value.
 * @returns {number}
 */
function round(value, digits) {
    return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
}