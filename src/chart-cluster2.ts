"use strict";

import Chart from "chart.js/auto";
import Handsontable from "handsontable";
import { Color, LegendItem, ScatterDataPoint } from "chart.js";
import { dummyData, filterMags } from "./chart-cluster-util";
import { tableCommonOptions, colors } from "./config";
import {
  linkInputs,
  throttle,
  updateLabels,
  updateTableHeight,
  changeOptions,
} from "./util";
import zoomPlugin from 'chartjs-plugin-zoom';
// import { rad } from "./my-math";

Chart.register(zoomPlugin);
/**
 *  This function is for the moon of a planet.
 *  @returns {[Handsontable, Chart]}:
 */
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
      '<div class="col-sm-5 des">Reddening (mag):</div>\n' +
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
    1,
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

  const tableData = dummyData()

  //make graph scaling options visible to users
  document.getElementById("grpah-scaling-options").style.display = "inline"

  //handel scaling options input
  let standardViewRadio = document.getElementById("standardView") as HTMLInputElement;
  let frameOnDataRadio = document.getElementById("frameOnData") as HTMLInputElement;

  standardViewRadio.addEventListener("click", () => {
    radioOnclick(standardViewRadio, frameOnDataRadio);
  })
  frameOnDataRadio.addEventListener("click", () => {
    radioOnclick(frameOnDataRadio, standardViewRadio)
  })

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

  function setRadioLabelColor(radio: HTMLInputElement, activate: boolean) {
    let color: string = activate ? "#4B9CD3" : "white";
    document.getElementById(radio.id + "Label").style.backgroundColor = color
  }

  function zoompanDeactivate(): any {
    standardViewRadio.checked = false;
    frameOnDataRadio.checked = false;
    setRadioLabelColor(standardViewRadio, false);
    setRadioLabelColor(frameOnDataRadio, false);
    myChart1.options.plugins.legend.labels.color = "#000000";
    myChart2.options.plugins.legend.labels.color = "#000000";

  }

  function setLegendColor(legend: LegendItem, activate: boolean) {
    let fontColor: string = activate ? "#FF0000" : "#000000";
    legend.fontColor = fontColor;
  }

  function newLegendClickHandler(e: any, legendItem: LegendItem, legend: any) {
    let legendItems = legend.legendItems;
    if (legendItem.text === "Model") {
      radioOnclick(standardViewRadio, frameOnDataRadio);
      setLegendColor(legendItems[0], true)
      setLegendColor(legendItems[1], false)
    } else {
      radioOnclick(frameOnDataRadio, standardViewRadio);
      setLegendColor(legendItems[1], true)
      setLegendColor(legendItems[0], false)
    }
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
          onClick: newLegendClickHandler,
        }
      }
    },
  });

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
          onClick: newLegendClickHandler,
        }
      }
    },
  });

  //Adjust the gradient with the window size
  window.onresize = function () {
    setTimeout(function () {
      myChart1.data.datasets[1].backgroundColor = HRrainbow(myChart1,
        modelForm["red"].value, modelForm["blue"].value)
      myChart2.data.datasets[1].backgroundColor = HRrainbow(myChart2,
            modelForm["red2"].value, modelForm["blue2"].value)
      //console.log("bingus")
      myChart1.update()
      myChart2.update()
    }, 10)
  }

  const update = function () {
    //console.log(tableData);
    updateTableHeight(hot);
    updateScatter(
      hot,
      myChart1,
      myChart2,
      clusterForm,
      modelForm,
      1
    );
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
    function () { updateScatter(hot, myChart1, myChart2, clusterForm, modelForm, 1) },
    frameTime);

  // link chart to model form (slider + text)
  // modelForm.oninput=

  const updateModel = function (precise: boolean) {
    //console.log(tableData);

    const reveal: string[] = [
      modelForm["red"].value,
      modelForm["blue"].value,
      modelForm["lum"].value,
      modelForm["red2"].value,
      modelForm["blue2"].value,
      modelForm["lum2"].value,
    ];
    console.log(Number(modelForm['age_num'].value) * 10 % 5)
    if (precise
      || Number(modelForm['age_num'].value) * 10 % 3 === 0
      || Number(modelForm['metal'].value) * 10 % 2 === 0) {
      const columns: string[] = hot.getColHeader() as string[];
      const hidden: number[] = [];
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

      update();
      updateHRModel(modelForm, myChart1);
      updateHRModel2(modelForm, myChart2);
      updateLabels(
        myChart1,
        document.getElementById("chart-info-form") as ChartInfoForm
      );
      updateLabels(
        myChart2,
        document.getElementById("chart-info-form") as ChartInfoForm
        );
        //do i need to add a chart-info-form2????????
      myChart1.update("none");
      myChart2.update("none");
    };
  }

  // link chart to model form (slider + text)
  modelForm.oninput = throttle(function () { updateModel(true) }, 100);
  // modelForm.onchange = throttle(function () { updateModel(true) }, 100);

  update();
  updateHRModel(modelForm, myChart1);
  updateHRModel2(modelForm, myChart2);

  myChart1.options.plugins.title.text = "Title";
  myChart1.options.scales["x"].title.text = "x";
  myChart1.options.scales["y"].title.text = "y";
  myChart2.options.plugins.title.text = "Title";
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

  return [hot, myChart1, myChart2, modelForm];
}

