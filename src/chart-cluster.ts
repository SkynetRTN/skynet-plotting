'use strict';

import Chart from "chart.js/auto";
import Handsontable from "handsontable";

import { tableCommonOptions, colors } from "./config";
import { linkInputs, throttle, updateLabels, updateTableHeight, changeOptions } from "./util";
import { round } from "./my-math"
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart]}:
 */
export function cluster(): [Handsontable, Chart] {
    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Cluster Diagram" id="cluster-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Distance (kpc):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance" name="d"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Distance" name="d_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Reddening (mag):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Reddening" name="red"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Reddening" name="red_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">log(Age (yr)):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Age" name="age"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Age" name="age_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Metallicity (solar):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Metallicity" name="metal"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Metallicity" name="metal_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Max Error (mag):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Error" name="err"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Error" name="err_num" class="field"></div>\n' +
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
        '<option value="B" title="B filter" selected>B</option></div>\n' +
        '<option value="V" title="V filter">V</option></select></div>\n' +
        '<div class="col-sm-4"><select name="red" style="width: 100%;" title="Red Color Filter">\n' +
        '<option value="B" title="B filter">B</option></div>\n' +
        '<option value="V" title="V filter" selected>V</option></select></div>\n' +
        '<div class="col-sm-4"><select name="lum" style="width: 100%;" title="Select Luminosity Filter">\n' +
        '<option value="B" title="B filter">B</option></div>\n' +
        '<option value="V" title="V filter" selected>V</option></select></div>\n' +
        '</div>\n' +
        '</form>\n');

    // Link each slider with corresponding text box
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const filterForm = document.getElementById("filter-form") as FilterForm;
    linkInputs(clusterForm['d'], clusterForm['d_num'], 0.1, 100, 0.01, 3, true);
    linkInputs(clusterForm['err'], clusterForm['err_num'], 0, 1, 0.01, 1);
    linkInputs(clusterForm['age'], clusterForm['age_num'], 6, 11, 0.01, 6);
    linkInputs(clusterForm['red'], clusterForm['red_num'], 0, 1, 0.01, 0);
    linkInputs(clusterForm['metal'], clusterForm['metal_num'], -3, 1, 0.01, -3);

    const tableData = [
        { "B": 15.43097938, "V": 16.27826813 },
        { "B": 16.77254031, "V": 25.11862975 },
        { "B": 15.8596803, "V": 16.02283206 },
        { "B": 15.33731775, "V": 16.33344688 },
        { "B": 16.38859704, "V": 17.18360391 },
        { "B": 16.31949681, "V": 16.53544594 },
        { "B": 14.0629343, "V": 15.38553603 },
        { "B": 16.29534441, "V": 16.50974513 },
        { "B": 16.1657268, "V": 16.83575269 },
        { "B": 17.51460697, "V": 18.5984111 },
        { "B": 16.04886286, "V": 17.05094936 },
        { "B": 16.5769982, "V": 17.85338039 },
        { "B": 16.25836173, "V": 17.32776556 },
        { "B": 16.98460632, "V": 17.32776556 },
        { "B": 16.55678419, "V": 19.03864387 },
        { "B": 16.33446192, "V": 16.95786137 },
        { "B": 16.57383717, "V": 18.22282621 },
        { "B": 15.45454838, "V": 16.38287161 },
        { "B": '', "V": 18.64958716 },
        { "B": 17.03338599, "V": 17.18225861 },
        { "B": 15.67943013, "V": 17.06307599 },
        { "B": 15.58749498, "V": 16.25978671 },
        { "B": 17.22801358, "V": 19.11819362 },
        { "B": 15.58749498, "V": 16.25978671 },
        { "B": 13.73313678, "V": 15.09469488 },
        { "B": 17.88121272, "V": '' },
        { "B": 16.85434535, "V": 18.18845161 },
        { "B": 14.82866923, "V": 16.10561823 },
        { "B": 13.73313678, "V": 15.09469488 },
        { "B": 16.20261041, "V": 17.10551692 },
        { "B": 14.05584728, "V": 14.95406699 },
        { "B": 13.41512997, "V": 14.77205357 },
        { "B": 13.4150376, "V": 14.77142355 },
        { "B": 16.3081282, "V": 16.23340589 },
        { "B": 13.50782524, "V": 17.19386585 },
        { "B": 14.05584728, "V": 14.95406699 },
        { "B": 14.48228538, "V": 15.53284141 },
        { "B": 14.48228538, "V": 15.53284141 },
        { "B": 13.41512997, "V": 14.77205357 },
        { "B": 14.98742022, "V": 16.16161323 },
        { "B": '', "V": 17.3542598 },
        { "B": 14.48228538, "V": 15.53284141 },
        { "B": 14.82000979, "V": 15.50808964 },
        { "B": 13.50782524, "V": 14.93330301 },
        { "B": 14.23864951, "V": 15.36526562 },
        { "B": '', "V": 17.3542598 },
        { "B": '', "V": 21.88558586 },
        { "B": 15.88362032, "V": 16.99347154 },
        { "B": 16.59246742, "V": 18.63973181 },
        { "B": 18.74756052, "V": 18.43987184 },
        { "B": 18.79360112, "V": '' },
        { "B": '', "V": 17.3542598 },
        { "B": 13.85972628, "V": 15.04605293 },
        { "B": 12.99477704, "V": 14.33654336 },
        { "B": 13.44868484, "V": 15.13626032 },
        { "B": 13.85972628, "V": 15.04605293 },
        { "B": 16.64663172, "V": 16.52047654 },
        { "B": 13.44868484, "V": 15.13626032 },
        { "B": 15.2232312, "V": 16.59897296 },
        { "B": 13.80402188, "V": 15.24006842 },
        { "B": 16.95685979, "V": 18.65277628 },
        { "B": 13.85972628, "V": 15.04605293 },
        { "B": 15.93885734, "V": 16.68293062 },
        { "B": 12.99477704, "V": 14.33654336 },
        { "B": 14.81124663, "V": 16.13093644 },
        { "B": 14.88940903, "V": 15.75268685 },
        { "B": 18.34280539, "V": 21.27274425 },
        { "B": 13.80402188, "V": 15.24006842 },
        { "B": 17.19977299, "V": 15.41325092 },
        { "B": '', "V": 16.92714199 },
        { "B": 16.24101221, "V": 16.93271118 },
        { "B": 16.08172697, "V": 16.68293062 },
        { "B": 14.69924929, "V": 15.63058973 },
        { "B": 13.80402188, "V": 15.24006842 },
        { "B": 13.24179334, "V": 13.83144443 },
        { "B": 16.18894154, "V": 15.41325092 },
        { "B": 14.88940903, "V": 15.75268685 },
        { "B": 14.8531258, "V": 15.95426672 },
        { "B": 16.72466552, "V": 16.32461737 },
        { "B": 14.69924929, "V": '' },
        { "B": 14.52230024, "V": 15.84437243 },
        { "B": 15.92405784, "V": 16.98715997 },
        { "B": 15.05031888, "V": 16.18179559 },
        { "B": 18.09267371, "V": 18.58192812 },
        { "B": 15.51171659, "V": 15.72326776 },
        { "B": 16.60222305, "V": 16.03893106 },
        { "B": 14.56617257, "V": 15.41325092 },
        { "B": 16.06682967, "V": 17.07770783 },
        { "B": 16.45704176, "V": 16.90445332 },
        { "B": 15.67454005, "V": 16.05655379 },
        { "B": 14.8531258, "V": 15.95426672 },
        { "B": 16.45704176, "V": 16.90445332 },
        { "B": 21.08594604, "V": 17.49628014 },
        { "B": 14.69924929, "V": 15.63058973 },
        { "B": '', "V": 17.84698171 },
        { "B": 14.61864369, "V": 15.67788232 },
        { "B": 13.24179334, "V": 13.83144443 },
        { "B": 13.24179334, "V": 13.83144443 },
        { "B": 15.72682416, "V": 16.51716071 },
        { "B": 15.58326758, "V": 16.03031502 },
        { "B": 17.22909189, "V": 17.8896688 },
        { "B": 14.61864369, "V": 15.67788232 },
        { "B": 17.39615147, "V": 16.80733512 },
        { "B": 16.01539528, "V": 16.2342371 },
        { "B": 15.58326758, "V": 16.03031502 },
        { "B": 18.79203925, "V": 18.26028926 },
        { "B": 15.58326758, "V": 16.03031502 },
        { "B": 13.49905899, "V": 14.62940184 },
        { "B": 14.98669874, "V": 15.35993901 },
        { "B": 14.97756429, "V": '' },
        { "B": 13.82155931, "V": 14.47200105 },
        { "B": '', "V": 17.86970859 },
        { "B": 16.40612773, "V": 16.61646937 },
        { "B": 14.97756429, "V": 15.76702651 },
        { "B": 13.49905899, "V": 15.18299228 },
        { "B": 13.49905899, "V": 14.62940184 },
        { "B": 13.70930632, "V": 14.87941149 },
        { "B": 15.54511222, "V": 16.71033503 },
        { "B": 13.77453263, "V": 18.07248158 },
        { "B": 13.77453263, "V": 15.17212027 },
        { "B": 14.27431121, "V": 15.25671618 },
        { "B": 14.02803462, "V": 15.11422176 },
        { "B": 13.70930632, "V": 14.87941149 },
        { "B": 13.33085835, "V": 13.98467529 },
        { "B": 14.90694167, "V": 16.02144661 },
        { "B": 13.70930632, "V": 14.87941149 },
        { "B": 13.8372448, "V": 15.31225338 },
        { "B": '', "V": 16.57549536 },
        { "B": 14.02803462, "V": 15.11422176 },
        { "B": 16.96342168, "V": 19.18057963 },
        { "B": 14.37840351, "V": 15.04955875 },
        { "B": 15.25060087, "V": 21.08582186 },
        { "B": 16.41724172, "V": 17.10243209 },
        { "B": 16.47411586, "V": 17.91034943 },
        { "B": 15.25060087, "V": 16.57596516 },
        { "B": 14.37840351, "V": 15.0486841 },
        { "B": 13.8372448, "V": 15.31225338 },
        { "B": 16.53261597, "V": 18.81756806 },
        { "B": 14.84242564, "V": 15.93099465 },
        { "B": 18.28437793, "V": 17.15460615 },
        { "B": 16.53261597, "V": 18.81756806 },
        { "B": '', "V": 18.79026006 },
        { "B": '', "V": 17.92461728 },
        { "B": 13.13773957, "V": 15.0750296 },
        { "B": '', "V": 18.79026006 },
        { "B": 14.95902581, "V": 15.93054716 },
        { "B": 15.06917621, "V": 16.15735039 },
        { "B": 14.2347885, "V": 15.37820781 },
        { "B": 17.98635869, "V": 19.07238478 },
        { "B": 13.13773957, "V": 15.0750296 },
        { "B": 15.06917621, "V": 18.68626436 },
        { "B": 14.69189468, "V": 15.84163791 },
        { "B": 14.69189468, "V": 17.74147243 },
        { "B": 13.13773957, "V": 15.0750296 },
        { "B": 14.05725573, "V": 15.35865411 },
        { "B": 15.3533662, "V": 16.24543087 },
        { "B": 15.2558489, "V": 16.04229177 },
        { "B": 14.23841017, "V": 14.83887406 },
        { "B": 14.43720534, "V": 15.72291857 },
        { "B": '', "V": 23.42619755 },
        { "B": 16.32331101, "V": 16.67035321 },
        { "B": '', "V": 24.55117794 },
        { "B": 18.40699651, "V": 18.12856044 },
        { "B": 16.58143317, "V": 17.47876839 },
        { "B": 15.13527717, "V": 16.21270202 },
        { "B": '', "V": 25.39429629 },
        { "B": 15.80986892, "V": 16.89650921 },
        { "B": 13.90799577, "V": 15.11518485 },
        { "B": '', "V": 25.39429629 },
        { "B": 16.58143317, "V": 17.47876839 },
        { "B": '', "V": 24.55117794 },
        { "B": 18.33497755, "V": 18.12856044 },
        { "B": 14.13664216, "V": 15.56268401 },
        { "B": '', "V": 18.44553419 },
        { "B": 17.12470139, "V": 17.47506295 },
        { "B": 14.13664216, "V": 15.56268401 },
        { "B": 15.3112048, "V": 15.55115479 },
        { "B": 15.58917524, "V": 16.11254138 },
        { "B": 13.49960974, "V": 15.05117977 },
        { "B": 16.1203243, "V": 17.0695496 },
        { "B": 18.13568273, "V": 16.67549226 },
        { "B": 16.1203243, "V": 17.0695496 },
        { "B": 15.58917524, "V": 16.11254138 },
        { "B": 15.3112048, "V": 15.55115479 },
        { "B": '', "V": 18.23561866 },
        { "B": 16.17464756, "V": 17.69068621 },
        { "B": 13.33603931, "V": 15.07683153 },
        { "B": 16.83715169, "V": 17.33751497 },
        { "B": 13.04569612, "V": 14.47211794 },
        { "B": 16.04315762, "V": 16.88091123 },
        { "B": '', "V": 18.61413441 },
        { "B": 13.04569612, "V": 14.47211794 },
        { "B": 15.70786378, "V": 16.4406514 },
        { "B": 13.04569612, "V": 14.47211794 },
        { "B": 14.07870114, "V": 15.03124572 },
        { "B": 13.55230332, "V": 14.91182518 },
        { "B": 15.70786378, "V": 16.4406514 },
        { "B": 20.29622649, "V": 21.33380038 },
        { "B": 15.19615187, "V": 16.02070873 },
        { "B": 14.07870114, "V": 15.03124572 },
        { "B": 16.9743219, "V": 15.62688866 },
        { "B": 13.55230332, "V": 14.91182518 },
        { "B": 13.18718203, "V": 14.69238295 },
        { "B": 15.52584271, "V": 16.20351223 },
        { "B": '', "V": 20.37034632 },
        { "B": 15.97991765, "V": 17.5350865 },
        { "B": 15.90354203, "V": 16.59412282 },
        { "B": 14.07870114, "V": 15.03124572 },
        { "B": 14.02410856, "V": 15.12885013 },
        { "B": '', "V": 22.79532344 },
        { "B": 16.30601359, "V": 17.13647676 },
        { "B": 16.20178532, "V": 17.25270183 },
        { "B": 16.31932821, "V": 17.28118029 },
        { "B": 19.69219179, "V": '' },
        { "B": 17.91919503, "V": 20.68047585 },
        { "B": '', "V": 22.70010615 },
        { "B": 16.34308014, "V": 16.57115875 },
        { "B": 17.90855255, "V": '' },
        { "B": 17.84905512, "V": 19.31873402 },
        { "B": 16.74182906, "V": 19.49336918 },
        { "B": 15.98969122, "V": 17.19788018 },
        { "B": 14.48389827, "V": 15.37697935 },
        { "B": 17.59717916, "V": 18.3012353 },
        { "B": 18.74666131, "V": '' },
        { "B": 15.46912347, "V": 16.16041647 },
        { "B": 15.99515795, "V": 16.65227211 },
        { "B": 15.92543248, "V": 16.7860739 },
        { "B": 14.75814408, "V": 15.74677631 },
        { "B": 15.30698282, "V": 16.55804587 },
        { "B": 16.09043148, "V": 16.90277312 },
        { "B": 15.45418544, "V": 16.22666318 },
        { "B": 16.48585897, "V": 17.81263727 },
        { "B": 15.34314466, "V": 16.12683861 },
        { "B": 16.27769139, "V": 17.27925046 },
        { "B": 16.46677073, "V": 18.52425997 },
        { "B": 16.17653508, "V": 16.47572187 },
        { "B": 16.46675614, "V": 17.15839414 }
    ];

    // create table
    const container = document.getElementById('table-div');
    const hot = new Handsontable(container, Object.assign({}, tableCommonOptions, {
        data: tableData,
        colHeaders: ["B Mag", "V Mag"], // need to change to filter1, filter2
        columns: [
            { data: 'B', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
            { data: 'V', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } },
        ],
        hiddenColumns: true
    }));
    // create chart
    const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Model',
                    data: null, // will be generated later
                    borderColor: colors['blue'],
                    backgroundColor: colors['white-0'],
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    fill: false,
                    immutableLabel: true,
                }, {
                    label: 'Data',
                    data: [],
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
            scales: {
                x: {
                    //label: 'B-V',
                    type: 'linear',
                    position: 'bottom',
                },
                y: {
                    //label: 'V',
                    reverse: true,
                    suggestedMin: 0,
                },
            },
            plugins:{
                zoom:{
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        wheel:{
                            enabled: true
                        },
                        mode: 'x',
                    },
                }
            }
        }
    });

    const update = function () {
        //console.log(tableData);
        updateTableHeight(hot);
        updateScatter(hot, myChart,
            Number(clusterForm['d_num'].value),
            1, //the dataSet is missing after 
            filterForm, Number(clusterForm['err_num'].value));
        updateHRModel(clusterForm, myChart);
    };

    // link chart to table
    hot.updateSettings({
        afterChange: update,
        afterRemoveRow: update,
        afterCreateRow: update,
    });

    const fps = 100;
    const frameTime = Math.floor(1000 / fps);

    // link chart to model form (slider + text)
    clusterForm.oninput = throttle(update, frameTime);

    filterForm.oninput = function () {
        //console.log(tableData);

        const reveal: string[] = [
            filterForm["red"].value,
            filterForm["blue"].value,
            filterForm["lum"].value
        ]

        const columns: string[] = hot.getColHeader() as string[];
        const hidden: number[] = [];
        for (const col in columns) {
            columns[col] = columns[col].substring(0, columns[col].length - 4); //cut off " Mag"
            if (!reveal.includes(columns[col])) { //if the column isn't selected in the drop down, hide it
                hidden.push(parseFloat(col));
            }
        }

        hot.updateSettings({
            hiddenColumns: {
                columns: hidden,
                // copyPasteEnabled: false,
                indicators: false
            }
        });

        update();
        updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm);
        myChart.update('none');
    }
    update();

    myChart.options.plugins.title.text = "Title";
    myChart.options.scales['x'].title.text = 'x';
    myChart.options.scales['y'].title.text = 'y';
    updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, false, false, false, false);

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
export function clusterFileUpload(evt: Event, table: Handsontable, myChart: Chart<'line'>) {
    // console.log("clusterFileUpload called");
    const file = (evt.target as HTMLInputElement).files[0];

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

    const reader = new FileReader();
    reader.onload = () => {

        const clusterForm = document.getElementById("cluster-form") as ClusterForm;
        // console.log(clusterForm.elements['d'].value);
        clusterForm['d'].value = (Math.log(3)).toString();
        // console.log(clusterForm.elements['d'].value);
        clusterForm['age'].value = '6';
        clusterForm['red'].value = '0';
        clusterForm['metal'].value = '-3';
        clusterForm['d_num'].value = '3';
        clusterForm['age_num'].value = '6';
        clusterForm['red_num'].value = '0';
        clusterForm['metal_num'].value = '-3';
        myChart.options.plugins.title.text = "Title";;
        myChart.data.datasets[1].label = "Data";
        myChart.options.scales['x'].title.text = 'x';
        myChart.options.scales['y'].title.text = 'y';
        updateLabels(myChart, document.getElementById('chart-info-form') as ChartInfoForm, false, false, false, false);

        const data: string[] = (reader.result as string).split("\n").filter(str => (str !== null && str !== undefined && str !== ""));

        const datadict = new Map<string, Map<string, number>>(); // initializes a dictionary for the data
        let filters: string[] = [];
        data.splice(0, 1);

        //fills the dictionary datadict with objects for each source, having attributes of each filter magnitude
        for (const row of data) {
            let items = row.trim().split(",");
            let src    = items[1]
            let filter = items[10].toUpperCase()
            let mag    = parseFloat(items[12])
            let err    = parseFloat(items[13])
            if (!datadict.has(src)) {
                datadict.set(src, new Map<string, number>());
            }
            datadict.get(src).set(filter, isNaN(mag) ? null : mag);
            datadict.get(src).set(filter+'err', isNaN(err) ? 0 : err);
            if (!filters.includes(filter)) {
                filters.push(filter);
            }
        }
        //add null values for sources that didn't show up under each filter
        for (const src of datadict.keys()) {
            for (const f of filters) {
                if (!datadict.get(src).has(f)) {
                    datadict.get(src).set(f, null);
                    datadict.get(src).set(f+'err', null);
                }
            }
        }

        const filterForm = document.getElementById("filter-form") as FilterForm;
        const blue = filterForm["blue"];
        const red = filterForm["red"];
        const lum = filterForm["lum"];

        //Change filter options to match file

        //order filters by temperature
        let knownFilters = ["U", "UPRIME", "USTAR", "B", "GPRIME", "V", "VPRIME", "RPRIME", "R", "IPRIME", "I", "ZPRIME", "Y", "J", "H", "KS", "K", "L", "M", "N", "Q"];
        //knownFilters is ordered by temperature; this cuts filters not in the file from knownFilters
        knownFilters = knownFilters.filter(f => filters.indexOf(f) >= 0);
        filters = knownFilters.concat(filters.filter(f => knownFilters.indexOf(f) < 0));//slap unknowns on the end
        //console.log(filters)

        const optionList = [];
        const headers = [];
        const columns = [];
        var hiddenColumns = [];
        for (let i = 0; i < filters.length; i++) {//makes a list of options for each filter 
            optionList.push({ value: filters[i], title: filters[i] + ' Mag', text: filters[i] })
            hiddenColumns[i] = i;
            hiddenColumns[i+filters.length] = i+filters.length;//we have to double up the length for the error data
            headers.push(filters[i] + " Mag")//every other column is err
            headers.push(filters[i] + "err")
            columns.push({ data: filters[i], type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } })
            columns.push({ data: filters[i]+'err', type: 'numeric', numericFormat: { pattern: { mantissa: 2 } } })
        }
        hiddenColumns = hiddenColumns.filter(c => [0,2].indexOf(c) < 0)//get rid of the columns we want revealed
        //Change the options in the drop downs to the file's filters
        //blue and lum are most blue by default, red is set to most red
        changeOptions(blue, optionList);
        changeOptions(red, optionList);
        //red.value = red.options[red.options.length-1].value;
        changeOptions(lum, optionList);
        //now we need to assign a number to the filters based off their order in knownFilters
        const filterMap = new Map<string, number>();
        for (let i = 0; i < knownFilters.length; i++) {
            filterMap.set(knownFilters[i], i);
        }
        blue.value = knownFilters[0];
        red.value = knownFilters[1];
        lum.value = knownFilters[1];
        //this might be it??????????
        //console.log (filters)

        //convrt datadict from dictionary to nested number array tableData
        const tableData: { [key: string]: number }[] = [];
        datadict.forEach((src, key) => {
            const row: { [key: string]: number } = {};
            for (let filterIndex in filters) {
                row[filters[filterIndex]] = src.get(filters[filterIndex]);
                row[filters[filterIndex]+'err'] = src.get(filters[filterIndex]+'err');
            }
            tableData.push(row);
        })
        //    console.log(tableData);

        table.updateSettings({
            data: tableData,
            colHeaders: headers,
            columns: columns,
            hiddenColumns: { columns: hiddenColumns }
        });//hide all but the first 3 columns
        updateTableHeight(table);
        updateScatter(table, myChart,
            Number((document.getElementById('cluster-form') as ClusterForm)["d_num"].value), 1,
            (document.getElementById('filter-form') as FilterForm)
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
function updateHRModel(form: ClusterForm, chart: Chart) {
    chart.data.datasets[0].data = HRGenerator(
        //form.elements['r_num'].value,
        Number(form['age_num'].value),
        form['red_num'].value,
        Number(form['metal_num'].value),
        -8,
        8,
        2000
    );
    chart.update('none');
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
function HRGenerator(age: number, reddening: string, metallicity: number, start = -8, end = 8, steps = 500): Array<any> {
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

function updateScatter(table: Handsontable, myChart: Chart, dist: number, dataSetIndex: number, form: FilterForm, err = 1) {

    let start = 0;
    let chart = myChart.data.datasets[dataSetIndex].data;
    let tableData = table.getData();
    let columns = table.getColHeader();

    //Identify the column the selected filter refers to
    let blue    = columns.indexOf(form["blue"].value + " Mag");
    let red     = columns.indexOf(form["red"].value + " Mag");
    let lum     = columns.indexOf(form["lum"].value + " Mag");

    let blueErr = columns.indexOf(form["blue"].value + "err")<0? null:columns.indexOf(form["blue"].value + "err"); //checks for supplied err data
    let redErr  = columns.indexOf(form["red"].value + "err")<0? null:columns.indexOf(form["red"].value + "err");
    let lumErr  = columns.indexOf(form["lum"].value + "err")<0? null:columns.indexOf(form["lum"].value + "err");
    
    let maxY = 0;
    let minY = 0;

    for (let i = 0; i < tableData.length; i++) {
        if (tableData[i][blue] === null || tableData[i][red] === null || tableData[i][lum] === null ||
            (blueErr != null && tableData[i][blueErr] >= err) ||
            (redErr != null && tableData[i][redErr] >= err)||
            (lumErr != null && tableData[i][lumErr] >= err)) {
            continue;
        }
        //red-blue,lum
        let x = (tableData[i][blue]-A_lambda) - (tableData[i][red]-A_lambda);
        let y = (tableData[i][lum]-A_lambda) - 5 * Math.log10(dist / 0.01)
        chart[start++] = {
            x: x,
            y: y,
        };

        //finding the maximum and minimum of y value for chart scaling
        if (isNaN(maxY)){
            maxY = y;
            minY = y;
        } else {
            if (y > maxY){
                maxY = y;
                // console.log(maxY);
            } else if (y < minY) {
                minY = y;
                // console.log(minY);
            }
        }
    }
    while (chart.length !== start) {
        chart.pop();
    }
    myChart.update('none');

    //scale chart y-axis based on minimum and maximum y value
    myChart.options.scales['y'] = {min:minY, max:maxY};
}



//Now we need to create the function for the reddening curve
let filterlambda = 0;
let lambda = filterlambda;
let R_v = 3.1;
//connect the value of A_v to the reddening slider
let A_v = 'red_num';
let x = (lambda/(10^(-6)))^(-1);
let y = x-1.82;
let a = 0;
let b = 0;
    if (x > 0.3 && x < 1.1) {
        a = 0.574*x^1.61
    }
    else if (x > 1.1 && x < 3.3) {
        a = (1 + 0.17699*y - 0.50447*y^2 - 0.02427*y^3 + 0.72085*y^4 + 0.01979*y^5 - 0.77530*y^6 + 0.32999*y^7)
    }

    if (x > 0.3 && x < 1.1) {
        b = -0.527*x^1.61
    }
    else if (x > 1.1 && x < 3.3) {
        b = (1.41338*y + 2.28305*y^2 + 1.07233*y^3 - 5.38434*y^4 - 0.62251*y^5 + 5.30260*y^6 - 2.09002*y^7)
    }

    let A_lambda = Number(A_v) * (a + (b/R_v));


