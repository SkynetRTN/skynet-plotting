"use strict";

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import { ScatterDataPoint } from "chart.js";
import {
  calculateLambda,
  dummyData,
  filterMags,
  filterWavelength,
  HRModelRounding,
  HRrainbow,
  httpGetAsync,
  pointMinMax
} from "./chart-cluster-util";
import { colors, tableCommonOptions } from "./config";
import { changeOptions, linkInputs, throttle, updateLabels, updateTableHeight, } from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
import {median} from "./my-math";
// import { rad } from "./my-math";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart]}:
 */
 //testing a bunch of creating charts and destroying them to make the thing work
//const bajukabog = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');
//var myChart = new Chart(bajukabog, { type: 'bar', data: null, options: null });
//myChart.destroy();

//const bajukabog1 = (document.getElementById("myChart1") as HTMLCanvasElement).getContext('2d');
//var myChart = new Chart(bajukabog1, { type: 'bar', data: null, options: null });
//myChart.destroy();

//const bajukabog2 = (document.getElementById("myChart2") as HTMLCanvasElement).getContext('2d');
//var myChart = new Chart(bajukabog2, { type: 'bar', data: null, options: null });
//myChart.destroy();

//const bajukabog3 = (document.getElementById("myChart3") as HTMLCanvasElement).getContext('2d');
//var myChart = new Chart(bajukabog3, { type: 'bar', data: null, options: null });
//myChart.destroy();