/**
 * This function handles the uploaded file to the variable chart. Specifically, it parse the file
 * and load related information into the table.
 * DATA FLOW: file -> table
 * @param {Event} evt The uploadig event
 * @param {Handsontable} table The table to be updated
 * @param {Chartjs} myChart
 */
export function cluster2FileUpload(
  evt: Event,
  table: Handsontable,
  myChart: Chart<"line">
) {
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

  const reader = new FileReader();
  reader.onload = () => {
    const clusterForm = document.getElementById("cluster-form") as ClusterForm;
    const modelForm = document.getElementById("model-form") as ModelForm;
    // console.log(clusterForm.elements['d'].value);
    clusterForm["d"].value = Math.log(3).toString();
    // console.log(clusterForm.elements['d'].value);
    modelForm["age"].value = "6.6";
    clusterForm["red"].value = "0";
    modelForm["metal"].value = "-3.4";
    clusterForm["d_num"].value = "3";
    modelForm["age_num"].value = "6.6";
    clusterForm["red_num"].value = "0";
    modelForm["metal_num"].value = "-3.4";
    myChart.options.plugins.title.text = "Title";
    myChart.data.datasets[1].label = "Data";
    myChart.options.scales["x"].title.text = "x";
    myChart.options.scales["y"].title.text = "y";
    updateLabels(
      myChart,
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
    let knownFilters = [
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
    const headers = [];
    const columns = [];
    var hiddenColumns = [];
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

    table.updateSettings({
      data: tableData,
      colHeaders: headers,
      columns: columns,
      hiddenColumns: { columns: hiddenColumns },
    }); //hide all but the first 3 columns
    updateTableHeight(table);
    updateScatter(
      table,
      myChart,
      myChart,
      document.getElementById("cluster-form") as ClusterForm,
      document.getElementById("model-form") as ModelForm,
      1
    );
  };
  reader.readAsText(file);
}
var graphScaleMode = "auto";
var graphScale: { [key: string]: number }[] = [
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
function updateHRModel(modelForm: ModelForm, chart: Chart) {
  let url = "http://localhost:5000/isochrone?"
    // let url = "https://skynet.unc.edu/graph-api/isochrone?"
    + "age=" + HRModelRounding(modelForm['age_num'].value)
    + "&metallicity=" + HRModelRounding(modelForm['metal_num'].value)
    + "&filters=[%22" + modelForm['blue'].value
    + "%22,%22" + modelForm['red'].value
    + "%22,%22" + modelForm['lum'].value + "%22]"

  // console.log(url)
  httpGetAsync(url, (response: string) => {
    let dataTable = JSON.parse(response);
    let form: ScatterDataPoint[] = []
    let scaleLimits: { [key: string]: number } = {
      minX: NaN,
      minY: NaN,
      maxX: NaN,
      maxY: NaN,
    };
    for (let i = 0; i < dataTable.length - 10; i++) {
      // console.log(dataTable[i])
      let row: ScatterDataPoint = { x: dataTable[i][0], y: dataTable[i][1] };
      scaleLimits = pointMinMax(scaleLimits, dataTable[i][0], dataTable[i][1]);
      form.push(row);
    }
    chart.data.datasets[0].data = form;
    chart.update("none");
    graphScale[0] = scaleLimits;
    chartRescale(chart, modelForm);
  });
}

function updateHRModel2(modelForm: ModelForm, chart: Chart) {
    let url = "http://localhost:5000/isochrone?"
      // let url = "https://skynet.unc.edu/graph-api/isochrone?"
      + "age=" + HRModelRounding(modelForm['age_num'].value)
      + "&metallicity=" + HRModelRounding(modelForm['metal_num'].value)
      + "&filters=[%22" + modelForm['blue2'].value
      + "%22,%22" + modelForm['red2'].value
      + "%22,%22" + modelForm['lum2'].value + "%22]"
  
    // console.log(url)
    httpGetAsync(url, (response: string) => {
      let dataTable = JSON.parse(response);
      let form: ScatterDataPoint[] = []
      let scaleLimits: { [key: string]: number } = {
        minX: NaN,
        minY: NaN,
        maxX: NaN,
        maxY: NaN,
      };
      for (let i = 0; i < dataTable.length - 10; i++) {
        // console.log(dataTable[i])
        let row: ScatterDataPoint = { x: dataTable[i][0], y: dataTable[i][1] };
        scaleLimits = pointMinMax(scaleLimits, dataTable[i][0], dataTable[i][1]);
        form.push(row);
      }
      chart.data.datasets[0].data = form;
      chart.update("none");
      graphScale[0] = scaleLimits;
      chartRescale(chart, modelForm);
    });
  }

function updateScatter(
  table: Handsontable,
  myChart1: Chart,
  myChart2: Chart,
  clusterForm: ClusterForm,
  modelForm: ModelForm,
  dataSetIndex: 1
) {
  let err = parseFloat(clusterForm["err_num"].value);
  let dist = parseFloat(clusterForm["d_num"].value);
  let reddening = parseFloat(clusterForm["red_num"].value);

  let chart1 = myChart1.data.datasets[dataSetIndex].data;
  let chart2 = myChart2.data.datasets[dataSetIndex].data;
  let tableData = table.getData();
  let columns = table.getColHeader();

  //Identify the column the selected filter refers to
  let blue = columns.indexOf(modelForm["blue"].value + " Mag");
  let red = columns.indexOf(modelForm["red"].value + " Mag");
  let lum = columns.indexOf(modelForm["lum"].value + " Mag");
  let blue2 = columns.indexOf(modelForm["blue2"].value + " Mag");
  let red2 = columns.indexOf(modelForm["red2"].value + " Mag");
  let lum2 = columns.indexOf(modelForm["lum2"].value + " Mag");

  let A_v1 = calculateLambda(
    reddening,
    filterWavelength[modelForm["blue"].value]
  );
  let A_v2 = calculateLambda(
    reddening,
    filterWavelength[modelForm["red"].value]
  );
  let A_v3 = calculateLambda(
    reddening,
    filterWavelength[modelForm["lum"].value]
  );

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

  let scaleLimits: { [key: string]: number } = {
    minX: NaN,
    minY: NaN,
    maxX: NaN,
    maxY: NaN,
  };

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

    let x = tableData[i][blue2] - A2_v1 - (tableData[i][red2] - A2_v2);
    let y = tableData[i][lum2] - A2_v3 - 5 * Math.log10(dist / 0.01);
    chart2[start++] = {
      x: x,
      y: y
    };
    scaleLimits = pointMinMax(scaleLimits, x, y);
  }
  while (chart1.length !== start) {
    chart1.pop();
  }
  while (chart2.length !== start) {
    chart2.pop();
 }
  graphScale[1] = scaleLimits;
  chartRescale(myChart1, modelForm);
  chartRescale(myChart2, modelForm);
  myChart1.update()
  myChart2.update()
}

//finding the maximum and minimum of y value for chart scaling
function pointMinMax(scaleLimits: { [key: string]: number }, x: number, y: number) {
  let newLimits = scaleLimits;
  if (isNaN(newLimits["minX"])) {
    newLimits["minX"] = x;
    newLimits["maxX"] = x;
    newLimits["minY"] = y;
    newLimits["maxY"] = y;
  } else if (x !== 0 && y !== 0) {
    newLimits["maxY"] = Math.max(newLimits["maxY"], y);
    newLimits["maxX"] = Math.max(newLimits["maxX"], x)
    newLimits["minY"] = Math.min(newLimits["minY"], y)
    newLimits["minX"] = Math.min(newLimits["minX"], x)
  }
  return newLimits
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

      let color_red: number = mags['red'][magIndex[0]](x['blue']) - mags['red'][magIndex[0]](x['red']);
      let color_blue: number = mags['blue'][magIndex[1]](x['blue']) - mags['blue'][magIndex[1]](x['red']);
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

  myChart.data.datasets[1].backgroundColor = HRrainbow(myChart,
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
  
        let color_red: number = mags['red2'][magIndex[0]](x['blue2']) - mags['red2'][magIndex[0]](x['red2']);
        let color_blue: number = mags['blue2'][magIndex[1]](x['blue2']) - mags['blue2'][magIndex[1]](x['red2']);
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
  
    myChart.data.datasets[1].backgroundColor = HRrainbow(myChart,
      modelForm["red2"].value, modelForm["blue2"].value)
    myChart.update()
  }

//assign wavelength to each knownfilter
const filterWavelength: { [key: string]: number } = {
  U: 0.364,
  B: 0.442,
  V: 0.54,
  R: 0.647,
  I: 0.7865,
  uprime: 0.354,
  gprime: 0.475,
  rprime: 0.622,
  iprime: 0.763,
  zprime: 0.905,
  J: 1.25,
  H: 1.65,
  K: 2.15,
  Ks: 2.15,
};

function calculateLambda(A_v: Number, filterlambda = 10 ** -6) {
  //Now we need to create the function for the reddening curve

  let lambda = filterlambda;
  let R_v = 3.1;
  let x = (lambda / 1) ** -1;
  let y = x - 1.82;
  let a = 0;
  let b = 0;
  if (x > 0.3 && x < 1.1) {
    a = 0.574 * x ** 1.61;
  } else if (x > 1.1 && x < 3.3) {
    a =
      1 +
      0.17699 * y -
      0.50447 * y ** 2 -
      0.02427 * y ** 3 +
      0.72085 * y ** 4 +
      0.01979 * y ** 5 -
      0.7753 * y ** 6 +
      0.32999 * y ** 7;
  }

  if (x > 0.3 && x < 1.1) {
    b = -0.527 * x ** 1.61;
  } else if (x > 1.1 && x < 3.3) {
    b =
      1.41338 * y +
      2.28305 * y ** 2 +
      1.07233 * y ** 3 -
      5.38434 * y ** 4 -
      0.62251 * y ** 5 +
      5.3026 * y ** 6 -
      2.09002 * y ** 7;
  }

  return Number(A_v) * (a + b / R_v);
}

//Api Get Request Testing
// let url = 'http://localhost:5000/data?age=6.80&metallicity=-0.35&filters=[%22uprime%22,%22H%22,%22J%22]'

// httpGetAsync(url, (response: string) => {
//   var resultJson = JSON.parse(response);
//   console.log(resultJson[0])
// });

/**Get http request asynchronously
 * @param {string} theUrl -request ultra link
 * @param {function} callback -function to execute with http response
 */
function httpGetAsync(theUrl: string, callback: Function) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  };
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}

function HRModelRounding(number: number | string) {
  return (Math.round(Number(number) * 20) / 20).toFixed(2)
}


//create a gradient for HR stars
function HRrainbow(chart: Chart, red: string, blue: string): CanvasGradient | Color {
  let { ctx, chartArea } = chart;
  let rl = isNaN(filterWavelength[red]) ? Math.log10(0.442 * 1000) : Math.log10(filterWavelength[red] * 1000);//default to B-V for unknowns
  let bl = isNaN(filterWavelength[blue]) ? Math.log10(0.54 * 1000) : Math.log10(filterWavelength[blue] * 1000);

  let filters: string[] = [red, blue];
  let magIndex: number[] = [0, 0];
  // console.log(filters)
  for (let i = 0; i < filters.length; i++) {
    if ("UBVRI".includes(filters[i])) {
      magIndex[i] = Number(0);
    } else if ("uprimegprimerprimeiprimezprime".includes(filters[i])) {
      magIndex[i] = Number(1);
    } else if ("JHKs".includes(filters[i])) {
      magIndex[i] = Number(2);
    }
  }

  let mags: { [key: string]: Function[] } = filterMags()


  let mColor = mags.red[magIndex[0]](bl) - mags.red[magIndex[0]](rl);
  let oColor = mags.blue[magIndex[1]](bl) - mags.blue[magIndex[1]](rl)

  let max = chart.options.scales["x"].max;
  let min = chart.options.scales["x"].min;

  //p(c)=(W/DC)*c-(W/DC)*min+left
  let pixelrat = chartArea.width / (max - min);
  let start = chartArea.left + (pixelrat * oColor) - (pixelrat * min);
  let stop = chartArea.left + (pixelrat * mColor) - (pixelrat * min);

  if (isNaN(start) || isNaN(stop)) {//stop div/0
    return "red"
  }
  else {

    let gradient = ctx.createLinearGradient(start, 0, stop, 0);

    gradient.addColorStop(1, "red");        //M
    gradient.addColorStop(0.929, "#ff6600"); //K
    gradient.addColorStop(0.526, "#ffdc60");//G
    gradient.addColorStop(0.441, "#fdffe0");//F
    gradient.addColorStop(0.357, "white");  //A
    //gradient.addColorStop(0.107,"#baf9ff");//B
    gradient.addColorStop(0, "#38eeff");    //O
    //From: https://asterism.org/wp-content/uploads/2019/03/tut39-HR-Diagram.pdf

    return gradient;
  }
}