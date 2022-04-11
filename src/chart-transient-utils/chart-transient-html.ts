

export const initializeHTMLElements = () => {

    document.getElementById('input-div').insertAdjacentHTML('beforeend',
        '<form title="Variable"' + 
            'id="variable-form"' +
            'style="padding-bottom: 1em">'+
        '</form>\n' +
        '<div id="light-curve-div"></div>\n'
    );

    document.getElementById('axis-label1').style.display = 'inline';
    document.getElementById('axis-label3').style.display = 'inline';
    document.getElementById('xAxisPrompt').innerHTML = "X Axis";
    document.getElementById('yAxisPrompt').innerHTML = "Y Axis";

    // temporal
    let options = ['Power Law', 'Exponential']; 
    let optionsTitle = 'Select Temporal Model';
    let optionsLabel = optionsTitle + ': ';

    // dropdown Input Option
    let HTML =
        '<form title="Light Curve" id="light-curve-form" style="padding-bottom: .5em" onSubmit="return false;">\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">' + optionsLabel + '</div>\n' +
        '<div class="col-sm-5"><select name="temporal" style="width: 100%;" title="' + optionsTitle + '" id="dropdown">\n';

    // add options to Temporal Model dropdown
    for (let option of options) {
        HTML +=
            '<option value="' + option +
            '"title="' + option +
            '">' + option + '</option>\n';
    }

    // spectral
    options = ['Power Law', 'Extinguished Power Law']; 
    optionsTitle = 'Select Spectral Model';
    optionsLabel = optionsTitle + ': ';

    HTML +=
        '</select></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '<div class="col-sm-7">' + optionsLabel + '</div>\n' +
        '<div class="col-sm-5"><select type="number" name="spectral" style="width: 100%;" title="'+ optionsTitle +'">\n';

    // add options to Spectral Model dropdown
    for (let option of options) {
        HTML +=
            '<option value="' + option +
            '"title="' + option +
            '">' + option + '</option>\n';
    }

    HTML +=
        '</select></div>\n'
        '</div>\n';

    HTML +=
        '<div class="row">\n' +
        '</div>\n' +
        '<div class="row" style="margin:auto">\n' +
        '<div class="col-sm-2 des">t_0:</div>\n' +
        '<div class="col-sm-7 range"><input type="range" title="Tilt" name="tilt"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Tilt" name="tilt_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '</div>\n' +
        '<div class="row" style="margin:auto">\n' +
        '<div class="col-sm-2 des">mag_0:</div>\n' +
        '<div class="col-sm-7 range"><input type="range" title="Tilt" name="tilt"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Tilt" name="tilt_num" class="field"></div>\n' +
        '</div>\n' +
        '<div class="row">\n' +
        '</div>\n' +
        '<div class="row" style="margin:auto">\n' +
        '<div class="col-sm-2 des">a:</div>\n' +
        '<div class="col-sm-7 range"><input type="range" title="Tilt" name="tilt"></div>\n' +
        '<div class="col-sm-3 text"><input type="number" title="Tilt" name="tilt_num" class="field"></div>\n' +
        '</div>\n' +
        '</form>\n';

    document.getElementById('light-curve-div').innerHTML = HTML;

}