//const bajukabog4 = (document.getElementById("myChart4") as HTMLCanvasElement).getContext('2d');
//var myChart = new Chart(bajukabog4, { type: 'bar', data: null, options: null });
//myChart.destroy();
export function cluster2(): [Handsontable, Chart, Chart, ModelForm] {
  document
    .getElementById("input-div")
    .insertAdjacentHTML(
      "beforeend",
      '<form title="Cluster Diagram" id="cluster-form">\n' +
      '<div class="row">\n' +
      '<div class="col-sm-5 des">Max Error (mag):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Error" name="err"></div>\n' +
      '<div class="col-sm-3 text"><input type="number" title="Error" name="err_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-5 des">Distance (kpc):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Distance" name="d"></div>\n' +
      '<div class="col-sm-3 text"><input type="number" title="Distance" name="d_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-5 des">Extinction in V (mag):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Reddening" name="red"></div>\n' +
      '<div class="col-sm-3 text"><input type="number" title="Reddening" name="red_num" class="field"></div>\n' +
      "</div>\n" +
      "</form>\n" +
      '<form title="Filters" id="model-form" style="padding-bottom: .5em">\n' +
      '<div class="row">\n' +
      '<div class="col-sm-5 des">log(Age (yr)):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Age" name="age"></div>\n' +
      '<div class="col-sm-3 text"><input type="number" title="Age" name="age_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-5 des">Metallicity (solar):</div>\n' +
      '<div class="col-sm-4 range"><input type="range" title="Metallicity" name="metal"></div>\n' +
      '<div class="col-sm-3 text"><input type="number" title="Metallicity" name="metal_num" class="field"></div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-6" style="color: grey;">Select Filters:</div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-4">Blue:</div>\n' +
      '<div class="col-sm-4">Red:</div>\n' +
      '<div class="col-sm-4">Luminosity:</div>\n' +
      "</div>\n" +
      '<div class="row">\n' +
      '<div class="col-sm-4"><select name="blue" style="width: 100%;" title="Select Blue Color Filter">\n' +
      '<option value="B" title="B filter" selected>B</option></div>\n' +
      '<option value="V" title="V filter">V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter">I</option></select></div>\n' +
      '<div class="col-sm-4"><select name="red" style="width: 100%;" title="Red Color Filter">\n' +
      '<option value="B" title="B filter">B</option></div>\n' +
      '<option value="V" title="V filter" selected>V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter">I</option></select></div>\n' +
      '<div class="col-sm-4"><select name="lum" style="width: 100%;" title="Select Luminosity Filter">\n' +
      '<option value="B" title="B filter">B</option></div>\n' +
      '<option value="V" title="V filter" selected>V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter" >I</option></select></div>\n' +
      '<div class="col-sm-4"><select name="blue2" style="width: 100%;" title="Select Blue Color Filter">\n' +
      '<option value="B" title="B filter" selected>B</option></div>\n' +
      '<option value="V" title="V filter">V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter">I</option></select></div>\n' +
      '<div class="col-sm-4"><select name="red2" style="width: 100%;" title="Red Color Filter">\n' +
      '<option value="B" title="B filter">B</option></div>\n' +
      '<option value="V" title="V filter" selected>V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter">I</option></select></div>\n' +
      '<div class="col-sm-4"><select name="lum2" style="width: 100%;" title="Select Luminosity Filter">\n' +
      '<option value="B" title="B filter">B</option></div>\n' +
      '<option value="V" title="V filter" selected>V</option></div>\n' +
      '<option value="R" title="R filter">R</option></div>\n' +
      '<option value="I" title="I filter" >I</option></select></div>\n' +
      "</div>\n" +
      "</form>\n"
    );
    //make graph scaling options visible to users
    document.getElementById("extra-options").style.display = "inline"
    document.getElementById("extra-options").insertAdjacentHTML("beforeend",
    '<div style="float: right;">\n' +
    '<label class="scaleSelection" id="standardViewLabel" style="background-color: #4B9CD3;">\n' +
    '<input type="radio" class="scaleSelection" id="standardView" value="Standard View" checked />&nbsp;Standard View&nbsp;</label>\n' +
    '<label class="scaleSelection" id="frameOnDataLabel">\n' +
    '<input type="radio" class="scaleSelection" id="frameOnData" value="Frame on Data" />&nbsp;Frame on Data&nbsp;</label>\n' +
        '<button id="panLeft">◀</button>\n' +
        '<button id="panRight">▶</button>\n' +
        '<button id="zoomIn">➕</button>\n' +
        '<button id="zoomOut">&#10134;</button>\n' +
    '</div>\n'
    )
  // Link each slider with corresponding text box
  const clusterForm = document.getElementById("cluster-form") as ClusterForm;
  const modelForm = document.getElementById("model-form") as ModelForm;
  linkInputs(clusterForm["d"], clusterForm["d_num"], 0.1, 100, 0.01, 3, true);
  linkInputs(clusterForm["err"], clusterForm["err_num"],
    0,
    1,
    0.01,
    1,
    false,
    true,
    0,
    100000000
  );
  linkInputs(modelForm["age"], modelForm["age_num"], 6.6, 10.3, 0.01, 6.6);
  linkInputs(
    clusterForm["red"], clusterForm["red_num"],
    0,
    3,
    0.01,
    0,
    false,
    true,
    0,
    100000000
  );
  linkInputs(modelForm["metal"], modelForm["metal_num"],
    -3.4,
    0.2,
    0.01,
    -3.4
  );

  const tableData = dummyData;

  //handel scaling options input
  let standardViewRadio = document.getElementById("standardView") as HTMLInputElement;
  let frameOnDataRadio = document.getElementById("frameOnData") as HTMLInputElement;
  let panLeft = document.getElementById("panLeft") as HTMLInputElement;
  let panRight = document.getElementById("panRight") as HTMLInputElement;
  let zoomIn = document.getElementById('zoomIn') as HTMLInputElement;
  let zoomOut = document.getElementById('zoomOut') as HTMLInputElement;
  standardViewRadio.addEventListener("click", () => {
    radioOnclick(standardViewRadio, frameOnDataRadio);
  });
  frameOnDataRadio.addEventListener("click", () => {
    radioOnclick(frameOnDataRadio, standardViewRadio)
  });
   let pan: number;
   panLeft.onmousedown = function() {
     pan = setInterval( () => {myChart1.pan(5)}, 20 )
  }
  panLeft.onmouseup = panLeft.onmouseleave = function() {
    clearInterval(pan);
  }
  panRight.onmousedown = function() {
    pan = setInterval( () => {myChart1.pan(-5)}, 20 )
  }
  panRight.onmouseup = panRight.onmouseleave = function() {
    clearInterval(pan);
  }

  //handel zoom/pan buttons
  let zoom: number;
  zoomIn.onmousedown = function() {
    zoom = setInterval( () => {myChart1.zoom(1.03)} , 20);;
  }
  zoomIn.onmouseup = zoomIn.onmouseleave = function() {
    clearInterval(zoom);
  }
  zoomOut.onmousedown = function() {
    zoom = setInterval(()=>{myChart1.zoom(0.97);}, 20);;
  }
  zoomOut.onmouseup = zoomOut.onmouseleave = function() {
    clearInterval(zoom);
  }
  //only one option can be selected at one time. 
  //The selected option is highlighted by making the background Carolina blue
  function radioOnclick(radioOnClicked: HTMLInputElement, otherRadio: HTMLInputElement): any {
    radioOnClicked.checked = true;
    setRadioLabelColor(radioOnClicked, true)
    otherRadio.checked = false;
    setRadioLabelColor(otherRadio, false)

    graphScaleMode = radioOnClicked.id === "standardView" ? "auto" : "data"
    chartRescale(myChart1, modelForm)
    chartRescale2(myChart2, modelForm)
  }

//Alter radio input background color between Carolina blue and white
  function setRadioLabelColor(radio: HTMLInputElement, activate: boolean) {
    document.getElementById(radio.id + "Label").style.backgroundColor = activate ? "#4B9CD3" : "white"
  }
//remember you may have to change the dependencies here to work for the chart
  function zoompanDeactivate(): any {
    graphScaleMode = null
    standardViewRadio.checked = false;
    frameOnDataRadio.checked = false;
    setRadioLabelColor(standardViewRadio, false)
    setRadioLabelColor(frameOnDataRadio, false)
    setTimeout(function () {
      myChart1.data.datasets[2].backgroundColor = HRrainbow(myChart1,
        modelForm["red"].value, modelForm["blue"].value)
      myChart2.data.datasets[2].backgroundColor = HRrainbow(myChart2,
        modelForm["red2"].value, modelForm["blue2"].value)
      myChart2.update()
      myChart1.update()
    }, 5)

  }


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
  console.log('ayyo')
  const ctx1 = (document.getElementById("myChart1") as HTMLCanvasElement).getContext('2d');

  const myChart1 = new Chart(ctx1, {
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
            onPan: () => { zoompanDeactivate() },
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
            onZoom: () => { zoompanDeactivate() },
          },
        },
        legend: {
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
console.log('ayyo2')
  const ctx2 = (document.getElementById("myChart2") as HTMLCanvasElement).getContext('2d');

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
            onPan: () => { zoompanDeactivate() },
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
            onZoom: () => { zoompanDeactivate() },
          },
        },
        legend: {
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

  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart1.data.datasets[2].backgroundColor = HRrainbow(myChart1,
        modelForm["red"].value, modelForm["blue"].value)
      myChart2.data.datasets[2].backgroundColor = HRrainbow(myChart2,
            modelForm["red2"].value, modelForm["blue2"].value)
      //console.log("bingus")
      myChart1.update()
      myChart2.update()
    }, 10)
  }
