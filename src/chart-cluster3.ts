"use strict";

import Chart from "chart.js/auto";
import {  starData } from "./chart-cluster-utils/chart-cluster-gaia";
import Handsontable from "handsontable";
import { colors, tableCommonOptions } from "./config";
import {linkInputs, throttle, updateLabels, updateTableHeight, } from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartScaleControl, graphScale, updateScatter } from "./chart-cluster-utils/chart-cluster-scatter";
import { insertClusterControls, clusterProSliders } from "./chart-cluster-utils/chart-cluster-interface";
import { dummyData } from "./chart-cluster-utils/chart-cluster-dummy";
import { HRrainbow } from "./chart-cluster-utils/chart-cluster-util";
import { updateHRModel } from "./chart-cluster-utils/chart-cluster-model";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart, modelForm, graphScale]}:
 */
export function cluster3(): [Handsontable, Chart[], ModelForm, graphScale] {
    insertClusterControls(2);
    clusterProSliders(true);
    //make graph scaling options visible to users

  //setup two charts
    document.getElementById('myChart').remove();
    document.getElementById('myChart1').remove();
    //remove chartTag from 'mychart1' and 'mychart2'
    document.getElementById('chartTag1').remove();
    document.getElementById('chartTag2').remove();
    //document.getElementById('myChart1').remove();
    document.getElementById('chart-div1').style.display = 'block';
    document.getElementById('chart-div2').style.display = 'block';
    document.getElementById('chart-div3').style.display = 'block';
    document.getElementById('chart-div4').style.display = 'block';
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label2').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('axis-label4').style.display = 'inline';
    //document.getElementById('axis-label5').style.display = 'inline';
    //document.getElementById('axis-label6').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X<sub>1</sub> Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y<sub>1</sub> Axis";
    document.getElementById('axisSet1').className = 'col-sm-6';
    document.getElementById('axisSet2').style.display = 'inline';

  // Link each slider with corresponding text box
  const clusterForm = document.getElementById("cluster-form") as ClusterForm;
  const modelForm = document.getElementById("model-form") as ModelForm;
    const clusterProForm = document.getElementById("clusterProForm") as ClusterProForm;
  linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 3, true);
  linkInputs(clusterForm["range"], clusterForm["range_num"], 0, 100, 0.01, 100, false, false);
  linkInputs(modelForm["age"], modelForm["age_num"], 6.6, 10.3, 0.01, 6.6);
  linkInputs(clusterForm["red"], clusterForm["red_num"], 0, 1, 0.01, 0, false, true, 0, 100000000);
  linkInputs(modelForm["metal"], modelForm["metal_num"], -3.4, 0.2, 0.01, -3.4);
  linkInputs(clusterProForm["ramotion"], clusterProForm["ramotion_num"], 0, 100, 0.01, 50, false, false);  
  linkInputs(clusterProForm["rarange"], clusterProForm["rarange_num"], 0, 100, 0.01, 100, false, false);
  linkInputs(clusterProForm["decmotion"], clusterProForm["decmotion_num"], 0, 100, 0.01, 50, false, false);
  linkInputs(clusterProForm["decrange"], clusterProForm["decrange_num"], 0, 100, 0.01, 100, false, false);



  const tableData = dummyData;

  //declare graphScale limits
  let graphMinMax = new graphScale(3);

  // create table
  const container = document.getElementById("table-div");
  const hot = new Handsontable(
    container,
    Object.assign({}, tableCommonOptions, {
      data: tableData,
      colHeaders: ["B Mag", "Berr", "V Mag", "Verr", "R Mag", "Rerr", "I Mag", "Ierr"], // need to change to filter1, filter2
      columns: [
        {
          data: "B",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Berr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "V",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Verr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "R",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Rerr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "I",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "Ierr",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
      ],
      hiddenColumns: { columns: [1, 3, 4, 5, 6, 7] },
    })
  );
  // create chart

  const ctx1 = (document.getElementById("myChart3") as HTMLCanvasElement).getContext('2d');

  const myChart3 = new Chart(ctx1, {
    type: "line",
    data: {
      labels: ["Model", "Data"],
      datasets: [
        {
          type: "line",
          label: "",
          data: null, // will be generated later
          borderColor: colors["black"],
          backgroundColor: colors["black"],
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          fill: false,
          immutableLabel: true,
          parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
        },
        {
          type: "line",
          label: "Model2",
          data: null, // will be generated later
          borderColor: colors["black"],
          backgroundColor: colors["black"],
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          fill: false,
          immutableLabel: true,
          parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
        },
        {
          type: "scatter",
          label: "Data",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["black"],
          borderWidth: 0.2,
          fill: false,
          showLine: false,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
      ],
    },
    options: {
      responsive: true,
      //maintainAspectRatio: false,
      aspectRatio: 1.141,
      hover: {
        mode: "nearest",
      },
      scales: {
        x: {
          //label: 'B-V',
          type: "linear",
          position: "bottom",
        },
        y: {
          //label: 'V',
          reverse: true,
          suggestedMin: 0,
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
          },
        },
        title: {
          display: true,
          align: "start",
          padding: {
            top: 10.025,
            bottom: 14,
          }
        },
        legend: {
          display: false,
          align: "end",
          labels: {
            filter: function(item) {
              // Logic to remove a particular legend item goes here
              //remove the legend item for the model2
              // const aff = !item.text.includes("");
              const eff = !item.text.includes("Model2");
              const off = !item.text.includes("Data");
              return eff && off;
            }
          }
        }
      }
    },
  });

  const ctx2 = (document.getElementById("myChart4") as HTMLCanvasElement).getContext('2d');

  const myChart4 = new Chart(ctx2, {
        type: "line",
    data: {
      labels: ["Model", "Data"],
      datasets: [
        {
          type: "line",
          label: "Model",
          data: null, // will be generated later
          borderColor: colors["black"],
          backgroundColor: colors["black"],
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          fill: false,
          immutableLabel: true,
          parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
        },
        {
          type: "line",
          label: "Model2",
          data: null, // will be generated later
          borderColor: colors["black"],
          backgroundColor: colors["black"],
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          fill: false,
          immutableLabel: true,
          parsing: {}//This fixes the disappearing issue. Why? What do I look like, a CS major?
        },
        {
          type: "scatter",
          label: "Data",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["black"],
          borderWidth: 0.2,
          fill: false,
          showLine: false,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: false,
          parsing: {}
        },
      ],
    },
    options: {
      responsive: true,
      //maintainAspectRatio: false,
      aspectRatio: 1.141,
      hover: {
        mode: "nearest",
      },
      scales: {
        x: {
          //label: 'B-V',
          type: "linear",
          position: "bottom",
        },
        y: {
          //label: 'V',
          reverse: true,
          suggestedMin: 0,
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
          },
        },
        title: {
          display: true,
          align: 'start',
          color: 'white',
          font: {
            size: 1},
          padding: {
            top: 25.50,
            bottom: -14,
          }
        },
        legend: {
          align: "end",
          labels: {
            filter: function(item) {
              // Logic to remove a particular legend item goes here
              return !item.text.includes('Model2');
            }
          }
        }
      }
    },
  });

  const ctx3 = (document.getElementById("myChart2") as HTMLCanvasElement).getContext('2d');

  const myChart2 = new Chart(ctx3, {
    type: "line",
    data: {
      labels: ["Data"],
      datasets: [
        {
          type: "scatter",
          label: "Data",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["black"],
          borderWidth: 0.2,
          fill: false,
          showLine: false,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
      ],
    },
    options: {
      responsive: true,
      //maintainAspectRatio: false,
      aspectRatio: 2,
      hover: {
        mode: "nearest",
      },
      scales: {
        x: {
          //label: 'B-V',
          type: "linear",
          position: "bottom",
        },
        y: {
          //label: 'V',
          reverse: false,
          suggestedMin: 0,
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
          },
        },
        title: {
          display: false
          },
        },
      }
    },
  );
  //change the default font size of myChart2
  //create graph control buttons and assign onZoom onPan functions to deactivate radio button selections
  let graphControl = new ChartScaleControl([myChart3, myChart4], modelForm, graphMinMax);
  myChart3.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(modelForm)};
  myChart3.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(modelForm)};
  myChart4.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(modelForm, 1)};
  myChart4.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(modelForm, 1)};



  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart3.data.datasets[2].backgroundColor = HRrainbow(myChart3,
        modelForm["red"].value, modelForm["blue"].value)
      myChart4.data.datasets[2].backgroundColor = HRrainbow(myChart4,
            modelForm["red2"].value, modelForm["blue2"].value)
      myChart3.update()
      myChart4.update()
    }, 10)
  }
  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    updateScatter(hot, [myChart3, myChart4], clusterForm, modelForm, [2, 2], graphMinMax);
  };
  // link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);

  clusterForm.oninput = throttle(
    function () { updateScatter(hot, [myChart3, myChart4], clusterForm, modelForm, [2, 2], graphMinMax); },
    frameTime);

  // link chart to model form (slider + text)
  // modelForm.oninput=
  modelForm.oninput = throttle(function () {
    updateHRModel(modelForm, hot, [myChart3, myChart4], (chartNum: number) => {
      updateScatter(hot, [myChart3, myChart4], clusterForm, modelForm, [2, 2], graphMinMax, chartNum);}
    );
   }, 100);

  //initializing website

   //figure out why this update is breaking the code and it does not break the code in the other one
  update();
  updateHRModel(modelForm, hot, [myChart3, myChart4]);
  document.getElementById("extra-options").style.display = "block";
  document.getElementById("standardView").click();
  myChart2.options.scales["x"].title.text = "Motion in RA (mas/yr)";
  myChart2.options.scales["y"].title.text = "Motion in Dec (mas/yr)";
  myChart3.options.plugins.title.text = "Title";
  myChart3.options.scales["x"].title.text = "x1";
  myChart3.options.scales["y"].title.text = "y1";
  myChart4.options.scales["x"].title.text = "x2";
  myChart4.options.scales["y"].title.text = "y2";
  updateLabels(myChart3, document.getElementById("chart-info-form") as ChartInfoForm, false, false, false, false, 1);
  updateLabels(myChart4, document.getElementById("chart-info-form") as ChartInfoForm, false, false, false, false, 1);
  const chartTypeForm = document.getElementById('chart-type-form') as HTMLFormElement;
  chartTypeForm.addEventListener("change" , function () {
    //destroy the chart
    //testing a bunch of creating charts and destroying them to make the thing work
    myChart2.destroy();
    myChart3.destroy();
    myChart4.destroy();
  });
  return [hot, [myChart3, myChart4, myChart2], modelForm, graphMinMax];
  
}
