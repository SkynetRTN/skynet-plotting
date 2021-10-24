'use strict';

import { tableCommonOptions, colors } from "./config.js"
import { updateLabels, updateTableHeight } from "./util.js"
import { round, sqr, rad } from "./my-math.js"

/**
 *  This function is for the moon of a planet.
 *  @returns {any[]}:
 */
export function cluster() {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Cluster Diagram" id="cluster-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4 des">Dist. (kpc):</div>\n' +
        '<div class="col-sm-5 range"><input type="range" title="d" name="d"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="d" name="d-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4 des">+/- Range (%):</div>\n' +
        '<div class="col-sm-5 range"><input type="range" title="R" name="r"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="R" name="r-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4 des">log(Age (yr)):</div>\n' +
        '<div class="col-sm-5 range"><input type="range" title="Age" name="age"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Age" name="age-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4 des">Reddening (mag):</div>\n' +
        '<div class="col-sm-5 range"><input type="range" title="Reddening" name="red"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Reddening" name="red-num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-4 des">Metallicity (solar):</div>\n' +
        '<div class="col-sm-5 range"><input type="range" title="Metallicity" name="metal"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Metallicity" name="metal-num" class="field"></div>\n' +
        '</div>\n' +
        '</form>\n' +
        '<form title="Filters" id="filter-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6"><b>Select Filters:</b></div>\n' +
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
    linkInputs(clusterForm.elements['r'], clusterForm.elements['r-num'], 0, 100, 0.01, 100);
    linkInputs(clusterForm.elements['age'], clusterForm.elements['age-num'], 6, 11, 0.01, 6);
    linkInputs(clusterForm.elements['red'], clusterForm.elements['red-num'], 0, 1, 0.01, 0);
    linkInputs(clusterForm.elements['metal'], clusterForm.elements['metal-num'], -3, 1, 0.01, -3);

    let tableData = [
        { "r": 15.43097938, "b": 16.27826813 },
        { "r": 16.77254031, "b": 25.11862975 },
        { "r": 15.8596803, "b": 16.02283206 },
        { "r": 15.33731775, "b": 16.33344688 },
        { "r": 16.38859704, "b": 17.18360391 },
        { "r": 16.31949681, "b": 16.53544594 },
        { "r": 14.0629343, "b": 15.38553603 },
        { "r": 16.29534441, "b": 16.50974513 },
        { "r": 16.1657268, "b": 16.83575269 },
        { "r": 17.51460697, "b": 18.5984111 },
        { "r": 16.04886286, "b": 17.05094936 },
        { "r": 16.5769982, "b": 17.85338039 },
        { "r": 16.25836173, "b": 17.32776556 },
        { "r": 16.98460632, "b": 17.32776556 },
        { "r": 16.55678419, "b": 19.03864387 },
        { "r": 16.33446192, "b": 16.95786137 },
        { "r": 16.57383717, "b": 18.22282621 },
        { "r": 15.45454838, "b": 16.38287161 },
        { "r": '', "b": 18.64958716 },
        { "r": 17.03338599, "b": 17.18225861 },
        { "r": 15.67943013, "b": 17.06307599 },
        { "r": 15.58749498, "b": 16.25978671 },
        { "r": 17.22801358, "b": 19.11819362 },
        { "r": 15.58749498, "b": 16.25978671 },
        { "r": 13.73313678, "b": 15.09469488 },
        { "r": 17.88121272, "b": '' },
        { "r": 16.85434535, "b": 18.18845161 },
        { "r": 14.82866923, "b": 16.10561823 },
        { "r": 13.73313678, "b": 15.09469488 },
        { "r": 16.20261041, "b": 17.10551692 },
        { "r": 14.05584728, "b": 14.95406699 },
        { "r": 13.41512997, "b": 14.77205357 },
        { "r": 13.4150376, "b": 14.77142355 },
        { "r": 16.3081282, "b": 16.23340589 },
        { "r": 13.50782524, "b": 17.19386585 },
        { "r": 14.05584728, "b": 14.95406699 },
        { "r": 14.48228538, "b": 15.53284141 },
        { "r": 14.48228538, "b": 15.53284141 },
        { "r": 13.41512997, "b": 14.77205357 },
        { "r": 14.98742022, "b": 16.16161323 },
        { "r": '', "b": 17.3542598 },
        { "r": 14.48228538, "b": 15.53284141 },
        { "r": 14.82000979, "b": 15.50808964 },
        { "r": 13.50782524, "b": 14.93330301 },
        { "r": 14.23864951, "b": 15.36526562 },
        { "r": '', "b": 17.3542598 },
        { "r": '', "b": 21.88558586 },
        { "r": 15.88362032, "b": 16.99347154 },
        { "r": 16.59246742, "b": 18.63973181 },
        { "r": 18.74756052, "b": 18.43987184 },
        { "r": 18.79360112, "b": '' },
        { "r": '', "b": 17.3542598 },
        { "r": 13.85972628, "b": 15.04605293 },
        { "r": 12.99477704, "b": 14.33654336 },
        { "r": 13.44868484, "b": 15.13626032 },
        { "r": 13.85972628, "b": 15.04605293 },
        { "r": 16.64663172, "b": 16.52047654 },
        { "r": 13.44868484, "b": 15.13626032 },
        { "r": 15.2232312, "b": 16.59897296 },
        { "r": 13.80402188, "b": 15.24006842 },
        { "r": 16.95685979, "b": 18.65277628 },
        { "r": 13.85972628, "b": 15.04605293 },
        { "r": 15.93885734, "b": 16.68293062 },
        { "r": 12.99477704, "b": 14.33654336 },
        { "r": 14.81124663, "b": 16.13093644 },
        { "r": 14.88940903, "b": 15.75268685 },
        { "r": 18.34280539, "b": 21.27274425 },
        { "r": 13.80402188, "b": 15.24006842 },
        { "r": 17.19977299, "b": 15.41325092 },
        { "r": '', "b": 16.92714199 },
        { "r": 16.24101221, "b": 16.93271118 },
        { "r": 16.08172697, "b": 16.68293062 },
        { "r": 14.69924929, "b": 15.63058973 },
        { "r": 13.80402188, "b": 15.24006842 },
        { "r": 13.24179334, "b": 13.83144443 },
        { "r": 16.18894154, "b": 15.41325092 },
        { "r": 14.88940903, "b": 15.75268685 },
        { "r": 14.8531258, "b": 15.95426672 },
        { "r": 16.72466552, "b": 16.32461737 },
        { "r": 14.69924929, "b": '' },
        { "r": 14.52230024, "b": 15.84437243 },
        { "r": 15.92405784, "b": 16.98715997 },
        { "r": 15.05031888, "b": 16.18179559 },
        { "r": 18.09267371, "b": 18.58192812 },
        { "r": 15.51171659, "b": 15.72326776 },
        { "r": 16.60222305, "b": 16.03893106 },
        { "r": 14.56617257, "b": 15.41325092 },
        { "r": 16.06682967, "b": 17.07770783 },
        { "r": 16.45704176, "b": 16.90445332 },
        { "r": 15.67454005, "b": 16.05655379 },
        { "r": 14.8531258, "b": 15.95426672 },
        { "r": 16.45704176, "b": 16.90445332 },
        { "r": 21.08594604, "b": 17.49628014 },
        { "r": 14.69924929, "b": 15.63058973 },
        { "r": '', "b": 17.84698171 },
        { "r": 14.61864369, "b": 15.67788232 },
        { "r": 13.24179334, "b": 13.83144443 },
        { "r": 13.24179334, "b": 13.83144443 },
        { "r": 15.72682416, "b": 16.51716071 },
        { "r": 15.58326758, "b": 16.03031502 },
        { "r": 17.22909189, "b": 17.8896688 },
        { "r": 14.61864369, "b": 15.67788232 },
        { "r": 17.39615147, "b": 16.80733512 },
        { "r": 16.01539528, "b": 16.2342371 },
        { "r": 15.58326758, "b": 16.03031502 },
        { "r": 18.79203925, "b": 18.26028926 },
        { "r": 15.58326758, "b": 16.03031502 },
        { "r": 13.49905899, "b": 14.62940184 },
        { "r": 14.98669874, "b": 15.35993901 },
        { "r": 14.97756429, "b": '' },
        { "r": 13.82155931, "b": 14.47200105 },
        { "r": '', "b": 17.86970859 },
        { "r": 16.40612773, "b": 16.61646937 },
        { "r": 14.97756429, "b": 15.76702651 },
        { "r": 13.49905899, "b": 15.18299228 },
        { "r": 13.49905899, "b": 14.62940184 },
        { "r": 13.70930632, "b": 14.87941149 },
        { "r": 15.54511222, "b": 16.71033503 },
        { "r": 13.77453263, "b": 18.07248158 },
        { "r": 13.77453263, "b": 15.17212027 },
        { "r": 14.27431121, "b": 15.25671618 },
        { "r": 14.02803462, "b": 15.11422176 },
        { "r": 13.70930632, "b": 14.87941149 },
        { "r": 13.33085835, "b": 13.98467529 },
        { "r": 14.90694167, "b": 16.02144661 },
        { "r": 13.70930632, "b": 14.87941149 },
        { "r": 13.8372448, "b": 15.31225338 },
        { "r": '', "b": 16.57549536 },
        { "r": 14.02803462, "b": 15.11422176 },
        { "r": 16.96342168, "b": 19.18057963 },
        { "r": 14.37840351, "b": 15.04955875 },
        { "r": 15.25060087, "b": 21.08582186 },
        { "r": 16.41724172, "b": 17.10243209 },
        { "r": 16.47411586, "b": 17.91034943 },
        { "r": 15.25060087, "b": 16.57596516 },
        { "r": 14.37840351, "b": 15.0486841 },
        { "r": 13.8372448, "b": 15.31225338 },
        { "r": 16.53261597, "b": 18.81756806 },
        { "r": 14.84242564, "b": 15.93099465 },
        { "r": 18.28437793, "b": 17.15460615 },
        { "r": 16.53261597, "b": 18.81756806 },
        { "r": '', "b": 18.79026006 },
        { "r": '', "b": 17.92461728 },
        { "r": 13.13773957, "b": 15.0750296 },
        { "r": '', "b": 18.79026006 },
        { "r": 14.95902581, "b": 15.93054716 },
        { "r": 15.06917621, "b": 16.15735039 },
        { "r": 14.2347885, "b": 15.37820781 },
        { "r": 17.98635869, "b": 19.07238478 },
        { "r": 13.13773957, "b": 15.0750296 },
        { "r": 15.06917621, "b": 18.68626436 },
        { "r": 14.69189468, "b": 15.84163791 },
        { "r": 14.69189468, "b": 17.74147243 },
        { "r": 13.13773957, "b": 15.0750296 },
        { "r": 14.05725573, "b": 15.35865411 },
        { "r": 15.3533662, "b": 16.24543087 },
        { "r": 15.2558489, "b": 16.04229177 },
        { "r": 14.23841017, "b": 14.83887406 },
        { "r": 14.43720534, "b": 15.72291857 },
        { "r": '', "b": 23.42619755 },
        { "r": 16.32331101, "b": 16.67035321 },
        { "r": '', "b": 24.55117794 },
        { "r": 18.40699651, "b": 18.12856044 },
        { "r": 16.58143317, "b": 17.47876839 },
        { "r": 15.13527717, "b": 16.21270202 },
        { "r": '', "b": 25.39429629 },
        { "r": 15.80986892, "b": 16.89650921 },
        { "r": 13.90799577, "b": 15.11518485 },
        { "r": '', "b": 25.39429629 },
        { "r": 16.58143317, "b": 17.47876839 },
        { "r": '', "b": 24.55117794 },
        { "r": 18.33497755, "b": 18.12856044 },
        { "r": 14.13664216, "b": 15.56268401 },
        { "r": '', "b": 18.44553419 },
        { "r": 17.12470139, "b": 17.47506295 },
        { "r": 14.13664216, "b": 15.56268401 },
        { "r": 15.3112048, "b": 15.55115479 },
        { "r": 15.58917524, "b": 16.11254138 },
        { "r": 13.49960974, "b": 15.05117977 },
        { "r": 16.1203243, "b": 17.0695496 },
        { "r": 18.13568273, "b": 16.67549226 },
        { "r": 16.1203243, "b": 17.0695496 },
        { "r": 15.58917524, "b": 16.11254138 },
        { "r": 15.3112048, "b": 15.55115479 },
        { "r": '', "b": 18.23561866 },
        { "r": 16.17464756, "b": 17.69068621 },
        { "r": 13.33603931, "b": 15.07683153 },
        { "r": 16.83715169, "b": 17.33751497 },
        { "r": 13.04569612, "b": 14.47211794 },
        { "r": 16.04315762, "b": 16.88091123 },
        { "r": '', "b": 18.61413441 },
        { "r": 13.04569612, "b": 14.47211794 },
        { "r": 15.70786378, "b": 16.4406514 },
        { "r": 13.04569612, "b": 14.47211794 },
        { "r": 14.07870114, "b": 15.03124572 },
        { "r": 13.55230332, "b": 14.91182518 },
        { "r": 15.70786378, "b": 16.4406514 },
        { "r": 20.29622649, "b": 21.33380038 },
        { "r": 15.19615187, "b": 16.02070873 },
        { "r": 14.07870114, "b": 15.03124572 },
        { "r": 16.9743219, "b": 15.62688866 },
        { "r": 13.55230332, "b": 14.91182518 },
        { "r": 13.18718203, "b": 14.69238295 },
        { "r": 15.52584271, "b": 16.20351223 },
        { "r": '', "b": 20.37034632 },
        { "r": 15.97991765, "b": 17.5350865 },
        { "r": 15.90354203, "b": 16.59412282 },
        { "r": 14.07870114, "b": 15.03124572 },
        { "r": 14.02410856, "b": 15.12885013 },
        { "r": '', "b": 22.79532344 },
        { "r": 16.30601359, "b": 17.13647676 },
        { "r": 16.20178532, "b": 17.25270183 },
        { "r": 16.31932821, "b": 17.28118029 },
        { "r": 19.69219179, "b": '' },
        { "r": 17.91919503, "b": 20.68047585 },
        { "r": '', "b": 22.70010615 },
        { "r": 16.34308014, "b": 16.57115875 },
        { "r": 17.90855255, "b": '' },
        { "r": 17.84905512, "b": 19.31873402 },
        { "r": 16.74182906, "b": 19.49336918 },
        { "r": 15.98969122, "b": 17.19788018 },
        { "r": 14.48389827, "b": 15.37697935 },
        { "r": 17.59717916, "b": 18.3012353 },
        { "r": 18.74666131, "b": '' },
        { "r": 15.46912347, "b": 16.16041647 },
        { "r": 15.99515795, "b": 16.65227211 },
        { "r": 15.92543248, "b": 16.7860739 },
        { "r": 14.75814408, "b": 15.74677631 },
        { "r": 15.30698282, "b": 16.55804587 },
        { "r": 16.09043148, "b": 16.90277312 },
        { "r": 15.45418544, "b": 16.22666318 },
        { "r": 16.48585897, "b": 17.81263727 },
        { "r": 15.34314466, "b": 16.12683861 },
        { "r": 16.27769139, "b": 17.27925046 },
        { "r": 16.46677073, "b": 18.52425997 },
        { "r": 16.17653508, "b": 16.47572187 },
        { "r": 16.46675614, "b": 17.15839414 }
    ];



    let chartData = [];

    // create table
    let container = document.getElementById('table-div');
    let hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ["B Mag", "V Mag"], // need to change to filter1, filter2
        maxCols: 2,
        columns: [
            { data: 'b', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'r', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
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
                    borderColor: colors['purple'],
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
            clusterForm.elements['d-num'].value, 0,
            filterForm);
        updateHRModel(clusterForm, myChart);
    };

    // link chart to table
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    // link chart to model form (slider + text)
    clusterForm.oninput = function () {
        //console.log(tableData);
        update();

    };

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
        let data = reader.result.split("\n").filter(str => (str !== null && str !== undefined && str !== ""));
        let last = data.length;
        let filter1 = data[1].trim().split(",")[10]; // identify first filter

        let filter2 = data[last - 1].trim().split(",")[10]; // because afterglow stacks filters in chunks, the first filter is in row 1 and the last filter is in the last row.

        let blue = document.getElementById("filter-form").elements["blue"];
        let red = document.getElementById("filter-form").elements["red"];
        let lum = document.getElementById("filter-form").elements["lum"];
        //Change filter oprions to match file
console.log(filter1)
let filter1num, filter2num;
if (filter1 === "U") {
     filter1num = 1
} else if (filter1 === "Uprime") {
     filter1num = 2
} else if (filter1=== "B") {
     filter1num = 3
} else if (filter1 === "Gprime") {
     filter1num = 4
} else if (filter1 === "V") {
     filter1num = 5
} else if (filter1=== "Rprime") {
     filter1num = 6
}else if (filter1 === "R") {
     filter1num = 7
} else if (filter1=== "Iprime") {
     filter1num = 8
} else if (filter1 === "I") {
     filter1num = 9
} else if (filter1 === "Zprime") {
     filter1num = 10
} else if (filter1=== "J") {
     filter1num = 11
} else if (filter1 === "H") {
     filter1num = 12
} else if (filter1=== "K") {
     filter1num = 13
} else if (filter1 = []) {
     filter1num = 14
}

if (filter2 === "U") {
     filter2num = 1
} else if (filter2 === "Uprime") {
     filter2num = 2
} else if (filter2=== "B") {
     filter2num = 3
} else if (filter2 === "Gprime") {
     filter2num = 4
} else if (filter2 === "V") {
     filter2num = 5
} else if (filter2=== "Rprime") {
     filter2num = 6
}else if (filter2 === "R") {
     filter2num = 7
} else if (filter2=== "Iprime") {
     filter2num = 8
} else if (filter2 === "I") {
     filter2num = 9
} else if (filter2 === "Zprime") {
     filter2num = 10
} else if (filter2=== "J") {
     filter2num = 11
} else if (filter2 === "H") {
     filter2num = 12
} else if (filter2=== "K") {
     filter2num = 13
} else if (filter2 = []) {
     filter2num = 14
}
let filter1temp = filter1
let filter2temp = filter2
if (filter1num > filter2num){
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


            // adds id and magnitude to data1 if filter is filter 1
            if (items[10] === filter1) {
                data1.push([items[1], parseFloat(items[12])])
            }
            // otherwise adds id and magnitude to data2
            else {
                data2.push([items[1], parseFloat(items[12])])
            }
        }



        table.updateSettings({
            colHeaders: [filter1 + " Mag", filter2 + " Mag"],
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
                    'r': data2[right][1]
                });
                left++;
                right++;
            } else if (data1[left][0] < data2[right][0]) {
                tableData.push({
                    'b': data1[left][1],
                    'r': null
                });
                left++;
            } else {
                tableData.push({
                    'b': null,
                    'r': data2[right][1]
                });
                right++;
            }
        }
        while (left < data1.length) {
            tableData.push({
                'b': data1[left][1],
                'r': null
            });
            left++;
        }
        while (right < data2.length) {
            tableData.push({
                'b': null,
                'r': data2[right][1]
            });
            right++;
        }

        tableData = tableData.filter(entry => !isNaN(entry.b) || !isNaN(entry.r));
        tableData = tableData.map(entry => ({
            'b': isNaN(entry.b) ? null : entry.b,
            'r': isNaN(entry.r) ? null : entry.r
        }));

        // Here we have complete tableData
        table.updateSettings({ data: tableData });
        updateTableHeight(table);
        updateScatter(table, myChart,
            document.getElementById('cluster-form').elements["d-num"].value, 0,
            document.getElementById('filter-form')
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
    chart.data.datasets[1].data = HRGenerator(
        form.elements['r-num'].value,
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
function HRGenerator(range, age, reddening, metallicity, start = -8, end = 8, steps = 500) {
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

function updateScatter(table, myChart, dist = 0.01, dataSet = 0, form) {
    let start = 0;
    let chart = myChart.data.datasets[dataSet].data;
    let tableData = table.getData();
    //Determine what filters each is set to
    let blue = form.elements["blue"].value==='b'?0:1;
    let red = form.elements["red"].value==='b'?0:1;
    let lum = form.elements["lum"].value==='b'?0:1;

    for (let i = 0; i < tableData.length; i++) {
        if (tableData[i][blue] === '' || tableData[i][red] === '' ||
            tableData[i][blue] === null || tableData[i][red] === null) {
            continue;
        }
        //red-blue,red
        chart[start++] = {
            x: tableData[i][blue] - tableData[i][red],
            y: tableData[i][lum] - 5 * Math.log10(dist / 0.01)
        };
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update(0);
}