console.log('ayyo3')
  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    console.log('bongus')
    updateScatter(
      hot,
      myChart1,
      myChart2,
      clusterForm,
      modelForm,
      2
    );
    console.log('bongus')
  };
console.log('bongus')
  // link chart to table
  hot.updateSettings({
    afterChange: update,
    afterRemoveRow: update,
    afterCreateRow: update,
  });
  console.log('bongus')
  const fps = 100;
  const frameTime = Math.floor(1000 / fps);

  clusterForm.oninput = throttle(
    function () { updateScatter(hot, myChart1, myChart2, clusterForm, modelForm, 2) },
    frameTime);

  // link chart to model form (slider + text)
  // modelForm.oninput=
  modelForm.oninput = throttle(function () {
    updateHRModel(modelForm, myChart1, hot, () => {
      updateScatter(hot, myChart1, myChart2, clusterForm, modelForm, 2)
      });
    updateHRModel2(modelForm, myChart2, hot, () => {
      updateScatter(hot, myChart1, myChart2, clusterForm, modelForm, 2)
      });
   }, 100);

  //initializing website

console.log('ayyo4.1')
   //figure out why this update is breaking the code and it does not break the code in the other one
  update();
  console.log('bongus')
  updateHRModel(modelForm, myChart1, hot);
  updateHRModel2(modelForm, myChart2, hot);
  document.getElementById("standardView").click();
