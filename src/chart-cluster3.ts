"use strict";

import Chart from "chart.js/auto";
import {  starData } from "./chart-cluster-utils/chart-cluster-gaia";
import Handsontable from "handsontable";
import { colors } from "./config";
import {linkInputs, throttle, updateLabels, updateTableHeight, } from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartScaleControl, graphScale, updateScatter } from "./chart-cluster-utils/chart-cluster-scatter";
import { insertClusterControls, clusterProSliders, rangeCheckControl, clusterProCheckControl } from "./chart-cluster-utils/chart-cluster-interface";
import {defaultTable } from "./chart-cluster-utils/chart-cluster-dummy";
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
  linkInputs(clusterForm["distrange"], clusterForm["distrange_num"], 0, 100, 0.01, 100, false, false);
  linkInputs(modelForm["age"], modelForm["age_num"], 6.6, 10.3, 0.01, 6.6);
  linkInputs(clusterForm["red"], clusterForm["red_num"], 0, 1, 0.01, 0, false, true, 0, 100000000);
  linkInputs(modelForm["metal"], modelForm["metal_num"], -3.4, 0.2, 0.01, -3.4);
  
  //when table data changes, change the maxes and mins of the sliders and number boxes
  //linkInputs(clusterProForm["ramotion"], clusterProForm["ramotion_num"], 0, 100, 0.01, 50, false, false);
  //linkInputs(clusterProForm["rarange"], clusterProForm["rarange_num"], 0, 100, 0.01, 100, false, false);
  //linkInputs(clusterProForm["decmotion"], clusterProForm["decmotion_num"], 0, 100, 0.01, 50, false, false);
  //linkInputs(clusterProForm["decrange"], clusterProForm["decrange_num"], 0, 100, 0.01, 100, false, false);

  rangeCheckControl(true);
  clusterProCheckControl();

  //declare graphScale limits
  let graphMinMax = new graphScale(3);

  // create table
  const container = document.getElementById("table-div");
  const hot = defaultTable(container)

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
      aspectRatio: 1.140,
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
            top: 6.025,
            bottom: 5,
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
  //make a function that disables the distrange slider if the distrangeCheckbox is not checked

  

  

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
      aspectRatio: 1.140,
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
            top: -12.50,
            bottom: 10,
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
          type: "line",
          label: "raMotion",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["black"],
          borderColor: colors["black"],
          borderWidth: 1,
          fill: false,
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "decMotion",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["black"],
          borderColor: colors["black"],
          borderWidth: 1,
          fill: false,
          showLine: true,
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
        legend: {
          display: false,

        },
      }
      }
    },
  );
  function modelFormKey(chartNum: number, color: string) {
    return chartNum > 0 ? (color + (chartNum+1).toString()) : color
}
  let tableData2 = hot.getData();
  let columns = hot.getColHeader();
  let blueKey = modelFormKey(1, 'blue')
  let redKey = modelFormKey(3, 'red')
  let lumKey = modelFormKey(3, 'lum')
    //find max and min values of ra and dec
    let maxRa = Math.max(...tableData.map(row => row[columns.indexOf(modelForm[blueKey].value + " ra")]));
    let minRa = Math.min(...tableData.map(row=> row[columns.indexOf(modelForm[blueKey].value + " ra")]));
    let maxDec = Math.max(...tableData.map(row => row[columns.indexOf(modelForm[blueKey].value + " dec")]));
    let minDec = Math.min(...tableData.map(row => row[columns.indexOf(modelForm[blueKey].value + " dec")]));
  //change the default font size of myChart2
  //create graph control buttons and assign onZoom onPan functions to deactivate radio button selections
  let graphControl = new ChartScaleControl([myChart3, myChart4], modelForm, graphMinMax);
  myChart3.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(modelForm)};
  myChart3.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(modelForm)};
  myChart4.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(modelForm, 1)};
  myChart4.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(modelForm, 1)};
  //function that updates myChart2 with the numbers from ramotion_num and decmotion_num
  let ramotion_num = parseFloat(clusterProForm["ramotion_num"].value);
  let decmotion_num = parseFloat(clusterProForm["decmotion_num"].value);
  function updateChart2(ramotion_num: number, decmotion_num: number, maxRa: number, minRa: number, maxDec: number, minDec: number) {
    myChart2.data.datasets[0].data = [{x: maxDec, y: decmotion_num}, {x: -minDec, y: decmotion_num}];
    myChart2.data.datasets[1].data = [{x: ramotion_num, y: maxRa}, {x: ramotion_num, y: -minRa}];
    myChart2.update();
  }
  linkInputs(clusterProForm["ramotion"], clusterProForm["ramotion_num"], minRa, maxRa, 0.01, 50, false, false);  
  linkInputs(clusterProForm["rarange"], clusterProForm["rarange_num"], 0, 100, 0.01, 100, false, false);
  linkInputs(clusterProForm["decmotion"], clusterProForm["decmotion_num"], minDec, maxDec, 0.01, 50, false, false);
  linkInputs(clusterProForm["decrange"], clusterProForm["decrange_num"], 0, 100, 0.01, 100, false, false);
  updateChart2(ramotion_num, decmotion_num, maxRa, minRa, maxDec, minDec);
  //update the graph continuoustly when the values in the form change
  clusterProForm.addEventListener("change", ()=>{
    let decmotion_num = parseFloat(clusterProForm["decmotion_num"].value);
    let ramotion_num = parseFloat(clusterProForm["ramotion_num"].value);
    updateChart2(ramotion_num, decmotion_num, maxRa, minRa, maxDec, minDec);
  });


  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart3.data.datasets[2].backgroundColor = HRrainbow(myChart3,
        modelForm["red"].value, modelForm["blue"].value)
      myChart4.data.datasets[2].backgroundColor = HRrainbow(myChart4,
            modelForm["red2"].value, modelForm["blue2"].value)
      myChart3.update()
      myChart2.update()
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
  //console log tabledata
  return [hot, [myChart3, myChart4, myChart2], modelForm, graphMinMax];
  
}
