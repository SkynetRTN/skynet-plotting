"use strict";

import Chart from "chart.js/auto";
import { ChartConfiguration, Filler, ScatterDataPoint, Tick} from "chart.js";
import zoomPlugin from 'chartjs-plugin-zoom';
import { backgroundPlugin } from "./chart-gravity-utils/background-image";
import { bufferAnimPlugin } from "./chart-gravity-utils/buffer-anim";
import { get_grav_spectrogram_server, get_grav_strain_server } from "./chart-gravity-utils/chart-gravity-file"
import Handsontable from "handsontable";
import {dummyData} from "./chart-gravity-utils/chart-gravity-dummydata";
import { tableCommonOptions, colors } from "./config";
import { pause, play, saveSonify, Set2DefaultSpeed} from "./sonification";

import {
  b64toBlob,
  linkInputs,
  throttle,
  updateLabels,
  updateTableHeight,
} from "./util";

import {updateGravModelData, extract_strain_model, sendDataToPass} from "./chart-gravity-utils/chart-gravity-model";
import {defaultModelData} from "./chart-gravity-utils/chart-gravity-defaultmodeldata";
import { chart2Scale } from "./chart-cluster3";

Chart.register(zoomPlugin);
Chart.register(Filler);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart[], gravityProClass]}:
 */