console.log('ayyo4.2')
  myChart1.options.plugins.title.text = "Title";
  myChart1.options.scales["x"].title.text = "x";
  myChart1.options.scales["y"].title.text = "y";
  myChart2.options.plugins.title.text = "Title";
  myChart2.options.scales["x"].title.text = "x";
  myChart2.options.scales["y"].title.text = "y";
  console.log('bongus')
  updateLabels(
    myChart1,
    document.getElementById("chart-info-form") as ChartInfoForm,
    false,
    false,
    false,
    false
  );
  updateLabels(
    myChart2,
    document.getElementById("chart-info-form") as ChartInfoForm,
    false,
    false,
    false,
    false
);
console.log('bongus')
  return [hot, myChart1, myChart2, modelForm];
  
}
console.log('bongus')
/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 */
export function cluster2FileUpload(evt: Event, table: Handsontable, myChart1: Chart<'line'>, myChart2: Chart<"line">,) {
  // console.log("clusterFileUpload called");
  const file = (evt.target as HTMLInputElement).files[0];

  if (file === undefined) {
    return;
  }

  // File type validation
  if (
    !file.type.match("(text/csv|application/vnd.ms-excel)") &&
    !file.name.match(".*.csv")
  ) {
    console.log("Uploaded file type is: ", file.type);
    console.log("Uploaded file name is: ", file.name);
    alert("Please upload a CSV file.");
    return;
  }
console.log('ayyo6.1')
  const reader = new FileReader();
  reader.onload = () => {
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const modelForm = document.getElementById("model-form") as ModelForm;
    // console.log(clusterForm.elements['d'].value);
    clusterForm["d"].value = Math.log(3).toString();
    clusterForm["err"].value = "1";
    // console.log(clusterForm.elements['d'].value);
    clusterForm["err_num"].value = "1";
    modelForm["age"].value = "6.6";
    clusterForm["red"].value = "0";
    modelForm["metal"].value = "-3.4";
    clusterForm["d_num"].value = "3";
    modelForm["age_num"].value = "6.6";
    clusterForm["red_num"].value = "0";
    modelForm["metal_num"].value = "-3.4";
    myChart1.options.plugins.title.text = "Title";
    myChart1.data.datasets[2].label = "Data";
    myChart1.options.scales["x"].title.text = "x";
    myChart1.options.scales["y"].title.text = "y";
    myChart2.options.plugins.title.text = "Title";
    myChart2.data.datasets[2].label = "Data";
    myChart2.options.scales["x"].title.text = "x";
    myChart2.options.scales["y"].title.text = "y";
    updateLabels(
      myChart1,
      document.getElementById("chart-info-form") as ChartInfoForm,
      false,
      false,
      false,
      false
    );
    updateLabels(
      myChart2,
      document.getElementById("chart-info-form") as ChartInfoForm,
      false,
      false,
      false,
      false
    );

    const data: string[] = (reader.result as string)
      .split("\n")
      .filter((str) => str !== null && str !== undefined && str !== "");
    const datadict = new Map<string, Map<string, number>>(); // initializes a dictionary for the data
    let filters: string[] = [];
    data.splice(0, 1);
    //fills the dictionary datadict with objects for each source, having attributes of each filter magnitude
    for (const row of data) {
      let items = row.trim().split(",");
      let src = items[1];
      let filter = items[10] === "K" ? "Ks" : items[10];//interpret K as Ks
      let mag = parseFloat((items.length >= 24 && items[23] != '') ? items[23] : items[12]);//if no calibrated mag, return mag
      // let mag = parseFloat(items[12]);
      let err = parseFloat(items[13]);
      if (!datadict.has(src)) {
        datadict.set(src, new Map<string, number>());
      }
      if (items[12] !== "") {
        datadict.get(src).set(filter, isNaN(mag) ? null : mag);
        datadict.get(src).set(filter + "err", isNaN(err) ? 0 : err);
        if (!filters.includes(filter)) {
          filters.push(filter);
        }
      }
    }
    //add null values for sources that didn't show up under each filter
    for (const src of datadict.keys()) {
      for (const f of filters) {
        if (!datadict.get(src).has(f)) {
          datadict.get(src).set(f, null);
          datadict.get(src).set(f + "err", null);
        }
      }
    }

    const blue = modelForm["blue"];
    const red = modelForm["red"];
    const lum = modelForm["lum"];
    const blue2 = modelForm["blue2"];
    const red2 = modelForm["red2"];
    const lum2 = modelForm["lum2"];

    //Change filter options to match file

    //order filters by temperature
    const knownFilters = [
      "U",
      "uprime",
      "B",
      "gprime",
      "V",
      "vprime",
      "rprime",
      "R",
      "iprime",
      "I",
      "zprime",
      "Y",
      "J",
      "H",
      "Ks",
      "K",
    ];
    //knownFilters is ordered by temperature; this cuts filters not in the file from knownFilters
    filters = knownFilters.filter((f) => filters.indexOf(f) >= 0);
    //if it ain't known ignore it

    const optionList = [];
    const headers: any[] = [];
    const columns: any[] = [];
    let hiddenColumns: any[] = [];
    for (let i = 0; i < filters.length; i++) {
      //makes a list of options for each filter
      optionList.push({
        value: filters[i],
        title: filters[i] + " Mag",
        text: filters[i],
      });
      hiddenColumns[i] = i;
      hiddenColumns[i + filters.length] = i + filters.length; //we have to double up the length for the error data
      headers.push(filters[i] + " Mag"); //every other column is err
      headers.push(filters[i] + "err");
      columns.push({
        data: filters[i],
        type: "numeric",
        numericFormat: { pattern: { mantissa: 2 } },
      });
      columns.push({
        data: filters[i] + "err",
        type: "numeric",
        numericFormat: { pattern: { mantissa: 2 } },
      });
    }
    hiddenColumns = hiddenColumns.filter((c) => [0, 2].indexOf(c) < 0); //get rid of the columns we want revealed
    //Change the options in the drop downs to the file's filters
    //blue and lum are most blue by default, red is set to most red
    changeOptions(blue, optionList);
    changeOptions(red, optionList);
    //red.value = red.options[red.options.length-1].value;
    changeOptions(lum, optionList);
    changeOptions(blue2, optionList);
    changeOptions(red2, optionList);
    changeOptions(lum2, optionList);


    blue.value = filters[0];
    red.value = filters[1];
    lum.value = filters[1];
    blue2.value = filters[0];
    red2.value = filters[1];
    lum2.value = filters[1];

console.log('ayyo4')
    //convrt datadict from dictionary to nested number array tableData
    const tableData: { [key: string]: number }[] = [];
    datadict.forEach((src) => {
      const row: { [key: string]: number } = {};
      for (let filterIndex in filters) {
        row[filters[filterIndex]] = src.get(filters[filterIndex]);
        row[filters[filterIndex] + "err"] = src.get(
          filters[filterIndex] + "err"
        );
      }
      tableData.push(row);
    });
    //    console.log(tableData);


    updateHRModel(modelForm, myChart1, table,
      () => {
    table.updateSettings({
      data: tableData,
      colHeaders: headers,
      columns: columns,
      hiddenColumns: { columns: hiddenColumns },
    }); //hide all but the first 3 columns
    updateTableHeight(table);
    updateScatter(
      table,
      myChart1,
      myChart2,
      clusterForm,
      modelForm,
      2,
    );
    document.getElementById("standardView").click();
  });
  }
  reader.readAsText(file);
}
let graphScaleMode = "auto";
let graphScale: { [key: string]: number }[] = [
  {
    minX: NaN,
    maxX: NaN,
    minY: NaN,
    maxY: NaN,
  },
  {
    minX: NaN,
    maxX: NaN,
    minY: NaN,
    maxY: NaN,
  },
]
/**
 *  This function takes a form to obtain the 5 parameters (age, metallicity, red, blue, and lum filter)
 *  request HR diagram model from server and plot on the graph.
 *  @param table:   A table used to determine the max and min value for the range
 *  @param form:    A form containing the 5 parameters (age, metallicity, red, blue, and lum filter) 
 *  @param chart:   The Chartjs object to be updated.
 */
