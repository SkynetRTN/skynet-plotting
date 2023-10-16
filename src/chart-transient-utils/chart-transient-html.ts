const addDropdown = (options: string[], title: string, id: string) => {
    const label = title + ': ';
    let html =
        '<div class="row">\n' +
        '<div class="col-sm-7">' + label + '</div>\n' +
        '<div class="col-sm-5">' +
        '<select name="' + id +
        '" style="width: 100%;" title="' + title + '" id="' + id + '">\n';

    for (let option of options) {
        html +=
            '<option value="' + option +
            '"title="' + option +
            '">' + option + '</option>\n';
    }
    html += '</select></div>\n' + '</div>\n';

    return html;
}


const addSliderWithInput = (label: string, title: string, id: string) => {

    let html =
        '<div class="row" style="margin:auto">\n' +
        '<div class="col-sm-2 des">' + label + ':</div>\n' +
        '<div class="col-sm-7 range"><input type="range"' +
        'title="' + title + '" name="' + title + '" id="' + id + '"></div>\n';

    html += addInput(title, id + '_num');
    return html;
}


const addInput = (title: string, id: string) => {
    return '<div class="col-sm-3 text"><input step="any" type="number"' +
        'title="' + title + '" name="' + title + '_num"' +
        'class="field" id="' + id + '"></div>\n' +
        '</div>\n' + '<div class="row">\n' + '</div>\n';
}


const addRow = () => {
    return '<div class="row">\n' + '</div>\n';
}


export const disableDropdown = (id: string, state: boolean, hasInput: boolean = true) => {
    (document.getElementById(id) as HTMLInputElement).disabled = state;
    if (hasInput) {
        let inputID = id + '_num';
        (document.getElementById(inputID) as HTMLInputElement).disabled = state;
    }
}


/* DRIVER CODE */
export const initHTML = () => {

    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Variable"' +
        'id="variable-form"' +
        'style="padding-bottom: 1em">' +
        '</form>\n' +
        '<div id="transient-div"></div>\n'
    );

    document.getElementById("extra-options").insertAdjacentHTML("beforeend",
        '<div style="float: right;">\n' +
        '<div class="row">\n' +
        '<button class = "graphControl" id="panLeft">' +
        '<center class = "graphControl">&#8592;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="panRight">' +
        '<center class = "graphControl">&#8594;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="zoomIn">' +
        '<center class = "graphControl">&plus;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="zoomOut">' +
        '<center class = "graphControl">&minus;</center></button>\n' +
        '&nbsp;' +
        '<button class = "graphControl" id="Reset" style="width: auto" >' +
        '<center class = "graphControl" style="font-size: 16px">Reset</center></button>\n' +
        '</div>\n' +
        '</div>\n'
    )

    document.getElementById('myChart').setAttribute('style', 'cursor: move');
    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y Axis";

    let HTML =
        '<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-error-bars@0.1.3/build/Chart.ErrorBars.min.js"></script>' + 
        '<form title="Transient" id="transient-form"' +
        'style="padding-bottom: .5em" onSubmit="return false;">\n' +

        // Input Event Time
        '<div class="row">\n' +
        '<div class="col-sm-7">Event Time: </div>\n' +
        '<div class="col-sm-5"><input class="field" type="number"' +
        'id="time" title="Event Time" value=0></input></div>\n' +
        '</div>\n';

    const filterOptions = ['U', 'u\'', 'B', 'g\'', 'V', 'r\'', 'R', 'i\'', 'I', 'z\'', 'J', 'H', 'K'];
    HTML += addDropdown(['Power Law', 'Exponential'], 'Select Temporal Model', 'temporal');
    HTML += addDropdown(['Power Law', 'Extinguished Power Law'], 'Select Spectral Model', 'spectral');
    HTML += addDropdown(filterOptions, 'Filter<sub>0</sub>', 'filter');

    HTML += addRow();

    HTML += addSliderWithInput('b', 'unknown', 'b');
    HTML += addSliderWithInput('E(B-V)', 'unknown', 'ebv');
    HTML += addSliderWithInput('t<sub>0</sub>', 'referenceTime', 't');
    HTML += addSliderWithInput('mag<sub>0</sub>', 'magnitude', 'mag');
    HTML += addSliderWithInput('a', 'extinction', 'a');

    // fitting button
    HTML +=
        '<div class="row">' +
        '<div style="width: 100%">' +
        '<button id="best-fit" style="width: 100%">Find Best Fit Parameters Algorithmically</button>' +
        '</div>' +
        '</div>'

    document.getElementById('transient-div').innerHTML = HTML;
    (document.getElementById("ebv_num") as HTMLInputElement).disabled = true;
    (document.getElementById("ebv") as HTMLInputElement).disabled = true;

}