export function gravityPro(): [Handsontable, Chart[], gravityProClass] {
  document
    .getElementById("input-div")
    .insertAdjacentHTML(
      "beforeend",
      '<form title="Gravitational Wave Diagram" id="gravity-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Merger Time (sec):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Merger" name="merge"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Merger" name="merge_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Distance (Mpc):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance" name="dist"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Distance" name="dist_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Inclination (°):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Inclination" name="inc"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Inclination" name="inc_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Range:</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Range" name="rng"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Range" name="rng_num" class="field"></div>\n' +
        "</div>\n" +
        "</form>\n" +

        '<form title="Gravity Model Form" id="gravity-model-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Total Mass (solar):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Mass" name="mass"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Mass" name="mass_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-5 des">Mass Ratio:</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Ratio" name="ratio"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Ratio" name="ratio_num" class="field"></div>\n' +
        "</div>\n" +
        "</form>"
    );
      document.getElementById("below-table-column").insertAdjacentHTML("beforeend",
      '<button id="extract-data-button" disabled>Extract Data</button>'
      )

    document.getElementById("extra-options").insertAdjacentHTML("beforeend",
  '<div class = "row" style="float: right;">\n' +
      '<button class = "graphControl" id="panLeft" style = "position:relative; right:5px;"><class = "graphControl">&#8592;</></button>\n' +
      '<button class = "graphControl" id="panRight" style = "position:relative; right:5px;"><class = "graphControl">&#8594;</></button>\n' +
      '<button class = "graphControl" id="zoomIn" style = "position:relative; right:5px;"><class = "graphControl">&plus;</></button>\n' +
      '<button class = "graphControl" id="zoomOut" style = "position:relative; right:5px;"><class = "graphControl">&minus;</></button>\n' +
      '<button class = "graphControlAlt" id="Reset" style = "position:; top:1px; right:5px; padding: 0px;   width:50px; text-align: center;">Reset</button>\n'+
  '</div>\n')
  document.getElementById("extra-options").insertAdjacentHTML("beforeend",
  '<div style="float: right;">\n' +
  '<button id="sonify" style = "position: relative; left:2px;"/>Sonify</button>' +
  '<label style = "position:relative; right:163px;">Speed:</label>' +
  '<input class="extraoptions" type="number" id="speed" min="0" placeholder = "1" value = "1" style="position:relative; right:295px; width: 52px;" >' +
  '<button id="saveSonification" style = "position:relative; right:40px;"/>Save Sonification</button>' +
  '</div>\n'
  );

  const audioCtx = new AudioContext();
  var audioSource = new AudioBufferSourceNode(audioCtx);
  var audioControls = {
      speed: document.getElementById("speed") as HTMLInputElement,
      playPause: document.getElementById("sonify") as HTMLButtonElement,
      save: document.getElementById("saveSonification") as HTMLButtonElement
  }
  const sonificationButton = document.getElementById("sonify") as HTMLInputElement;
  const saveSon = document.getElementById("saveSonification") as HTMLInputElement;


    // let standardViewRadio = document.getElementById("standardView") as HTMLInputElement;
    let Reset = document.getElementById("Reset") as HTMLInputElement;
    let panLeft = document.getElementById("panLeft") as HTMLInputElement;
    let panRight = document.getElementById("panRight") as HTMLInputElement;
    let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
    let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;

    
    
    let pan: number;
    panLeft.onmousedown = function() {
        pan = setInterval( () => {myChart.pan(5)}, 20 )
    }
    panLeft.onmouseup = panLeft.onmouseleave = function() {
        clearInterval(pan);
    }
    panRight.onmousedown = function() {
        pan = setInterval( () => {myChart.pan(-5)}, 20 )
      }
    panRight.onmouseup = panRight.onmouseleave = function() {
        clearInterval(pan);
    }

      //handel zoom/pan buttons
      let zoom: number;
      zoomIn.onmousedown = function () {
        zoom = setInterval(() => { myChart.zoom(1.03) }, 20);
      }
      zoomIn.onmouseup = zoomIn.onmouseleave = function () {
        clearInterval(zoom);
      }
      zoomOut.onmousedown = function () {
        zoom = setInterval(() => { myChart.zoom(0.97); }, 20);
      }
      zoomOut.onmouseup = zoomOut.onmouseleave = function () {
        clearInterval(zoom);
      }
  // Link each slider with corresponding text box
  const gravityForm = document.getElementById("gravity-form") as GravityForm;

  const gravityModelForm = document.getElementById("gravity-model-form") as GravityModelForm;
  //Dont think we are using filterForm
 // const filterForm = document.getElementById("filter-form") as ModelForm;
 
  const tableData = dummyData;
  let gravClass = new gravityProClass();
  gravClass.setXbounds(Math.min(...tableData.map(t => t.Time)), Math.max(...tableData.map(t => t.Time)));
  let defaultMerge = (gravClass.getXbounds()[1] + gravClass.getXbounds()[0]) / 2;

  Reset.onclick = function(){
    myChart.options.scales = {
      x: {
        type: 'linear',
        position: 'bottom'
      }
    }

    let midpoint = (gravClass.getXbounds()[0] + gravClass.getXbounds()[1])/2
    gravityForm["merge_num"].value = '' + midpoint
    gravityForm["merge"].value = '' + midpoint
    gravClass.fitChartToBounds(myChart);
    myChart.update();
    gravClass.updateModelPlot(myChart, mySpecto, gravityForm)
  }

  //find out how to insert table data here later when you care
  linkInputs(gravityForm["merge"], gravityForm["merge_num"], 10, 20, 0.0005, defaultMerge);
  linkInputs(gravityForm["dist"],gravityForm["dist_num"],10,10000,0.01,300,true,true,10,1000000000000);
  linkInputs(gravityForm["inc"], gravityForm["inc_num"], 0, 90, 0.01, 0);
  linkInputs(gravityForm["rng"],gravityForm["rng_num"],0,0.1,0.001,0,false,true,0,10);
  linkInputs(gravityModelForm["mass"],gravityModelForm["mass_num"],2.5,250,0.01,25,true);
  linkInputs(gravityModelForm["ratio"],gravityModelForm["ratio_num"],1,10,0.1,1, true);

  document.getElementById('myChart').hidden = true;
  document.getElementById('grav-charts').style.display = 'inline';
  document.getElementById('axis-label1').style.display = 'inline';
  document.getElementById('axis-label2').style.display = 'inline';
  document.getElementById('axis-label3').style.display = 'inline';
  document.getElementById('axis-label4').style.display = 'inline';
  document.getElementById('axisSet1').className = 'col-sm-6';
  document.getElementById('axisSet2').style.display = 'inline';
  document.getElementById('xAxisPrompt').innerHTML = "X Axis";
  document.getElementById('yAxisPrompt').innerHTML = "Y Axis";
  const container = document.getElementById("table-div");
        // unhide table whenever interface is selected
        document.getElementById("chart-type-form").addEventListener("click", () => {
          container.style.display = "block";
          document.getElementById('add-row-button').hidden = false;
          document.getElementById('file-upload-button').hidden = false;
          });
  const hot = new Handsontable(
    container,
    Object.assign({}, tableCommonOptions, {
      data: tableData,
      colHeaders: ["Time", "Strain", 'WhitenedStrain'],
      columns: [
        {
          data: "Time",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 4 } },
        },
        {
          data: "Strain",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
        {
          data: "WhitenedStrain",
          type: "numeric",
          numericFormat: { pattern: { mantissa: 2 } },
        },
      ],
    })
  );
  // create chart
  const ctx1 = (
    document.getElementById("myGrav2") as HTMLCanvasElement
  ).getContext("2d");

  const chartOptions: ChartConfiguration = {
    type: "line",
    data: {
      datasets: [
        {
          label: 'Model',
          data: [],
          borderColor: colors['orange'],
          backgroundColor: colors['orange'],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
          fill: false,
          hidden: false,
          immutableLabel: true,
        },
        {
          label: 'Data',
          data: [],
          borderColor: colors['purple'],
          backgroundColor: colors['purple'],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
          fill: false,
          hidden: false,
          immutableLabel: false,
        },
        {
          label: 'Magnitude',
          data: [],
          borderColor: colors['red'],
          backgroundColor: colors['red'],
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
          fill: false,
          hidden: true,
          immutableLabel: false,
        },
      ],
      sonification:
      {
          audioContext: audioCtx,
          audioSource: audioSource,
          audioControls: audioControls
      },
    },
    options: {
      hover: {
        mode: "nearest",
      },
      scales: {
        x: {
          //label: 'time',
          type: "linear",
          position: "bottom",
          ticks:{
            precision: 5,
          },
        },
        y: {
          //label: 'grav stuff',
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
        title:
        {
          display: false,
        },
        legend:{
          labels:{
            filter(item, data) {
              if(item.text.includes("Magnitude") && data.datasets[2].hidden === true)
                return false
              else
                return true
            },
          },
        },
      },
    },
  };

  const myChart = new Chart(ctx1, chartOptions) as Chart<'line'>;
console.log(colors['bright'])
  const spectoOptions: ChartConfiguration = {
    type: "line",
    data: {
      datasets: [
        {
          label: 'Model',
          data: [] as {x: number, y: number}[], //define data format here so we can use it later
          borderColor: 'rgba(255, 238, 81, 0.5)',
          backgroundColor: 'rgba(255, 238, 81, 0.5)',
          pointRadius: 0,
          borderWidth: 0,
          tension: 0.1,
          hidden: false,
          immutableLabel: true,
        },
        {
          label: 'upper',
          data: [],
          borderColor: colors['bright'],
          backgroundColor: 'rgba(255, 238, 81, 0.5)',
          pointRadius: 0,
          borderWidth: 0.5,
          tension: 0.1,
          fill: 2,
          hidden: false,
          immutableLabel: true,
        },
        {
          label: 'lower',
          data: [],
          borderColor: colors['bright'],
          backgroundColor: 'rgba(255, 238, 81, 0.5)',
          pointRadius: 0,
          borderWidth: 0.5,
          tension: 0.1,
          hidden: false,
          immutableLabel: true,
        },
      ],
    },
    plugins: [backgroundPlugin, bufferAnimPlugin, {id: 'callback', beforeUpdate: (chart,args,options) => 
    {
      let rng = parseFloat((document.getElementById("gravity-form") as GravityForm)["rng_num"].value)/2;
      chart.data.datasets[1].data = []
      chart.data.datasets[2].data = []
        chart.data.datasets[0].data.forEach( (p: ScatterDataPoint) => {
          //create upper and lower bounds
          chart.data.datasets[1].data.push( {x: p.x, y: (p.y*Math.pow(10,rng))} as ScatterDataPoint);
          chart.data.datasets[2].data.push( {x: p.x, y: (p.y*Math.pow(10,-rng))} as ScatterDataPoint);
        })
  }}],
    options: {
      hover: {
        mode: "nearest",
      },
      scales: {
        x: {
          //label: 'time',
          type: "linear",
          position: "bottom",
          grid:
          {
            color: colors["gray"]
          },
          ticks:{
            precision: 5,
            // callback(tickValue: number, index, ticks: Tick[]) {
            //   var x = ticks[0].value
            //   return tickValue - x;//Round to two decimals. IDK why this is necessary, these numbers should already be to 3 places.
            // },
          },
        },
        y: {
          //label: 'grav stuff',
          type: "logarithmic",
          reverse: false,
          suggestedMin: 0,
          grid:
          {
            color: colors["gray"]
          }
        },
        z: {
          type: "linear",
          position: "right",
          min: 0,
          max: 25,
          weight: 100,
          grid: {
            display: false
          },
          ticks: {
            //we have to move the ticks over
            callback: function(value, index, ticks) {
                return '\t\t ' + value;
            }
          },
        }
      },
      plugins: {
        legend: {
          labels: {
            //We don't want "upper" and "lower" in the legend. this hides.
            filter(item, data) {
              if(item.text.includes('upper') || item.text.includes('lower'))
              {
                return false;
              }
              else
                return true;
            },
          }
        },
        zoom: {
          pan: {
            enabled: false,
            mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: false,
            },
            mode: 'x',
          },
        },
        background: {
          image: null
        },
        buffer: {
          image: "./assets/waitbear.gif"
        }
      },
    },
  };

  const ctx2 = (
    document.getElementById("myGrav1") as HTMLCanvasElement
  ).getContext("2d");
  const mySpecto = new Chart(ctx2, spectoOptions) as Chart<'line'>;

  document.getElementById('chart-div').style.cursor = "move";
  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    updateDataPlot(hot, myChart);
    updateGravModelData(gravityModelForm, (strainData : number[][], freqData : number[][], data : number[][], totalMassDivGrid : number) => {
        gravClass.plotNewModel(myChart, mySpecto, gravityForm, strainData, freqData, totalMassDivGrid);
      })
    gravClass.fitChartToBounds(myChart)
    console.log(mySpecto.data.datasets[0])
  };

  //link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });

  gravityModelForm.oninput = throttle(
    function () {updateGravModelData(gravityModelForm, (modelData : number[][], freqData : number[][], data : number[][], totalMassDivGrid : number) => 
      gravClass.plotNewModel(myChart, mySpecto, gravityForm, modelData, freqData, totalMassDivGrid));},
     200);

  gravityForm.oninput = throttle(function () {
    gravClass.updateModelPlot(myChart, mySpecto, gravityForm)}, 100)
  


  update();
  myChart.options.scales["x"].title.text = "x";
  myChart.options.scales["y"].title.text = "y";
  mySpecto.options.plugins.title.text = "Title";
  mySpecto.options.scales["x"].title.text = "x";
  mySpecto.options.scales["y"].title.text = "y";
  updateLabels(
    mySpecto,
    document.getElementById("chart-info-form") as ChartInfoForm,
    false,
    false,
    false,
    false
  );
  updateLabels(
    myChart,
    document.getElementById("chart-info-form") as ChartInfoForm,
    false,
    false,
    false,
    false,
    1
  );

  sonificationButton.onclick = () => play(myChart);
  saveSon.onclick = () => saveSonify(myChart);


