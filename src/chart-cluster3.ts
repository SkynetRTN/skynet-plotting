"use strict";

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import { colors } from "./config";
import {linkInputs, throttle, updateLabels, updateTableHeight, } from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {ChartScaleControl, graphScale, updateScatter, updateClusterProScatter } from "./chart-cluster-utils/chart-cluster-scatter";
import { insertClusterControls, clusterProSliders, rangeCheckControl, clusterProCheckControl, clusterProButtons, clusterProButtonControl } from "./chart-cluster-utils/chart-cluster-interface";
import {defaultTable } from "./chart-cluster-utils/chart-cluster-dummy";
import { HRrainbow, modelFormKey } from "./chart-cluster-utils/chart-cluster-util";
import { updateHRModel } from "./chart-cluster-utils/chart-cluster-model";
import { clusterFileDownload } from "./chart-cluster-utils/chart-cluster-file";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart, modelForm, graphScale]}:
 */
export function cluster3(): [Handsontable, Chart[], ModelForm, graphScale, ClusterProForm] {
    insertClusterControls(2, true);
    clusterProButtons(true);
    clusterProSliders(true);
    //make graph scaling options visible to users

  //setup two charts
    document.getElementById('myChart').remove();
    document.getElementById('myChart1').remove();
  //remove chart tags from myChart1 and 2
  //change the class of chart-div2 to col-lg-4
    document.getElementById('chartTag1').style.display = "None";
    document.getElementById('chartTag2').style.display = "None";
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
    document.getElementById("clusterProForm").style.cursor= "auto";
    //I don't know why this is necessary, but it is.
    //document.getElementById("myChart2").style.cursor= "auto";
    //document.getElementById("myChart3").style.cursor= "auto";
  // Link each slider with corresponding text box
  // const clusterProPmChartControl = document.getElementById('clusterProPmChartControl') as ClusterProPmChartControl;
  const clusterForm = document.getElementById("cluster-form") as ClusterForm;
  const modelForm = document.getElementById("model-form") as ModelForm;
  const clusterProForm = document.getElementById("clusterProForm") as ClusterProForm;
  linkInputs(clusterForm['err'], clusterForm["err_num"], 0, 1, 0.05, 1, false, true, 0, 999)
  linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 3, true);
  linkInputs(clusterForm["distrange"], clusterForm["distrange_num"], 0, 100, 0.01, 30, false, false);
  linkInputs(modelForm["age"], modelForm["age_num"], 6.6, 10.2, 0.01, 6.6);
  linkInputs(clusterForm["red"], clusterForm["red_num"], 0, 1, 0.01, 0, false, true, 0, 100000000);
  linkInputs(clusterForm["rv"], clusterForm["rv_num"], 0, 6, 0.01, 3.1, false, true, 0, 100000000);
  linkInputs(modelForm["metal"], modelForm["metal_num"], -2.2, 0.7, 0.01, -2.2);
  
  //when table data changes, change the maxes and mins of the sliders and number boxes
  //linkInputs(clusterProForm["ramotion"], clusterProForm["ramotion_num"], 0, 100, 0.01, 50, false, false);
  //linkInputs(clusterProForm["rarange"], clusterProForm["rarange_num"], 0, 100, 0.01, 100, false, false);
  //linkInputs(clusterProForm["decmotion"], clusterProForm["decmotion_num"], 0, 100, 0.01, 50, false, false);
  //linkInputs(clusterProForm["decrange"], clusterProForm["decrange_num"], 0, 100, 0.01, 100, false, false);

  rangeCheckControl(true);
  clusterProCheckControl();

  //add invisible box under the x axis of the charts to shift the buttons down
  //document.getElementById('chart-div1').style.marginBottom = "10px";
  //document.getElementById('chart-div2').style.marginBottom = "10px";
  document.getElementById('chart-div3').style.marginBottom = "8px";
  document.getElementById('chart-div4').style.marginBottom = "8px";

  //declare graphScale limits
  let graphMinMax = new graphScale(2);

  // create table
  const container = document.getElementById("table-div");
  const hot = defaultTable(container)
      // unhide table whenever interface is selected
      document.getElementById("chart-type-form").addEventListener("click", () => {
        container.style.display = "block";
        document.getElementById('add-row-button').hidden = false;
        document.getElementById('file-upload-button').hidden = false;
        });
  // create chart
  const ctx1 = (document.getElementById("myChart3") as HTMLCanvasElement).getContext('2d');

  const myChart1 = new Chart(ctx1, {
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
      aspectRatio: 1.1175,
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
            top: -3,
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
  //make a function that disables the distrange slider if the distrangeCheckbox is not checked

  const ctx2 = (document.getElementById("myChart4") as HTMLCanvasElement).getContext('2d');

  const myChart2 = new Chart(ctx2, {
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
      aspectRatio: 1.1175,
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
            top: 9,
            bottom: -10,
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

  const myChart3 = new Chart(ctx3, {
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
        {
          type: "scatter",
          label: "properMotionRaDec",
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
        {
          type: "line",
          label: "rarangeleft",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 6,
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "rarangeright",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 5,
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "decrangetop",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 'start',
          showLine: true,
          pointRadius: 2,
          pointHoverRadius: 7,
          immutableLabel: true,
          parsing: {}
        },
        {
          type: "line",
          label: "decrangebottom",
          data: [{ x: 0, y: 0 }],
          backgroundColor: colors["gray"],
          borderColor: colors["gray"],
          borderWidth: 1,
          fill: 'end',
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
      aspectRatio: 1.43,
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
            // mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            // mode: 'x',
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

  //pull the proper motion ra and dec values from the table
  //change the default font size of myChart2
  //create graph control buttons and assign onZoom onPan functions to deactivate radio button selections
  let graphControl = new ChartScaleControl([myChart1, myChart2], modelForm, graphMinMax);
  myChart1.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(modelForm)};
  myChart1.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(modelForm)};
  myChart2.options.plugins.zoom.zoom.onZoom = ()=>{graphControl.zoompanDeactivate(modelForm, 1)};
  myChart2.options.plugins.zoom.pan.onPan = ()=>{graphControl.zoompanDeactivate(modelForm, 1)};
  let frameChart1 = ()=>{document.getElementById('frameChart1').click()};
  let frameChart2 = ()=>{document.getElementById('frameChart2').click()};
  document.getElementById('chart-div3').onmousedown = frameChart1;
  document.getElementById('chart-div4').onmousedown = frameChart2;
  let minmax = proFormMinmax(hot, modelForm)
  //myChart3.update();
  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart1.data.datasets[2].backgroundColor = HRrainbow(myChart1,
        modelForm["red"].value, modelForm["blue"].value);
      myChart2.data.datasets[2].backgroundColor = HRrainbow(myChart2,
            modelForm["red2"].value, modelForm["blue2"].value);
      myChart1.update();
      myChart3.update();
      myChart2.update();
      updateTableHeight(hot);
    }, 10)
  }
  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    updateScatter(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax, -1, clusterProForm);
    updateClusterProScatter(hot, myChart3, modelForm, clusterForm)
  };
  // link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);

  //clusterProPmChartControl.onclick = throttle(() => {
      //clusterProButtonControl(myChart3, minmax);
      //},
    //frameTime);
    clusterProButtonControl(myChart3, hot, modelForm);
  clusterForm.oninput = throttle(
    function () {
      updateScatter(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax, -1, clusterProForm);
      updateClusterProScatter(hot, myChart3, modelForm, clusterForm)
      },
    frameTime);

  //update the graph continuoustly when the values in the form change
  clusterProForm.oninput = throttle( ()=>{
    updateChart2(myChart3, clusterProForm, minmax)
    updateScatter(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax, -1, clusterProForm);
  }, frameTime)

  // link chart to model form (slider + text)
  // modelForm.oninput=
  modelForm.oninput = throttle(function () {
    updateHRModel(modelForm, hot, [myChart1, myChart2], (chartNum: number) => {
      updateScatter(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax, chartNum, clusterProForm);
      updateClusterProScatter(hot, myChart3, modelForm, clusterForm)
    });
   }, 100);

  document.getElementById('save-data-button').onclick = ()=>{clusterFileDownload(hot, [myChart1, myChart2], clusterForm, modelForm, [2, 2], graphMinMax, -1, clusterProForm)}
   //clusterProPmChartControl.oninput = throttle(function () {
    //clusterProButtonControl(myChart3);
  //}, 100);


  //initializing website
  update();
  updateHRModel(modelForm, hot, [myChart1, myChart2]);
  document.getElementById("extra-options").style.display = "block";
  document.getElementById("standardView").click();
  myChart3.options.scales["x"].title.text = "Motion in RA (mas/yr)";
  myChart3.options.scales["y"].title.text = "Motion in Dec (mas/yr)";
  myChart1.options.plugins.title.text = "Title";
  myChart1.options.scales["x"].title.text = "x1";
  myChart1.options.scales["y"].title.text = "y1";
  myChart2.options.scales["x"].title.text = "x2";
  myChart2.options.scales["y"].title.text = "y2";
  updateProForm(minmax, clusterProForm)
  updateClusterProScatter(hot, myChart3, modelForm, clusterForm)
  chart2Scale(myChart3, minmax)
  updateChart2(myChart3, clusterProForm, minmax)
  updateLabels(myChart1, document.getElementById("chart-info-form") as ChartInfoForm, false, false, false, false, 0);
  updateLabels(myChart2, document.getElementById("chart-info-form") as ChartInfoForm, false, false, false, false, 1);
  const chartTypeForm = document.getElementById('chart-type-form') as HTMLFormElement;
  document.getElementById('rarangeCheck').click()
  document.getElementById('rarangeCheck').click()
  chartTypeForm.addEventListener("change" , function () {
    //destroy the chart
    //testing a bunch of creating charts and destroying them to make the thing work
    myChart3.destroy();
    myChart1.destroy();
    myChart2.destroy();
  });
  //console log tabledata
  //console.log(minmax[8]);
  //console.log(minmax[4]);
  return [hot, [myChart1, myChart2, myChart3], modelForm, graphMinMax, clusterProForm];
  
}

export function updateProForm(minmax: number[], clusterProForm: ClusterProForm ) {
  let maxRa = floatTo1(minmax[0]);
  let minRa = floatTo1(minmax[1]);
  let maxDec = floatTo1(minmax[2]);
  let minDec = floatTo1(minmax[3]);
  let medRa = floatTo1(minmax[4]);
  let medDec = floatTo1(minmax[5]);
  let stdRa = floatTo1(minmax[6]);
  let stdDec = floatTo1(minmax[7]);
  linkInputs(clusterProForm["ramotion"], clusterProForm["ramotion_num"], minRa, maxRa, 0.1, medRa, false, true, -999, 999);
  linkInputs(clusterProForm["rarange"], clusterProForm["rarange_num"], 0, (2*stdRa), 0.1, (2*stdRa), false, true, 0, 999);
  linkInputs(clusterProForm["decmotion"], clusterProForm["decmotion_num"], minDec, maxDec, 0.1, medDec, false, true, -99, 999);
  linkInputs(clusterProForm["decrange"], clusterProForm["decrange_num"], 0, (2*stdDec), 0.1, (2*stdDec), false, true, 0, 999);
  //make sliders precise to the nearest thousandth
  clusterProForm["ramotion"].step = "0.001";
  clusterProForm["decmotion"].step = "0.001";
  clusterProForm["rarange"].step = "0.001";
  clusterProForm["decrange"].step = "0.001";

}

export function proFormMinmax(hot: Handsontable, modelForm: ModelForm){
  let tableData2 = hot.getData();
  let columns = hot.getColHeader();
  let blueKey = modelFormKey(1, 'blue');
  //let minRa = Math.min(...tableData2.map(row=> row[columns.indexOf(modelForm[blueKey].value + " pmra")]));
  //let minDec = Math.min(...tableData2.map(row => row[columns.indexOf(modelForm[blueKey].value + " pmdec")]));
  //make an array of all the ra values in numerical order from smallest to largest
  let raArray = tableData2.filter((numList) => numList[0] !== null).map(row => row[columns.indexOf(modelForm[blueKey].value + " pmra")]).sort((a, b) => a - b);
  //find the number in the array that is in the middle, if there are an even number of values, take the average of the two middle values
  let raArrayLength = raArray.length;
  let raArraHalfLength = Math.floor(raArrayLength/2);
  let medRa = 0;
  if (raArrayLength % 2 === 0) {
    medRa = (raArray[raArraHalfLength] + raArray[raArraHalfLength - 1])/2;
  } else {
    medRa = raArray[raArraHalfLength];
  }
  let raArrayAbs = raArray.map(row => Math.abs(row - medRa)).sort((a, b) => a - b);
  //make an array of all the dec values
  let decArray = tableData2.map(row => row[columns.indexOf(modelForm[blueKey].value + " pmdec")]).sort((a, b) => a - b);
  //find the number in the array that is in the middle, if there are an even number of values, take the average of the two middle values
  let decArrayLength = decArray.length;
  let decArraHalfLength = Math.floor(decArrayLength/2);
  let medDec = 0;
    if (decArrayLength % 2 === 0) {
      medDec = (decArray[decArraHalfLength] + decArray[decArraHalfLength - 1])/2;
    } else {
      medDec = decArray[raArraHalfLength];
    }
      //make an array of the absolute value of the dec values minus the median
  let decArrayAbs = decArray.map(row => Math.abs(row - medDec)).sort((a, b) => a - b);
  //find the 68.3% of values in the dec array
  let decArray68 = decArrayAbs.slice(Math.floor(decArrayLength*0), Math.ceil(decArrayLength*0.683));
  //find the mean of this array
  //let decArray68Mean = decArray68.reduce((a, b) => a + b, 0) / decArray68.length;
  //find the standard deviation of the dec out of all stars
  let stdDec = 0;
  for (let i = 0; i < decArray68.length; i++) {
    stdDec += Math.pow(decArray68[i], 2);
  }
  stdDec = Math.sqrt(stdDec / decArray68.length);
  //find the middle 68.3% of values in the ra array
  let raArray68 = raArrayAbs.slice(Math.floor(raArrayLength*0), Math.ceil(raArrayLength*0.683));
  //let raArray68Mean = raArray68.reduce((a, b) => a + b, 0) / raArray68.length;
  //find the standard deviation of the dec out of all stars
  let stdRa = 0;
  for (let i = 0; i < raArray68.length; i++) {
    stdRa += Math.pow(raArray68[i], 2);
  }
  stdRa = Math.sqrt(stdRa / raArray68.length);
  let maxRa = medRa + (2*stdRa);
  let maxDec = medDec + (2*stdDec);
  let minRa = medRa - (2*stdRa);
  let minDec = medDec - (2*stdDec);
  //report all values to the nearest thousandth
  maxRa = floatTo1(maxRa);
  minRa = floatTo1(minRa);
  maxDec = floatTo1(maxDec);
  minDec = floatTo1(minDec);
  medRa = floatTo1(medRa);
  medDec = floatTo1(medDec);
  stdRa = floatTo1(stdRa);
  stdDec = floatTo1(stdDec);
  return [maxRa, minRa, maxDec, minDec, medRa, medDec, stdRa, stdDec, raArray68.length];
}

export function updateChart2(myChart2: Chart, clusterProForm: ClusterProForm, minmax: number[]) {
  let ramotion_num = parseFloat(clusterProForm["ramotion_num"].value);
  let decmotion_num = parseFloat(clusterProForm["decmotion_num"].value);
  let rarange_num = parseFloat(clusterProForm["rarange_num"].value);
  let decrange_num = parseFloat(clusterProForm["decrange_num"].value);
  let maxRa = minmax[0]
  let minRa = minmax[1]
  let maxDec = minmax[2]
  let minDec = minmax[3]
  myChart2.data.datasets[0].data = [{x: maxRa+10000, y: decmotion_num}, {x: minRa-10000, y: decmotion_num}];
  myChart2.data.datasets[1].data = [{x: ramotion_num, y: maxDec+10000}, {x: ramotion_num, y: minDec-10000}];
  myChart2.data.datasets[3].data = [{x: ramotion_num-rarange_num, y: maxDec+10000}, {x: ramotion_num-rarange_num, y: minDec-10000}];
  myChart2.data.datasets[4].data = [{x: ramotion_num+rarange_num, y: maxDec+10000}, {x: ramotion_num+rarange_num, y: minDec-10000}];
  myChart2.data.datasets[5].data = [{x: maxRa+10000, y: decmotion_num-decrange_num}, {x: minRa-10000, y: decmotion_num-decrange_num}];
  myChart2.data.datasets[6].data = [{x: maxRa+10000, y: decmotion_num+decrange_num}, {x: minRa-10000, y: decmotion_num+decrange_num}];
  // chart2Scale(myChart2, minmax);
  myChart2.update();
}
//create a function that defines constant x and y scale values for the chart
export function chart2Scale (myChart2: Chart,  minmax: number[]) {
  let medRa = minmax[4]
  let medDec = minmax[5]
  let stdRa = minmax[6] 
  let stdDec = minmax[7]
  //make these values precise to the nearest thousandth
  //set the scales of the chart to match the new sensitivity fix
    //change xmax
    myChart2.options.scales["x"].max = medRa + (2*stdRa);
    //change ymax
    myChart2.options.scales["y"].max = medDec + (2*stdDec);
    //right now test with minimum values
    myChart2.options.scales['x'].min = medRa - (2*stdRa);
    myChart2.options.scales['y'].min = medDec - (2*stdDec); 
}
function floatTo1(num: number){
  return parseFloat(num.toFixed(1))
}
