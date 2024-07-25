'use strict';

import "chartjs-chart-error-bars";
import 'chartjs-plugin-zoom';

import Chart from "chart.js/auto";
import { round } from "./../my-math";
import { LinearScaleOptions } from "chart.js";
import { FILTERCOLORS, FILTERS } from "./../chart-transient-utils/chart-transient-util";
import { Photometry } from "../transient/photometry";
import { Model } from "../transient/model";


export class TransientChart {

    constructor() {
        this.minMag = Number.POSITIVE_INFINITY;
        this.maxMag = Number.NEGATIVE_INFINITY;
        this.initialize();
    }

    chart: Chart;

    private _minMag: number;
    private _maxMag: number;

    get minMag(): number { return this._minMag; }
    set minMag(min: number) { this._minMag = min; }

    get maxMag(): number { return this._maxMag; }
    set maxMag(max: number) { this._maxMag = max; }

    getMinMJD(): number { return this.chart.data.minMJD; }
    setMinMJD(min: number) { this.chart.data.minMJD = min; }

    getMaxMJD(): number { return this.chart.data.maxMJD; }
    setMaxMJD(max: number) { this.chart.data.maxMJD = max; }

    initialize() {
        const ctx = (document.getElementById("myChart") as HTMLCanvasElement).getContext('2d');

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                maxMJD: Number.NEGATIVE_INFINITY,
                minMJD: Number.POSITIVE_INFINITY,
                labels: [],
                datasets: [],
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: '',
                    },
                    legend: {
                        labels: {
                            filter: item => {
                                if (typeof (item.text) === 'string') {
                                    if (item.text.includes("error-bar")) {
                                        return false
                                    }
                                    if (item.text.includes("model")) {
                                        return false;
                                    }
                                    return true;
                                }
                            }
                        }
                    },
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
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return '(' + round(context.parsed.x, 4) + ', ' +
                                    round(context.parsed.y, 4) + ')';
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        display: true,
                        type: 'logarithmic',
                        position: 'bottom',
                        ticks: {},
                    }
                }
            }
        });
        chart.options.plugins.title.text = "Title";
        chart.options.scales['x'].title.text = "x";
        chart.options.scales['y'].title.text = "y";
        this.chart = chart;
    }

    /**
     * Returns the min and max values of the x-axis as seen in the
     * viewport.
     * 
     * @returns tuple containing the min and max x values
     */
    getVisibleRange(): Array<number> {
        const ticks = this.chart.scales.x.ticks;
        const min = this.chart.scales['x'].ticks[0];
        const max = this.chart.scales['x'].ticks[ticks.length - 1]
        return [min.value, max.value];
    }

    update() {
        this.chart.update('none');
    }

    resetView() {
        this.chart.options.scales = {
            x: {
                display: true,
                type: this.chart.options.scales['x'].type,
                position: 'bottom',
                ticks: {},
            },
            y: {
                reverse: true
            }
        }
        this.chart.update();
    }

    /**
     * Updates the chart to reflect changes to the raw table data.
     * 
     * @param photometry - Photometry data object
     */
    updateAfterTableChange(photometry: Photometry) {
        const modelForm = document.getElementById('transient-form') as VariableLightCurveForm;
        const chartForm = document.getElementById('chart-info-form') as ChartInfoForm;
        const eventTime = parseFloat((document.getElementById('time') as HTMLInputElement).value);
        this.setBoundaries(photometry.julianDates, photometry.magnitudes);
        this.addScatterData(photometry);
        this.addModel(photometry, modelForm, eventTime);
        this.updateLegend(chartForm);
        this.update();
    }

    /**
     * Calculates the magnitude due to a change in modelling parameters
     * at two points and plots them by drawing a straight line between
     * them. 
     * 
     * @param form - form containing the modelling parameters
     */
    updateModel(form: VariableLightCurveForm) {
        const range = [Math.max(this.getVisibleRange()[0], 0.0001), Math.max(this.getVisibleRange()[1], this.getMaxMJD())];
        const model = new Model(form);

        const eventTimeInput = document.getElementById('time') as HTMLInputElement;
        const eventTime = parseFloat(eventTimeInput.value);

        for (let i = 0; i < this.chart.data.datasets.length; i++) {
            let data: {x: number, y: number}[] = [];
            let label = this.getDataset(i).label;
            if (label.includes("model")) {
                for (let r of range) {
                    // fit to the raw data then shift by the offset
                    let offset = window.photometry.getMagnitudeOffset(label.split('-')[0]);
                    data.push({x: r, y: model.calculate(label.split("-")[0], r, eventTime) + offset});
                }
                this.chart.data.datasets[i].data = data;
            }
            this.update();
        }
    }

    /**
     * Calculates the magnitude at two points due to a change in the
     * photometry data and plots them by drawing a straight line between 
     * them.
     * 
     * @param photometry - updated photometry object
     * @param modelForm - form containing the modelling parameters
     */
    addModel(photometry: Photometry, modelForm: VariableLightCurveForm, eventTime: number) {
        const range = [Math.max(this.getVisibleRange()[0], this.getMinMJD()), Math.max(this.getVisibleRange()[1], this.getMaxMJD())];
        this.chart.options.scales["x"].min = range[0];
        this.chart.options.scales["x"].max = range[1];

        const model = new Model(modelForm);

        console.log(range);

        photometry.groupByFilterName().forEach((_, key) => {
            if (FILTERS.includes(key)) {
                let data: {x: number, y: number}[] = [];
                for (let r of range) {
                    // fit to the raw data then shift by the offset
                    let offset = window.photometry.getMagnitudeOffset(key);
                    data.push({x: r, y: model.calculate(key, r, eventTime) + offset});
                }

                // add the model data points
                this.chart.data.datasets.push({
                    label: key + "-model",
                    data: data,
                    backgroundColor: FILTERCOLORS[key],
                    borderColor: FILTERCOLORS[key],
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    pointBorderWidth: 0,
                    hidden: false,
                    showLine: true,
                    spanGaps: false,
                    parsing: {},
                });
                this.update();
            }
        });
    }

    /**
     * Adds photometry data to the chart.
     * 
     * @param photometry - Photometry object containing rows of data
     * @param clear - true to wipe existing data, false to append
     */
    addScatterData(photometry: Photometry, clear: boolean = true) {
        if (clear) this.clearDatasets();

        photometry.groupByFilterName().forEach((values, key) => {
            let data: {x: number, y: number}[] = [], errors: {x: number, y: number}[] = [];
            for (let value of values) {
                if (photometry.rowIsValid(value)) { // photometry is allowed to have null rows, chart is not
                    data.push({x: value.julianDate, y: value.magnitude});
                    errors.push({x: null, y: null}); // prevents error bars from connecting to each other
                    errors.push({x: value.julianDate, y: value.magnitude - value.uncertainty});
                    errors.push({x: value.julianDate, y: value.magnitude + value.uncertainty});
                }
            }

            if (FILTERS.includes(key)) {
                // add the photometry data points
                this.chart.data.datasets.push({
                    label: key + '+' + String(photometry.getMagnitudeOffset(key)),
                    data: data,
                    backgroundColor: FILTERCOLORS[key],
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    showLine: false,
                    hidden: false,
                    parsing: {},
                });
                this.update();

                // add the error bars
                this.chart.data.datasets.push({
                    label: key + "-error-bar",
                    data: errors,
                    borderColor: "black",
                    borderWidth: 1,
                    pointRadius: 0,
                    showLine: true,
                    spanGaps: false,
                    parsing: {}
                });
                this.update();
            }
        });
        this.chart.update();
    }

    /**
     * Shifts the x-axis by the specified amount in the negative direction
     * 
     * @param os - relative offset (compared to previously applied offset)
     */
    shiftJulianDates(os: number) {
        if (isNaN(os) || os === 0) return;

        let xData: number[] = [], yData: number[] = [];
        for (let i = 0; i < this.chart.data.datasets.length; i++) {
            let dataset = this.chart.data.datasets[i];
            for (let j = 0; j < dataset.data.length; j++) {
                if ((dataset.data[j] as {x:number, y:number}).x !== null) {
                    (dataset.data[j] as {x:number, y:number}).x -= os;
                    xData.push((dataset.data[j] as {x:number, y:number}).x);
                    yData.push((dataset.data[j] as {x:number, y:number}).y);
                }
            }
        }
        this.setBoundaries(xData, yData);
        this.resetView();
        this.chart.update();
    }

    /**
     * Shifts the y-axis by the specified amount and updates the corresponding labels
     *
     * @param filter
     * @param ros - signed relative offset (compared to previously applied offset)
     * @param aos - signed absolute offset (compared to the raw table data)
     */
    shiftMagnitudes(filter: string, ros: number, aos: number) {
        if (isNaN(ros) || ros === 0) return;

        for (let i = 0; i < this.chart.data.datasets.length; i++) {
            let dataset = this.chart.data.datasets[i];

            if (dataset.label.includes(filter)) {
                if (!dataset.label.includes('model') && !dataset.label.includes('error')) {
                    dataset.label = filter + (aos < 0 ? '' : '+') + String(aos);
                }
                for (let j = 0; j < dataset.data.length; j++) {
                    if ((dataset.data[j] as {x:number, y:number}).y !== null) {
                        (dataset.data[j] as {x:number, y:number}).y += ros;
                    }
                }
            }
        }
        this.chart.update();
    }

    updateAxisLabel(form: ChartInfoForm) {
        (this.chart.options.scales['x'] as LinearScaleOptions).title.text = form.elements['xAxis'].value;
        (this.chart.options.scales['y'] as LinearScaleOptions).title.text = form.elements['yAxis'].value;
        this.chart.update();
    }

    updateTitle(form: ChartInfoForm) {
        this.chart.options.plugins.title.text = form.elements['title'].value;
        this.chart.update();
    }

    updateLegend(form: ChartInfoForm) {
        let labels = "";
        this.getDatasets().forEach(dataset => {
            let labelToBeAdded = dataset.label;
            if (!labelToBeAdded.includes("model") && !labelToBeAdded.includes("error")) {
                if (labels !== "") { labels += ", "; }
            labels += labelToBeAdded;
            }
        });
        form.elements['data'].value = labels;
    }

    /**
     * Sets the minimum and maximum bounds of chart data
     * 
     * @param julianDates - list of x-axis data 
     * @param magnitudes - list of y-axis data
     */
    setBoundaries(julianDates: number[], magnitudes: number[]) {
        julianDates = julianDates.filter(d => !isNaN(d) && d !== null);
        magnitudes = magnitudes.filter(m => !isNaN(m) && m !== null);

        this.minMag = Math.min(...magnitudes);
        this.maxMag = Math.max(...magnitudes);
        this.setMinMJD(Math.min(...julianDates));
        this.setMaxMJD(Math.max(...julianDates));
        this.setBuffer(0.5);
    }

    /**
     * Removes the data from the datasets. An optional parameter may be
     * passed to only remove data from the model or error datasets.
     * 
     * @param [type] - 'model' | 'error' | null 
     */
    clearDatasets(type?: string) { // model, error, else
        if (type) {
            const range = this.getDatasets().length;
            for (let i = 0; i < range; i++) {
                if (this.getDataset(i).label.includes(type)) {
                    this.chart.data.datasets[i].data = [];
                }
            }
        } else {
            this.chart.data.datasets = [];
        }
    }

    getDataset(idx: number) {
        if (this.chart.data.datasets.length > idx) {
            return this.chart.data.datasets[idx];
        } else {
            throw new RangeError("Chart dataset does not have a " + idx + "-th element");
        }
    }

    getDatasets() {
        return this.chart.data.datasets;
    }

    /**
     * Pad the x-axis data to prevent the chart from ending on data
     * 
     * @param buffer - padding amount
     */
    setBuffer(buffer: number) {
        this.chart.options.scales['x'].min = Math.min(0, this.getMinMJD() - buffer);
        this.chart.options.scales['x'].max = this.getMaxMJD() + buffer;
    }

    /**
     * Reverse the chart scale to properly display magnitude scale
     * 
     * @param reverse 
     */
    setReverseScale(reverse: boolean) {
        this.chart.options.scales['y'].reverse = reverse;
    }

    /**
     * Sets the scale to either log or linear depending on the model
     *
     * @param scale
     */
    setScale(scale: string) {
        if (scale !== 'linear' && scale !== 'logarithmic') return;
        this.chart.options.scales['x'].type = scale;
        this.chart.update();
    }
}