//Clean-up event listener. Only runs once, when page is changed.
  document.getElementById('chart-type-form').addEventListener("change" , function () {
    //destroy the chart
    //testing a bunch of creating charts and destroying them to make the thing work
    mySpecto.destroy();
    myChart.destroy();
    let elm = document.getElementById('extract-data-button')
    elm.parentElement.removeChild(elm);
  }, {once: true} );

  return [hot, [myChart, mySpecto], gravClass];
}

function updateTable(table: Handsontable, data: number[][], whitenedStrain: number[]){
  //table.populateFromArray(1, 1, data)
  let data_dict : {[key: string]: number }[] = [];

  let min = 100000000000;
  let max = 0;
  for (let i = 0; i < data.length; i++){
    data_dict.push({'Time' : data[i][0], 'Strain' : data[i][1], 'WhitenedStrain' : whitenedStrain[i]})
    if (data[i][0] < min){
      min = data[i][0]
    }
    if (data[i][0] > max){
      max = data[i][0]
    }
  }
  table.loadData(data_dict)
  return [min, max]
}

/**
 * updates the data plot using the data in the Henderson table
 * @param table
 * @param myChart
 */
function updateDataPlot(
    table: Handsontable,
    myChart: Chart) {
  let start = 0;
  //data on chart 1
  let chart = myChart.data.datasets[1].data;
  let tableData = table.getData();

    for (let i = 0; i < tableData.length; i++) {
      if (
      tableData[i][0] === null ||
      tableData[i][1] === null
      ) {
      continue;
        }

    let x = (tableData[i][0]);
    let y = (tableData[i][1])
    chart[start++] = {
      x: x,
      y: y,
        };
  }
  myChart.update()
}

