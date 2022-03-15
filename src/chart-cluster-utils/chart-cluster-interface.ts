/**
 * This file contains functions that inject essential HTML into index.html for Cluster interfaces
 */


/**
 *  This function insert the clusterform and modelform into the website
 *  @param chartCounts: how many charts need to be controlled
 */
export function insertClusterControls(chartCounts:number = 1) {
    let htmlContent = '<form title="Cluster Diagram" id="cluster-form">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Distance (kpc):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Distance" name="d"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Distance" name="d_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        //add a checkbox that disables the corresponding slider
        '<div class="col-sm-1"><input type="checkbox" class="range" checked="" name="range"></input></div>\n' +
        '<div class = "col-sm-5 des">±Range (%):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Range" name="range"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Range" name="range_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">B – V Reddening (mag):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Reddening" name="red"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Reddening" name="red_num" class="field"></div>\n' +
        "</div>\n" +
        "</form>\n" +
        '<form title="Filters" id="model-form" style="padding-bottom: .5em">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">log(Age (yr)):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Age" name="age"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Age" name="age_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6 des">Metallicity (solar):</div>\n' +
        '<div class="col-sm-4 range"><input type="range" title="Metallicity" name="metal"></div>\n' +
        '<div class="col-sm-2 text"><input type="number" title="Metallicity" name="metal_num" class="field"></div>\n' +
        "</div>\n" +
        '<div class="row">\n' +
        '<div class="col-sm-6" style="color: grey;">Select Filters:</div>\n' +
        "</div>\n" +
        '<div class="row">\n'
    if (chartCounts === 1) {
        for (let i = 0; i < chartCounts; i++) {
            let num = ""
            if (i !== 0) {
                num = (i+1).toString()
            }
            //add a number that corresponds what graph each row of drop down boxes controls
            htmlContent +=
                '<div class="col-sm-4">Blue:</div>\n' +
                '<div class="col-sm-4">Red:</div>\n' +
                '<div class="col-sm-4">Luminosity:</div>\n' +
                "</div>\n" +
                '<div class="row">\n' +
                '<div class="col-sm-4"><select name="blue' + num + '" style="width: 100%;" title="Select Blue Color Filter">\n' +
                '<option value="B" title="B filter" selected>B</option></div>\n' +
                '<option value="V" title="V filter">V</option></div>\n' +
                '<option value="R" title="R filter">R</option></div>\n' +
                '<option value="I" title="I filter">I</option></select></div>\n' +
                '<div class="col-sm-4"><select name="red' + num + '" style="width: 100%;" title="Red Color Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></div>\n' +
                '<option value="I" title="I filter">I</option></select></div>\n' +
                '<div class="col-sm-4"><select name="lum' + num + '" style="width: 100%;" title="Select Luminosity Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></div>\n' +
                '<option value="I" title="I filter" >I</option></select></div>\n'
        }
    }
    if (chartCounts > 1) {
        htmlContent += '<div class="col-sm-1"></div>\n' +
            '<div class="col-sm-3">Blue:</div>\n' +
            '<div class="col-sm-1"></div>\n' +
            '<div class="col-sm-3">Red:</div>\n' +
            '<div class="col-sm-1"></div>\n' +
            '<div class="col-sm-3">Luminosity:</div>\n' +
            "</div>\n" +
            '<div class="row">\n'
        for (let i = 0; i < chartCounts; i++) {
            let num = ""
            let order = (i+1).toString()
            let logo = ""
            if (order === "1") {
                logo = "①"
            } else if (order === "2") {
                logo = "②"
            } else if (order === "3") {
                logo = "③"
            } else if (order === "4") {
                logo = "④"
            }
            if (i !== 0) {
                num = (i+1).toString()
            }
            //add a number that corresponds what graph each row of drop down boxes controls
            htmlContent += '<div class="col-sm-1"><class="title">' + logo + ':</div>\n' +
                '<div class="col-sm-3"><select name="blue' + num + '" style="width: 100%;" title="Select Blue Color Filter">\n' +
                '<option value="B" title="B filter" selected>B</option></div>\n' +
                '<option value="V" title="V filter">V</option></div>\n' +
                '<option value="R" title="R filter">R</option></div>\n' +
                '<option value="I" title="I filter">I</option></select></div>\n' +
                '<div class="col-sm-1"></div>\n' +
                '<div class="col-sm-3"><select name="red' + num + '" style="width: 100%;" title="Red Color Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></div>\n' +
                '<option value="I" title="I filter">I</option></select></div>\n' +
                '<div class="col-sm-1"></div>\n' +
                '<div class="col-sm-3"><select name="lum' + num + '" style="width: 100%;" title="Select Luminosity Filter">\n' +
                '<option value="B" title="B filter">B</option></div>\n' +
                '<option value="V" title="V filter" selected>V</option></div>\n' +
                '<option value="R" title="R filter">R</option></div>\n' +
                '<option value="I" title="I filter" >I</option></select></div>\n'
        }
    }


    htmlContent += "</div>\n" + "</form>\n"


    document
        .getElementById("input-div")
        .insertAdjacentHTML(
            "beforeend",
            htmlContent
        );
}
export function clusterProSliders(clusterPro: true = true) {
    if (clusterPro === true) {
    let htmlContent = "" 
    htmlContent += '<form id="clusterProForm" class="form-inline">\n' +
                   '</div>\n'
    htmlContent += '<div class="row" style = "padding-top: 10.5px">\n'
    htmlContent += '<div class = "col-sm-6 des">Motion in RA (mas/yr):</div>\n' +
                   '<div class="col-sm-4 range"><input type="range" title="ramotion" name="ramotion"></div>\n' +
                   '<div class="col-sm-2 text"><input type="number" title="Ra" name="ramotion_num" class="field"></div>\n' +
                     '</div>\n'
    htmlContent += '<div class="row">\n'
    htmlContent += '<div class="col-sm-1"><input type="checkbox" class="range" checked="" name="range" value="0"></input></div>\n' +
                   '<div class = "col-sm-5 des">±Range (mas/yr):</div>\n' +
                   '<div class="col-sm-4 range"><input type="range" title="rarange" name="rarange"></div>\n' +
                   '<div class="col-sm-2 text"><input type="number" title="rarange" name="rarange_num" class="field"></div>\n' +
                     '</div>\n'
    htmlContent += '<div class="row">\n'
    htmlContent += '<div class = "col-sm-6 des">Motion in Dec (mas/yr):</div>\n' +
                     '<div class="col-sm-4 range"><input type="range" title="decmotion" name="decmotion"></div>\n' +
                        '<div class="col-sm-2 text"><input type="number" title="decmotion" name="decmotion_num" class="field"></div>\n' +
                        '</div>\n'
    htmlContent += '<div class="row">\n'
    htmlContent += '<div class="col-sm-1"><input type="checkbox" class="range" checked="" name="range" value="0"></input></div>\n' +
                     '<div class = "col-sm-5 des">±Range (mas/yr):</div>\n' +
                        '<div class="col-sm-4 range"><input type="range" title="decrange" name="decrange"></div>\n' +
                        '<div class="col-sm-2 text"><input type="number" title="decrange" name="decrange_num" class="field"></div>\n' +
                        '</div>\n'
    htmlContent += '</div>\n'
    htmlContent += '</div>\n'
    document
        .getElementById("chart-div1")
        .insertAdjacentHTML(
            "beforeend",
            htmlContent
        );
}}

