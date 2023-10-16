import { TransientChart } from "./chart";
import { linkInputs } from "./../util"

// TODO: disable and enable have a lot of duplicated code. Merge them to a single method.

export class HTML {
    constructor() {
        this.init();
    };

    /**
     * Disables the html element which prevents it from being accessed by the user. If the 
     * element has a linked element (e.g., a slider with an input box), then the linked 
     * element's id can be provided to also disable it.
     * 
     * @param id - id of the element to be disabled
     * @param [linkedId] - id of the linked element
     */
    static disable(id: string, linkedId?: string) {
        if (typeof id !== typeof "") throw new TypeError("ID '" + String(id) + "' is not a string.");

        const element = (document.getElementById(id) as HTMLInputElement);
        if (element === undefined) throw new TypeError("Element with ID '" + String(id) + "' does not exist.");
        element.disabled = true;

        if (linkedId !== undefined) {
            if (typeof linkedId !== typeof "") throw new TypeError("ID '" + String(linkedId) + "' is not a string.");

            const linkedElement = (document.getElementById(linkedId) as HTMLInputElement);
            if (linkedElement === undefined) throw new TypeError("Element with ID '" + String(linkedId) + "' does not exist.");
            linkedElement.disabled = true;
        } 
    }

    /**
     * Enables the html element which prevents it from being accessed by the user. If the 
     * element has a linked element (e.g., a slider with an input box), then the linked 
     * element's id can be provided to also enable it.
     * 
     * @param id - id of the element to be enabled
     * @param [linkedId] - id of the linked element
     */
    static enable(id: string, linkedId?: string) {
        if (typeof id !== typeof "") throw new TypeError("ID '" + String(id) + "' is not a string.");

        const element = (document.getElementById(id) as HTMLInputElement);
        if (element === undefined) throw new TypeError("Element with ID '" + String(id) + "' does not exist.");
        element.disabled = false;

        if (linkedId !== undefined) {
            if (typeof linkedId !== typeof "") throw new TypeError("ID '" + String(linkedId) + "' is not a string.");

            const linkedElement = (document.getElementById(linkedId) as HTMLInputElement);
            if (linkedElement === undefined) throw new TypeError("Element with ID '" + String(linkedId) + "' does not exist.");
            linkedElement.disabled = false;
        } 
    }

    static createModelSliders = (chart: TransientChart) => {
        const a = -0.65, b = -0.5, ebv = 0;
        const t = 5.0, m = 10.0, step = 0.001;
        const parameterForm = document.getElementById('transient-form') as VariableLightCurveForm;

        linkInputs(parameterForm["a"], parameterForm["a_num"], -3, 1, step, a,
            false, true, -100, 100);
        linkInputs(parameterForm["b"], parameterForm["b_num"], -2, 1, step, b,
            false, true, -100, 100);
        linkInputs(parameterForm["ebv"], parameterForm["ebv_num"], 0, 1, step, ebv,
            false, true, 0, 100);
        linkInputs(parameterForm["t"], parameterForm["t_num"], chart.getMinMJD(),
            chart.getMaxMJD(), step, t, false, true, -10000, 10000);
        linkInputs(parameterForm["mag"], parameterForm["mag_num"], 0.,
            30., step, m, false, true, -1000, 1000);
    }

    /**
     * Returns html code for a dropdown entry box with a text description to 
     * the left of the dropdown.
     * 
     * @param options - dropdown entries
     * @param title - text description
     * @param id - id for html component
     * @returns html code for constructed dropdown
     */
    addDropdown = (options: string[], title: string, id: string) => {
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

    /**
     * Retuens html code for a slider with a text entry box. The slider will
     * update the text entry box and vice versa.
     * 
     * @param label - shorthand variable name
     * @param title - full variale name
     * @param id - id for html component
     * @returns html code for constructed slider
     */
    addSliderWithInput = (label: string, title: string, id: string) => {
        let html =
            '<div class="row" style="margin:auto">\n' +
            '<div class="col-sm-2 des">' + label + ':</div>\n' +
            '<div class="col-sm-7 range"><input type="range"' +
            'title="' + title + '" name="' + title + '" id="' + id + '"></div>\n';
        html += this.addInput(title, id + '_num');
        return html;
    }

    /**
     * Returns html code for a text entry box.
     * 
     * @param title - full variale name
     * @param id - id for html component
     * @returns html code for a text entry box
     */
    addInput = (title: string, id: string) => {
        return '<div class="col-sm-3 text"><input step="any" type="number"' +
            'title="' + title + '" name="' + title + '_num"' +
            'class="field" id="' + id + '"></div>\n' +
            '</div>\n' + '<div class="row">\n' + '</div>\n';
    }

    /**
     * Adds a row to the left of the chart
     * 
     * @returns html code for the new empty row
     */
    addRow = () => {
        return '<div class="row">\n' + '</div>\n';
    }

    /**
     * Creates the html code for the Transient Plotting Tool
     */
    init = () => {
        document.getElementById('input-div').insertAdjacentHTML('beforeend',
            '<form title="Variable" id="variable-form" style="padding-bottom: 1em"></form>\n' +
            '<div id="transient-div"></div>\n'
        );

        // Zoom buttons
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

            // Input for Event Time
            '<div class="row">\n' +
                '<div class="col-sm-7">Event Time (MJD): </div>\n' +
                '<div class="col-sm-5"><input class="field" type="number" id="time" title="Event Time" value=0></input></div>\n' +
            '</div>\n';

        const filterOptions = ['U', 'u\'', 'B', 'g\'', 'V', 'r\'', 'R', 'i\'', 'I', 'z\'', 'J', 'H', 'K'];
        HTML += this.addDropdown(['Power Law', 'Exponential'], 'Select Temporal Model', 'temporal');
        HTML += this.addDropdown(['Power Law', 'Extinguished Power Law'], 'Select Spectral Model', 'spectral');
        HTML += this.addDropdown(filterOptions, 'Filter<sub>0</sub>', 'filter');

        HTML += this.addRow();

        HTML += this.addSliderWithInput('b', 'the spectral index of the transient', 'b');
        HTML += this.addSliderWithInput('E(B-V)', 'dust extinction', 'ebv');
        HTML += this.addSliderWithInput('t<sub>0</sub>', 'time the reference exposure was taken', 't');
        HTML += this.addSliderWithInput('mag<sub>0</sub>', 'magnitude of the transient in the reference image', 'mag');
        HTML += this.addSliderWithInput('a', 'the temporal index of the transient', 'a');

        // Best Fit buttons
        HTML +=
            '<div class="row">' +
                '<div style="width: 100%">' +
                    '<button id="best-fit-auto" style="width: 49%">Auto Best Fit</button>' +
                    '<button id="best-fit-manual" style="width: 49%; background-color: lightblue">Manual Best Fit</button>' +
                '</div>' +
            '</div>'

        document.getElementById('transient-div').innerHTML = HTML;
        (document.getElementById("ebv_num") as HTMLInputElement).disabled = true;
        (document.getElementById("ebv") as HTMLInputElement).disabled = true;
    }
}