let timeZero = 0
export function gravityProFileUpload(
  evt: Event,
  table: Handsontable,
  myCharts: Chart<"line">[],
  gravClass: gravityProClass
) 
{

  const file = (evt.target as HTMLInputElement).files[0];

  if (file === undefined) {
    return;
  }

  // File type validation
  if (
    !file.name.match(".*.hdf5")
       // !file.name.match("16") ||
       // !file.name.match("32")
  ) {
    alert("Please upload a 16Khz, 32s, .hdf5 file. Can be found at https://www.gw-openscience.org/eventapi/html/allevents/");
    return;
  }
//begin load animation
//we stop these IN the functions, because they are asynchronus and the anim will stop instantly if we don't
  myCharts[1].startBuffer()

  console.log("getting strain server...")
  get_grav_strain_server(file, (response: string) => {
    let json = JSON.parse(response);
    let whitenedStrain = json['whitenedStrain'];
    let time = json['time'];
  
    // Combine time and whitenedStrain into a new dataset
    let dataset: number[][] = [];
    for (let i = 0; i < time.length; i++) {
      dataset.push([time[i], whitenedStrain[i]]);
    }
  
    // Continue with the rest of the code using the combined dataset
    console.log('Combined dataset:', dataset);
  
    let timeZero = Math.ceil(dataset[0][0]);
    console.log('data[0][0]: ', dataset[0][0]);
  
    // Change the scaling of time values to match the LIGO data site, starting from 0
    for (let i = 0; i < dataset.length; i++) {
      dataset[i][0] = dataset[i][0] - timeZero;
    }
  
    let [min, max] = updateTable(table, dataset, whitenedStrain);
    let midpoint = (min + max) / 2;
    let view_buffer = (max - min) * 0.20;
    gravClass.setXbounds(midpoint - view_buffer, midpoint + view_buffer);
    const gravityForm = document.getElementById("gravity-form") as GravityForm;
  
    // Continue with the remaining code for updating the plots, fitting the chart bounds, and updating the model plot
    updateDataPlot(table, myCharts[0]);
    gravClass.fitChartToBounds(myCharts[0]);
    gravClass.updateModelPlot(myCharts[0], myCharts[1], gravityForm);
  });

  console.log("getting spectrogram...")
  get_grav_spectrogram_server(file, (response: XMLHttpRequest) => {
    //define graph bounds
    let r = response.response;
    let strarr = r.bounds.split(" ")
    //can change the display of the spectrogram here like this, but i'm going to try to maniupulate the freq table data (actually, just subtract from x0)
    //i believe these changes are good, should be fine to continue down the list
    myCharts[1].options.scales.x.min = parseFloat(strarr[0].replace('(','')) - timeZero
    myCharts[1].options.scales.x.max = parseFloat(strarr[1]) - timeZero
    myCharts[1].options.scales.y.min = parseFloat(strarr[2].replace('(',''))
    myCharts[1].options.scales.y.max = parseFloat(strarr[3]);

    let mergeLow = parseFloat(strarr[0].replace('(','')) - timeZero
    let mergeHigh = parseFloat(strarr[1]) - timeZero
    let mergeMid = (mergeLow + mergeHigh) / 2

    const gravityForm = document.getElementById("gravity-form") as GravityForm;
    linkInputs(gravityForm["merge"], gravityForm["merge_num"], mergeLow, mergeHigh, 0.0005, mergeMid);

    (document.getElementById("extract-data-button") as HTMLButtonElement).disabled = false
    document.getElementById("extract-data-button").onclick = () => {
      (document.getElementById("extract-data-button") as HTMLButtonElement).disabled = true;

      setTimeout(function () {
      myCharts[0].data.datasets[2].data =
        extract_strain_model(r.spec_array, 
        myCharts[1],
        parseFloat(r.x0) - timeZero, parseFloat(r.dx), parseFloat(r.y0), parseFloat(r.dy));

        //myCharts[0].data.datasets[1].hidden = true;
        myCharts[0].data.datasets[2].hidden = false;
        myCharts[0].update();
        (document.getElementById("extract-data-button") as HTMLButtonElement).disabled = false;
        }, 100);
    }

    updateDataPlot(table, myCharts[0]);
    gravClass.fitChartToBounds(myCharts[0]);
    gravClass.updateModelPlot(myCharts[0], myCharts[1], gravityForm);
    //console.log("Implementing background")
    //decode the spectogram
    myCharts[1].options.plugins.background.image = b64toBlob(response.response.image.split("'")[1].slice(0,-2), "image/png")
    myCharts[1].update()

    myCharts[1].endBuffer()
    //console.log("background complete")
  })
  console.log("success")
  
}