function updateHRModel(modelForm: ModelForm, chart: Chart, hot: Handsontable, callback: Function = () => { }) {
  let url = "http://localhost:5000/isochrone?"
    // let url = "https://skynet.unc.edu/graph-api/isochrone?"
    + "age=" + HRModelRounding(modelForm['age_num'].value)
    + "&metallicity=" + HRModelRounding(modelForm['metal_num'].value)
    + "&filters=[%22" + modelForm['blue'].value
    + "%22,%22" + modelForm['red'].value
    + "%22,%22" + modelForm['lum'].value + "%22]"

    function modelFilter(dataArray: number[][]): [ScatterDataPoint[], ScatterDataPoint[], { [key: string]: number }] {
      let form: ScatterDataPoint[] = [] //the array containing all model points
      let scaleLimits: { [key: string]: number } = { minX: NaN, minY: NaN, maxX: NaN, maxY: NaN, };
      let breakupIndex: number = 0;
      let deltas: number[] = [NaN];
      let maxDelta: number = 0;
      for (let i = 0; i < dataArray.length; i++) {
        let x_i: number = dataArray[i][0];
        let y_i: number = dataArray[i][1];
        let row: ScatterDataPoint = { x: x_i, y: y_i };
        scaleLimits = pointMinMax(scaleLimits, dataArray[i][0], dataArray[i][1]);
      form.push(row);
      if (i > 0) {
        let delta: number = ((x_i - dataArray[i - 1][0]) ** 2 + (y_i - dataArray[i - 1][1]) ** 2) ** 0.5;
        deltas.push(delta);
      }
    }
    let medianValue = median(deltas);
    form.pop();
    deltas.shift();
    for (let i = 0; i < deltas.length; i ++) {
      if (deltas[i] > medianValue) {
        form.shift();
        deltas.shift();
      } else {
        break;
      }
    }
    for (let i = deltas.length; i >= 0; i--) {
      let deltaOutOfRange: boolean = false;
      for (let j = 0; j < 10; j++) {
        if (deltas[i-j] > medianValue) {
          deltaOutOfRange = true;
          break;
        }
      }
      if (deltaOutOfRange) {
        form.pop();
        deltas.pop();
      } else {
        break;
      }
    }
    for (let i = 40; i < deltas.length; i++) {
      if (deltas[i] > maxDelta) {
        maxDelta = deltas[i];
        breakupIndex = i+1;
      }
    }
    // console.log(deltas);
    // console.log(maxDelta + ' ' + breakupIndex);
    if (maxDelta < 10 * medianValue) {
      breakupIndex = 0;
    }
    return [form.slice(0, breakupIndex), form.slice(breakupIndex), scaleLimits]
    }
    httpGetAsync(url, (response: string) => {
      let dataTable: number[][] = JSON.parse(response);
      chart.data.datasets[0].data = modelFilter(dataTable)[0];
      chart.data.datasets[1].data = modelFilter(dataTable)[1];
    chart.update("none");
    callback();
    if (graphScaleMode === "model") {
      graphScale[0] = modelFilter(dataTable)[2];
    chartRescale(chart, modelForm);
  }
});
//console.log('ayyo5')
const reveal: string[] = [
  modelForm["red"].value,
  modelForm["blue"].value,
  modelForm["lum"].value,
  modelForm["red2"].value,
  modelForm["blue2"].value,
  modelForm["lum2"].value,
];

let columns: string[] = hot.getColHeader() as string[];
let hidden: number[] = [];
for (const col in columns) {
  columns[col] = columns[col].substring(0, columns[col].length - 4); //cut off " Mag"
  if (!reveal.includes(columns[col])) {
    //if the column isn't selected in the drop down, hide it
    hidden.push(parseFloat(col));
  }
}

hot.updateSettings({
  hiddenColumns: {
    columns: hidden,
    // copyPasteEnabled: false,
    indicators: false,
  },
});
}
function updateHRModel2(modelForm: ModelForm, chart: Chart, hot: Handsontable, callback: Function = () => { }) {
    let url = "http://localhost:5000/isochrone?"
      // let url = "https://skynet.unc.edu/graph-api/isochrone?"
      + "age=" + HRModelRounding(modelForm['age_num'].value)
      + "&metallicity=" + HRModelRounding(modelForm['metal_num'].value)
      + "&filters=[%22" + modelForm['blue2'].value
      + "%22,%22" + modelForm['red2'].value
      + "%22,%22" + modelForm['lum2'].value + "%22]"
  
      function modelFilter(dataArray: number[][]): [ScatterDataPoint[], ScatterDataPoint[], { [key: string]: number }] {
        let form: ScatterDataPoint[] = [] //the array containing all model points
        let scaleLimits: { [key: string]: number } = { minX: NaN, minY: NaN, maxX: NaN, maxY: NaN, };
        let breakupIndex: number = 0;
        let deltas: number[] = [NaN];
        let maxDelta: number = 0;
        for (let i = 0; i < dataArray.length; i++) {
          let x_i: number = dataArray[i][0];
          let y_i: number = dataArray[i][1];
          let row: ScatterDataPoint = { x: x_i, y: y_i };
          scaleLimits = pointMinMax(scaleLimits, dataArray[i][0], dataArray[i][1]);
        form.push(row);
        if (i > 0) {
          let delta: number = ((x_i - dataArray[i - 1][0]) ** 2 + (y_i - dataArray[i - 1][1]) ** 2) ** 0.5;
          deltas.push(delta);
        }
      }
      let medianValue = median(deltas);
      form.pop();
      deltas.shift();
      for (let i = 0; i < deltas.length; i ++) {
        if (deltas[i] > medianValue) {
          form.shift();
          deltas.shift();
        } else {
          break;
        }
      }
      for (let i = deltas.length; i >= 0; i--) {
        let deltaOutOfRange: boolean = false;
        for (let j = 0; j < 10; j++) {
          if (deltas[i-j] > medianValue) {
            deltaOutOfRange = true;
            break;
          }
        }
        if (deltaOutOfRange) {
          form.pop();
          deltas.pop();
        } else {
          break;
        }
      }
      for (let i = 40; i < deltas.length; i++) {
        if (deltas[i] > maxDelta) {
          maxDelta = deltas[i];
          breakupIndex = i+1;
        }
      }
      // console.log(deltas);
      // console.log(maxDelta + ' ' + breakupIndex);
      if (maxDelta < 10 * medianValue) {
        breakupIndex = 0;
      }
      return [form.slice(0, breakupIndex), form.slice(breakupIndex), scaleLimits]
      }
      httpGetAsync(url, (response: string) => {
        let dataTable: number[][] = JSON.parse(response);
        chart.data.datasets[0].data = modelFilter(dataTable)[0];
        chart.data.datasets[1].data = modelFilter(dataTable)[1];
      chart.update("none");
      callback();
      if (graphScaleMode === "model") {
        graphScale[0] = modelFilter(dataTable)[2];
      chartRescale(chart, modelForm);
    }
  });
  const reveal: string[] = [
    modelForm["red"].value,
    modelForm["blue"].value,
    modelForm["lum"].value,
  ];

  let columns: string[] = hot.getColHeader() as string[];
  let hidden: number[] = [];
  for (const col in columns) {
    columns[col] = columns[col].substring(0, columns[col].length - 4); //cut off " Mag"
    if (!reveal.includes(columns[col])) {
      //if the column isn't selected in the drop down, hide it
      hidden.push(parseFloat(col));
    }
  }

  hot.updateSettings({
    hiddenColumns: {
      columns: hidden,
      // copyPasteEnabled: false,
      indicators: false,
    },
    });
  }