/**
 * Insert graph control and on-control buttons into html code
 * @param chartCount the number of charts will be controlled
 * @private
 */
export function insertGraphControl(chartCount: number = 1){
    let html = '<div class = "extra" id = "scaleGraphNo">\n';

    if (chartCount > 1) {
        for (let i = 0; i < chartCount; i++) {
            html +=
                '<label class="scaleSelection scaleSelection-graphSelection" id="frameChart' + (i+1).toString() +  '">' +
                '<input type="radio" class="scaleSelection" id="radioChart' + (i+1).toString() +
                '" name="chartCount" value="' + (i+1).toString() + '"' +
                (i === 0 ? 'checked' : '')  +
                '><div style="position: relative; bottom: 4px; left:7.5px">'
                +    (i+1).toString() +
                '</div></label>\n'
        }
    }

    html += '<label class="scaleSelection" id="standardViewLabel">\n' +
        '<input type="radio" class="scaleSelection" id="standardView" value="Standard View" checked />' +
        '<div class="radioText">Standard View</div>' +
        '</label>\n' + '&nbsp;' +
        '<label class="scaleSelection" id="frameOnDataLabel">\n' +
        '<input type="radio" class="scaleSelection" id="frameOnData" value="Frame on Data" />'+
        '<div class="radioText">Frame on Data</div>' +
        '</label>\n' + '&nbsp;' +
        '<button class = "graphControl" id="panLeft"><center class = "graphControl">&#8592;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="panRight"><center class = "graphControl">&#8594;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="zoomIn"><center class = "graphControl">&plus;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="zoomOut"><center class = "graphControl">&minus;</center></button>\n' +
        '<div style="padding: 0 6px 0 6px"></div>' +
        '</div>\n'
    document.getElementById("extra-options").insertAdjacentHTML("beforeend", html)
}