export class gravityProClass {
  currentModelData : number[][];
  currentFreqData : number[][];
  totalMassDivGridMass : number;
  minX : number;
  maxX : number;
  xBuffer : number;
  constructor(){
    this.currentModelData = defaultModelData;
    this.currentFreqData = defaultModelData;
    this.totalMassDivGridMass = 1;
  }

  public updateModelPlot(
      myChart: Chart,
      mySpecto: Chart,
      gravityForm: GravityForm) {
    let inc = parseFloat(gravityForm["inc_num"].value);
    let dist = parseFloat(gravityForm["dist_num"].value);
    let merge = parseFloat(gravityForm["merge_num"].value);


    //default d0 for now
    let d0 = 100;

    let start = 0;
    //model data stored in chart 0
    let modelChart = myChart.data.datasets[0].data;
    let freqChart = mySpecto.data.datasets[0].data;

    for (let i = 0; i < this.currentModelData.length; i++) {
      if ((this.currentModelData[i][0] === null) || (this.currentModelData[i][1] === null)) {
        continue;
      }
      modelChart[start++] = {
        x: this.currentModelData[i][0] * this.totalMassDivGridMass + merge,
        y: this.currentModelData[i][1] * this.totalMassDivGridMass * (1-0.5*Math.sin(inc*(Math.PI/180)))*(d0 / dist),
      };
    }
    while (modelChart.length !== start) {
      modelChart.pop();
    }

    start = 0;

    for (let i = 0; i < this.currentFreqData.length; i++) {
      if ((this.currentFreqData[i][0] === null) || (this.currentFreqData[i][1] === null)) {
        continue;
      }
      freqChart[start++] = {
        x: this.currentFreqData[i][0]*(this.totalMassDivGridMass) + merge,
        y: this.currentFreqData[i][1]/(this.totalMassDivGridMass)
      };
    }
    while (freqChart.length !== start) {
      freqChart.pop();
    }
   // this.fitChartToBounds(myChart);
    myChart.update("none")
    mySpecto.update("none")
  }


  public setXbounds(minX:number, maxX:number){
    this.minX = minX;
    this.maxX = maxX;
    this.xBuffer = Math.round(maxX - minX) * 0.15;
  }

  public fitChartToBounds(myChart: Chart){
    myChart.options.scales['x'].min = this.minX - this.xBuffer;
    myChart.options.scales['x'].max = this.maxX + this.xBuffer;
  }

  public getXbounds(){
    return [this.minX, this.maxX]
  }

  public plotNewModel(myChart: Chart,
                        mySpecto: Chart,
                        gravityForm: GravityForm,
                        modelData: number[][], freqData: number[][], totalMassRatio: number){
    this.currentModelData = modelData
    this.currentFreqData = freqData
    this.totalMassDivGridMass = totalMassRatio
    this.updateModelPlot(myChart, mySpecto, gravityForm)
  }
}