console.log('ayyo6')
function updateScatter(
  table: Handsontable,
  myChart1: Chart,
  myChart2: Chart,
  clusterForm: ClusterForm,
  modelForm: ModelForm,
  dataSetIndex: number,
) {
  let err = parseFloat(clusterForm["err_num"].value);
  let dist = parseFloat(clusterForm["d_num"].value);
  let reddening = parseFloat(clusterForm["red_num"].value);

  let chart1 = myChart1.data.datasets[dataSetIndex].data;
  let chart2 = myChart2.data.datasets[dataSetIndex].data;
  let tableData = table.getData();
  let columns = table.getColHeader();
  console.log('bongus')
  //Identify the column the selected filter refers to
  let blue = columns.indexOf(modelForm["blue"].value + " Mag");
  let red = columns.indexOf(modelForm["red"].value + " Mag");
  let lum = columns.indexOf(modelForm["lum"].value + " Mag");
  let blue2 = columns.indexOf(modelForm["blue2"].value + " Mag");
  let red2 = columns.indexOf(modelForm["red2"].value + " Mag");
  let lum2 = columns.indexOf(modelForm["lum2"].value + " Mag");
  console.log('bongus')
  let A_v1 = calculateLambda(
    reddening,
    filterWavelength[modelForm["blue"].value]
  );
  console.log('bongus')
  let A_v2 = calculateLambda(
    reddening,
    filterWavelength[modelForm["red"].value]
  );
  let A_v3 = calculateLambda(
    reddening,
    filterWavelength[modelForm["lum"].value]
  );
  console.log('bongus')
  let A2_v1 = calculateLambda(
    reddening,
    filterWavelength[modelForm["blue2"].value]
    );
  let A2_v2 = calculateLambda(
    reddening,
    filterWavelength[modelForm["red2"].value]
    );
  let A2_v3 = calculateLambda(
    reddening,
    filterWavelength[modelForm["lum2"].value]
    );

    console.log('bongus')
  let blueErr =
    columns.indexOf(modelForm["blue"].value + "err") < 0
      ? null
      : columns.indexOf(modelForm["blue"].value + "err"); //checks for supplied err data
  let redErr =
    columns.indexOf(modelForm["red"].value + "err") < 0
      ? null
      : columns.indexOf(modelForm["red"].value + "err");
  let lumErr =
    columns.indexOf(modelForm["lum"].value + "err") < 0
      ? null
      : columns.indexOf(modelForm["lum"].value + "err");

  let blue2Err =
      columns.indexOf(modelForm["blue2"].value + "err") < 0
        ? null
        : columns.indexOf(modelForm["blue2"].value + "err"); //checks for supplied err data
  let red2Err =
      columns.indexOf(modelForm["red2"].value + "err") < 0
        ? null
        : columns.indexOf(modelForm["red2"].value + "err");
  let lum2Err =
      columns.indexOf(modelForm["lum2"].value + "err") < 0
        ? null
        : columns.indexOf(modelForm["lum2"].value + "err");
        console.log('bongus')
  let scaleLimits: { [key: string]: number } = {
    minX: NaN,
    minY: NaN,
    maxX: NaN,
    maxY: NaN,
  };
  console.log('bongus')
  let start = 0;
  for (let i = 0; i < tableData.length; i++) {
    if (
      typeof (tableData[i][blue]) != 'number' ||
      typeof (tableData[i][red]) != 'number' ||
      typeof (tableData[i][lum]) != 'number' ||
      (blueErr != null && tableData[i][blueErr] >= err) ||
      (redErr != null && tableData[i][redErr] >= err) ||
      (lumErr != null && tableData[i][lumErr] >= err)
    ) {
      continue;
    }
    //red-blue,lum

    let x = tableData[i][blue] - A_v1 - (tableData[i][red] - A_v2);
    let y = tableData[i][lum] - A_v3 - 5 * Math.log10(dist / 0.01);
    chart1[start++] = {
      x: x,
      y: y
    };
    scaleLimits = pointMinMax(scaleLimits, x, y);
  }
  for (let i = 0; i < tableData.length; i++) {
    if (
      typeof (tableData[i][blue2]) != 'number' ||
      typeof (tableData[i][red2]) != 'number' ||
      typeof (tableData[i][lum2]) != 'number' ||
      (blue2Err != null && tableData[i][blue2Err] >= err) ||
      (red2Err != null && tableData[i][red2Err] >= err) ||
      (lum2Err != null && tableData[i][lum2Err] >= err)
    ) {
      continue;
    }
    //red-blue,lum
    console.log('bongus')
    let x = tableData[i][blue2] - A2_v1 - (tableData[i][red2] - A2_v2);
    let y = tableData[i][lum2] - A2_v3 - 5 * Math.log10(dist / 0.01);
    chart2[start++] = {
      x: x,
      y: y
    };
    scaleLimits = pointMinMax(scaleLimits, x, y);
  }
  //removing both pop codes made good, check with others later
  //while (chart1.length !== start) {
    //chart1.pop();
  //}
  while (chart2.length !== start) {
    chart2.pop();
  }
  if (graphScaleMode !== null) {
    graphScale[1] = scaleLimits;
    chartRescale(myChart1, modelForm);
    chartRescale2(myChart2, modelForm);
  }
  console.log('bongus')
  myChart1.update();
  console.log('bongus')
  //myChart2.update();
  console.log('bongus')
}


