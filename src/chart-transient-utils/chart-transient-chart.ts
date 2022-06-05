'use strict';

import Chart from "chart.js/auto";
import "chartjs-chart-error-bars";
import { CategoryScale, ChartDataset, LinearScale, registerables } from "chart.js";
import { ScatterWithErrorBarsController, PointWithErrorBar } from 'chartjs-chart-error-bars';
import { round } from "./../my-math"

export class TransientChart {

    chart: Chart;

    /* SHIFTS */
    timeShift: number;
    eventShift: number;
    filterShift: Map<string, number> = new Map();

    /* MIN MAX */
    minMag: number;
    maxMag: number;

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

    /* DATA MANIPULATION */

    setBoundaries(data: any[]) {
        // reset old bounds first
        this.setMinMJD(Number.POSITIVE_INFINITY);
        this.setMinMag(Number.POSITIVE_INFINITY);
        this.setMaxMJD(0);
        this.setMaxMag(0);

        // find new bounds
        let min = this.getMinMJD();
        let max = this.getMaxMJD();
        let minMag = this.getMinMag();
        let maxMag = this.getMaxMag();

        for (let i = 0; i < data.length; i++) {
            min = Math.min(min, data[i][0]);
            max = Math.max(max, data[i][0]);
            minMag = Math.min(minMag, data[i][1]);
            maxMag = Math.max(maxMag, data[i][1]);
        }
        this.setMinMJD(min);
        this.setMaxMJD(max);
        this.setMinMag(minMag);
        this.setMaxMag(maxMag);
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

        console.log('new shift');
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
        if (axis === "x") { this.setEventShift(shift); }
    }

    clearDataFromDataset(idx: number) {
        this.updateDataFromDataset([], idx);
    }

    clearDatasets() {
        this.chart.data.datasets = [];
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
        //this.update();
    }

    /* SETTERS */

    setTimeShift(shift: number) {
        this.timeShift = shift;
    }

    setEventShift(shift: number) {
        this.eventShift = shift;
    }

    setMagShift(filter: string, shift: number) 
    {
        // console.log(filter, shift);
        // console.log(this.filterShift);
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

    setMinMag(min: number) {
        this.minMag = min;
    }

    setMaxMag(max: number) {
        this.maxMag = max;
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

    /* GETTERS */

    getMinMJD() {
        return this.chart.data.minMJD;
    }

    getMaxMJD() {
        return this.chart.data.maxMJD;
    }

    getMinMag() {
        return this.minMag;
    }

    getMaxMag() {
        return this.maxMag;
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
    
    /* OTHER */

    






    
    
    getColorMap(){
        let filterColorArray = [
            ['U', '#8601AF'],
            ['B', '#0247FE'],
            ['V', '#66B032'],
            ['R', '#FE2712'],
            ['I', '#4424D6'],
            ['Y', '#347C98'],
            ['J', '#66B032'],
            ['H', '#FC600A'],
            ['K', '#FE2712'],
            ['uprime', '#4424D6'],
            ['gprime', '#347C98'],
            ['rprime', '#FC600A'],
            ['iprime', '#8601AF'],
            ['zprime', '#0247FE'],
        ]; // colors hand picked by Dan himself!
    
        let colorMap = new Map();
    
        for (let i = 0; i < filterColorArray.length; i++) {
            colorMap.set(filterColorArray[i][0], filterColorArray[i][1]);
        }
    
        return colorMap;
    }
}