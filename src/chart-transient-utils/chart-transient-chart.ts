'use strict';

import Chart from "chart.js/auto";
import "chartjs-chart-error-bars";
import { CategoryScale, ChartDataset, LinearScale, registerables } from "chart.js";
import { ScatterWithErrorBarsController, PointWithErrorBar } from 'chartjs-chart-error-bars';
import { round } from "./../my-math";
import { Model } from "./chart-transient-model";
import { findDelimiter, FILTERCOLORS } from "./chart-transient-util";

export class TransientChart {

    chart: Chart;

    /* SHIFTS */
    private _timeShift: number;
    private _eventShift: number;
    filterShift: Map<string, number> = new Map();

    /* MIN MAX */
    private _minMag: number;
    private _maxMag: number;

    constructor() {
        this.minMag = Number.POSITIVE_INFINITY;
        this.maxMag = Number.NEGATIVE_INFINITY;
    }

    initialize() {
        const ctx = (document.getElementById("myChart") as HTMLCanvasElement)
            .getContext('2d');

        Chart.register(ScatterWithErrorBarsController, PointWithErrorBar,
            LinearScale, CategoryScale, ...registerables);

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
                                if (typeof(item.text) === 'string') {
                                    if (item.text.includes("error-bar")) {
                                        return false
                                    }
                                    if (item.text.includes("model")) {
                                        return false;
                                    }
                                    return true;
                                }
                                //return true;
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
                        //enabled: false,
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

    /* CHARTJS METHODS */
    getVisibleRange(): Array<number> {
        const ticks = this.chart.scales.x.ticks;
        const min = this.chart.scales['x'].ticks[0];
        const max = this.chart.scales['x'].ticks[ticks.length - 1]
        return [min.value, max.value];
    }

    destroy() {
        this.chart.destroy();
    }

    update() {
        this.chart.update('none');
    }

    resetView() {
        this.chart.options.scales = {
            x: {
                type: this.chart.options.scales['x'].type,
                position: 'bottom'
            },
            y: {
                reverse: true
            }
        }
    }

    /* MODEL METHODS */
    updateModel(form: VariableLightCurveForm) {
        let tempData: Array<{x: number, y: number}> = [];
        const visibleMin = this.getVisibleRange()[0];
        const visibleMax = this.getVisibleRange()[1];
        const buffer = (visibleMax - visibleMin)*0.5;
        const range = [Math.max(visibleMin - 10., 0.1), visibleMax + buffer];

        const model = new Model(form);
        for (let i = 0; i < this.getDatasets().length; i++) {
            tempData = [];
            let label = this.getDataset(i).label;
            let delim = findDelimiter(label);
            let filter = label.split(delim)[0];
            let magShift = this.getMagShift(filter) ? this.getMagShift(filter): 0;
            if (label.includes("model")) {
                for (let j = 0; j < range.length; j++) {
                    let mjd = range[j];
                    let newMag = model.calculate(filter, mjd) + magShift;
                    tempData.push({
                        x: mjd,
                        y: newMag,
                    });
                }
                this.clearDataFromDataset(i);
                this.updateDataFromDataset(tempData, i);
            }
            this.update();
        }
    }

    addModel(data: Map<any, any>, modelForm: VariableLightCurveForm) {
        let tmp: Array<{x: number, y: number}> = [];
        const itr = data.keys();
    
        /* USE VISIBLE RANGES FOR MODEL */
        // let buffer = (chart.getMaxMJD() - chart.getMinMJD())*0.5;
        // let range = [Math.min(lowerBound, 0.1), chart.getMaxMJD() + buffer];
        let lowerBound = 0.1;
        const visibleMin = this.getVisibleRange()[0];
        const visibleMax = this.getVisibleRange()[1];
        if (this.getMinMJD() > 0) {
            lowerBound = visibleMin;
        }
        let buffer = (visibleMax - visibleMin)*0.5;
        let range = [Math.min(lowerBound, 0.1), visibleMax + buffer];
        this.chart.options.scales["x"].max = range[1];
    
        let model = new Model(modelForm);
        for (let i = 0; i < data.size; i++) {
            let key = itr.next().value;
    
            tmp = [];
            let magShift = this.getMagShift(key) ? this.getMagShift(key): 0;
            for (let j = 0; j < range.length; j++) {
                tmp.push({
                    x: range[j],
                    y: model.calculate(key, range[j]) + magShift,
                });
            }
            this.addDataset({
                label: key+"-model",
                data: tmp,
                backgroundColor: FILTERCOLORS[key],
                borderColor: FILTERCOLORS[key],
                pointRadius: 0,
                pointHoverRadius: 0,
                pointBorderWidth: 0,
                hidden: false,
                showLine:true,
                spanGaps: false,
                parsing: {},
            });
        }
    }

    /* NON-MODEL METHODS */
    addData(datapoints: Map<string, Array<Array<number>>>, xShift:number) {
        const dataITR = datapoints.keys();
        const errorITR = datapoints.keys();
        let tmp: Array<{x: number, y: number}> = [];
        let errors: Array<{x: number, y: number}> = [];

        this.clearDatasets();
        // add data
        for (let i = 0; i < datapoints.size; i++) {
            let key = dataITR.next().value;
            let dps = datapoints.get(key);
            let magShift = this.getMagShift(key) ? this.getMagShift(key): 0;
            let operation = magShift < 0 ? '\-' : '\+';

            tmp = [];
            for (let j = 0; j < dps.length; j++) {
                tmp.push({
                    x: dps[j][0] - xShift,
                    y: dps[j][1],
                });
            }
            this.addDataset({
                label: key+operation+String(magShift),
                data: tmp,
                backgroundColor: FILTERCOLORS[key],
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 2,
                showLine: false,
                hidden: false,
                parsing: {},
            });
        }

        // add corresponding errors
        for (let i = 0; i < datapoints.size; i++) {
            let key = errorITR.next().value;
            let dps = datapoints.get(key);

            errors = [];
            for (let j = 0; j < dps.length; j++) {
                errors.push({x:null, y:null});
                errors.push({
                    x: dps[j][0] - xShift,
                    y: dps[j][1]-1,
                });
                errors.push({
                    x: dps[j][0] - xShift,
                    y: dps[j][1] + 1,
                });
            }
            this.addDataset({
                label: "error-bar-" + String(key),
                data: errors,
                borderColor: "black",
                borderWidth: 1,
                pointRadius: 0,
                showLine:true,
                spanGaps: false,
                parsing: {}
            });
        }
    }

    shiftData(axis:string, shift: number) {
        // shift           // new input 
        // this.eventShift // previous input
        // this.timeShift  // scale shift using min/max values
        let data = {};
        let tmp = [];
        let tmpX: number;
        let x = "x" as keyof typeof data;
        let y = "y" as keyof typeof data;

        const range = this.getDatasets().length;
        for (let i = 0; i < range; i++) {
            tmp = [];
            for (let j = 0; j < this.getDataset(i).data.length; j++) {
                if (axis === "x") {
                    // keep null for error bars
                    tmpX = this.getDataset(i).data[j][x];
                    if (tmpX != null) {
                        tmpX -= (shift - this.eventShift);
                    }
                    if (this.getDataset(i).label.includes("R-model")) {
                        console.log(tmpX, this.getDataset(i).data[j][y]);
                    }
                    tmp.push({
                        x: tmpX,
                        y: this.getDataset(i).data[j][y]
                    });
                }
            }
            this.updateDataFromDataset(tmp, i);
        }
        if (axis === "x") { this.eventShift = shift; }
    }

    setBoundaries(data: any[]) {
        // reset old bounds first
        this.setMinMJD(Number.POSITIVE_INFINITY);
        this.minMag = Number.POSITIVE_INFINITY;
        this.setMaxMJD(0);
        this.maxMag = 0;

        // find new bounds
        let min = this.getMinMJD();
        let max = this.getMaxMJD();
        let minMag = this.minMag;
        let maxMag = this.maxMag;

        for (let i = 0; i < data.length; i++) {
            min = Math.min(min, data[i][0]);
            max = Math.max(max, data[i][0]);
            minMag = Math.min(minMag, data[i][1]);
            maxMag = Math.max(maxMag, data[i][1]);
        }
        this.setMinMJD(min);
        this.setMaxMJD(max);
        this.minMag = minMag;
        this.maxMag = maxMag;
    }

    clearDataFromDataset(idx: number) {
        this.updateDataFromDataset([], idx);
    }

    clearDatasets(type?: string) {
        if (type) {
            const range = this.getDatasets().length;
            for (let i = 0; i < range; i++) {
                if (this.getDataset(i).label.includes(type)) {
                    this.clearDataFromDataset(i);
                }
            }
        } else {
            this.chart.data.datasets = [];
        }
    }

    addDataset(dataset: ChartDataset) {
        this.chart.data.datasets.push(dataset);
        this.update();
    }

    updateDataset(dataset: ChartDataset, idx: number) {
        if (this.chart.data.datasets.length > idx) {
            this.chart.data.datasets[idx] = dataset;
        }
        this.update();
    }

    updateDataFromDataset(data: Array<any>, idx: number) {
        if (this.chart.data.datasets.length >= idx) {
            this.chart.data.datasets[idx].data = data;
        }
    }

    /* GETTERS */
    get minMag(): number {
        return this._minMag;
    }

    get maxMag(): number {
        return this._maxMag;
    }

    get timeShift(): number {
        return this._timeShift;
    }

    get eventShift(): number {
        return this._eventShift;
    }

    getMinMJD() {
        return this.chart.data.minMJD;
    }

    getMaxMJD() {
        return this.chart.data.maxMJD;
    }

    getMagShift(filter: string) {
        return this.filterShift.get(filter);
    }

    getDataset(idx: number) {
        if (this.chart.data.datasets.length > idx) {
            return this.chart.data.datasets[idx];
        }
        else {
            console.log('dataset does not exist');
            return null;
        }
    }

    getDatasets() {
        return this.chart.data.datasets;
    }

    /* SETTERS */
    set minMag(min: number) {
        this._minMag = min;
    }

    set maxMag(max: number) {
        this._maxMag = max;
    }

    set timeShift(shift: number) {
        this._timeShift = shift;
    }

    set eventShift(shift: number) {
        this._eventShift = shift;
    }

    setMagShift(filter: string, shift: number) 
    {
        this.filterShift.set(filter, shift);   
        this.update();     
    }

    setBuffer(buffer: number) {
        const min = this.minMag;
        const max = this.maxMag;
        this.chart.options.scales['y'].min = min - buffer;
        this.chart.options.scales['y'].max = max + buffer;
    }
    
    setMinMJD(min: number) {
        this.chart.data.minMJD = min;
    }

    setMaxMJD(max: number) {
        this.chart.data.maxMJD = max;
    }

    setReverseScale(reverse: boolean) {
        this.chart.options.scales['y'].reverse = reverse;
    }

    setScaleType(model: string) {
        if (model === 'Power Law') {
            this.chart.options.scales['x'].type = 'logarithmic';
        } 
        else if (model === 'Exponential') {
            this.chart.options.scales['x'].type = 'linear';
        } else {
            this.chart.options.scales['x'].type = 'logarithmic'; // default
        }
        this.chart.update();
    }
}