// rescale scatter to contain all the data points
export function chartRescale(myChart: Chart, modelForm: ModelForm, option: string = null) {

  let adjustScale: { [key: string]: number } = { minX: 0, minY: 0, maxX: 0, maxY: 0, };
  let xBuffer: number = 0;
  let yBuffer: number = 0;
  for (let key in adjustScale) {
    let frameOn: string = option === null ? graphScaleMode : (graphScaleMode = option);
    let frameParam: { [key: string]: number[] } = { 'model': [0, 0], 'data': [1, 1], 'both': [0, 1], 'auto': [NaN] }

    if (isNaN(frameParam[frameOn][0])) {
      let magList: string[] = ['red', 'blue', 'bright'];
      let filters: string[] = [modelForm['red'].value, modelForm['blue'].value, modelForm['lum'].value];
      let x: { [key: string]: number } = { 'red': 0, 'blue': 0, 'bright': 0 }
      let magIndex: number[] = [0, 0, 0];
      // console.log(filters)
      for (let i = 0; i < magList.length; i++) {
        x[magList[i]] = Math.log(filterWavelength[filters[i]] * 1000) / Math.log(10);
        if ("UBVRI".includes(filters[i])) {
          magIndex[i] = Number(0);
        } else if ("uprimegprimerprimeiprimezprime".includes(filters[i])) {
          magIndex[i] = Number(1);
        } else if ("JHKs".includes(filters[i])) {
          magIndex[i] = Number(2);
        }
      }

      let mags: { [key: string]: Function[] } = filterMags()
      let color_red: number = mags['red'][magIndex[1]](x['blue']) - mags['red'][magIndex[0]](x['red']);
      let color_blue: number = mags['blue'][magIndex[1]](x['blue']) - mags['blue'][magIndex[0]](x['red']);
      // console.log(magIndex)
      adjustScale = {
        'minX': color_blue - (color_red - color_blue) / 8,
        'maxX': color_red + (color_red - color_blue) / 8,
        'minY': mags['bright'][magIndex[2]](x['bright']) + (mags['bright'][magIndex[2]](x['bright']) - mags['faint'][magIndex[0]](x['bright'])) / 8,
        'maxY': mags['faint'][magIndex[0]](x['bright']) - (mags['bright'][magIndex[2]](x['bright']) - mags['faint'][magIndex[0]](x['bright'])) / 8
      };

    } else {
      if (key.includes('min')) {
        adjustScale[key] = Math.min(graphScale[frameParam[frameOn][0]][key],
          graphScale[frameParam[frameOn][1]][key])
      } else {
        adjustScale[key] = Math.max(graphScale[frameParam[frameOn][0]][key],
          graphScale[frameParam[frameOn][1]][key])
      }
      xBuffer = (adjustScale["maxX"] - adjustScale["minX"]) * 0.2;
      yBuffer = (adjustScale["maxY"] - adjustScale["minY"]) * 0.2;
      let minbuffer = 0.1;
      let maxbuffer = 1;
      xBuffer = (xBuffer > minbuffer ? (xBuffer < maxbuffer ? xBuffer : maxbuffer) : minbuffer)
      yBuffer = (yBuffer > minbuffer ? (yBuffer < maxbuffer ? yBuffer : maxbuffer) : minbuffer)
    }
    if (isNaN(adjustScale[key])) {
    }
    adjustScale[key] = isNaN(adjustScale[key]) ? 0 : adjustScale[key]
  }

  myChart.options.scales["y"].min = adjustScale["minY"] - yBuffer
  myChart.options.scales["y"].max = adjustScale["maxY"] + yBuffer
  myChart.options.scales["y"].reverse = true
  //myChart.options.scales["y"].suggestedMin = 0

  myChart.options.scales["x"].min = adjustScale["minX"] - xBuffer
  myChart.options.scales["x"].max = adjustScale["maxX"] + xBuffer
  myChart.options.scales["x"].type = "linear"
  //myChart.options.scales["x"].position = "bottom"
  //what is ^this^ for?

  myChart.data.datasets[2].backgroundColor = HRrainbow(myChart,
    modelForm["red"].value, modelForm["blue"].value)
  myChart.update()
}
export function chartRescale2(myChart: Chart, modelForm: ModelForm, option: string = null) {

    let adjustScale: { [key: string]: number } = { minX: 0, minY: 0, maxX: 0, maxY: 0, };
    let xBuffer: number = 0;
    let yBuffer: number = 0;
    for (let key in adjustScale) {
      let frameOn: string = option === null ? graphScaleMode : (graphScaleMode = option);
      let frameParam: { [key: string]: number[] } = { 'model': [0, 0], 'data': [1, 1], 'both': [0, 1], 'auto': [NaN] }
  
      if (isNaN(frameParam[frameOn][0])) {
        let magList: string[] = ['red2', 'blue2', 'bright'];
        let filters: string[] = [modelForm['red2'].value, modelForm['blue2'].value, modelForm['lum2'].value];
        let x: { [key: string]: number } = { 'red2': 0, 'blue2': 0, 'bright': 0 }
        let magIndex: number[] = [0, 0, 0];
        // console.log(filters)
        for (let i = 0; i < magList.length; i++) {
          x[magList[i]] = Math.log(filterWavelength[filters[i]] * 1000) / Math.log(10);
          if ("UBVRI".includes(filters[i])) {
            magIndex[i] = Number(0);
          } else if ("uprimegprimerprimeiprimezprime".includes(filters[i])) {
            magIndex[i] = Number(1);
          } else if ("JHKs".includes(filters[i])) {
            magIndex[i] = Number(2);
          }
        }
  
        let mags: { [key: string]: Function[] } = filterMags()
        //console.log(mags)
        //took 2 from filter id titles here, idk if it works like how I want it to
        let color_red: number = mags['red'][magIndex[1]](x['blue2']) - mags['red'][magIndex[0]](x['red']);
        let color_blue: number = mags['blue'][magIndex[1]](x['blue']) - mags['blue'][magIndex[0]](x['red']);
        // console.log(magIndex)
        adjustScale = {
          'minX': color_blue - (color_red - color_blue) / 8,
          'maxX': color_red + (color_red - color_blue) / 8,
          'minY': mags['bright'][magIndex[2]](x['bright']) + (mags['bright'][magIndex[2]](x['bright']) - mags['faint'][magIndex[0]](x['bright'])) / 8,
          'maxY': mags['faint'][magIndex[0]](x['bright']) - (mags['bright'][magIndex[2]](x['bright']) - mags['faint'][magIndex[0]](x['bright'])) / 8
        };
  
      } else {
        if (key.includes('min')) {
          adjustScale[key] = Math.min(graphScale[frameParam[frameOn][0]][key],
            graphScale[frameParam[frameOn][1]][key])
        } else {
          adjustScale[key] = Math.max(graphScale[frameParam[frameOn][0]][key],
            graphScale[frameParam[frameOn][1]][key])
        }
        xBuffer = (adjustScale["maxX"] - adjustScale["minX"]) * 0.2;
        yBuffer = (adjustScale["maxY"] - adjustScale["minY"]) * 0.2;
        let minbuffer = 0.1;
        let maxbuffer = 1;
        xBuffer = (xBuffer > minbuffer ? (xBuffer < maxbuffer ? xBuffer : maxbuffer) : minbuffer)
        yBuffer = (yBuffer > minbuffer ? (yBuffer < maxbuffer ? yBuffer : maxbuffer) : minbuffer)
      }
      if (isNaN(adjustScale[key])) {
      }
      adjustScale[key] = isNaN(adjustScale[key]) ? 0 : adjustScale[key]
    }
  
    myChart.options.scales["y"].min = adjustScale["minY"] - yBuffer
    myChart.options.scales["y"].max = adjustScale["maxY"] + yBuffer
    myChart.options.scales["y"].reverse = true
    //myChart.options.scales["y"].suggestedMin = 0
  
    myChart.options.scales["x"].min = adjustScale["minX"] - xBuffer
    myChart.options.scales["x"].max = adjustScale["maxX"] + xBuffer
    myChart.options.scales["x"].type = "linear"
    //myChart.options.scales["x"].position = "bottom"
    //what is ^this^ for?
  
    myChart.data.datasets[2].backgroundColor = HRrainbow(myChart,
      modelForm["red2"].value, modelForm["blue2"].value)
    myChart.update()
  }