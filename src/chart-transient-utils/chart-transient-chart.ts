'use strict';

import Chart from "chart.js/auto";
import "chartjs-chart-error-bars";
import { CategoryScale, ChartDataset, LinearScale, registerables } from "chart.js";
import { ScatterWithErrorBarsController, PointWithErrorBar } from 'chartjs-chart-error-bars';
import { round } from "./../my-math"

export class TransientChart {

    chart: Chart;
    timeShift: number;
    eventShift: number;
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
            //type: ScatterWithErrorBarsController.id,
            data: {
                maxMJD: Number.NEGATIVE_INFINITY,
                minMJD: Number.POSITIVE_INFINITY,
                labels: [],
                datasets: [],
            },
            options: {
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

    shiftData(shift: number) {
        // shift           // new input 
        // this.eventShift // previous input
        // this.timeShift  // scale shift using min/max values

        let data = {};
        let tmp = [];
        let x = "x" as keyof typeof data;
        let y = "y" as keyof typeof data;

        const range = this.getDatasets().length;
        for (let i = 0; i < range; i++) {
            tmp = [];
            for (let j = 0; j < this.getDataset(i).data.length; j++) {
                tmp.push({
                    x: this.getDataset(i).data[j][x] - (shift - this.eventShift),
                    y: this.getDataset(i).data[j][y]
                });
            }
            this.updateDataFromDataset(tmp, i);
        }
        this.eventShift = shift;
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

    /*setBuffer(buffer: number) {
        const min = this.chart.data.minMJD;
        const max = this.chart.data.maxMJD;
        this.chart.options.scales['x'].min = min - buffer;
        this.chart.options.scales['x'].max = max + buffer;
    }*/
    
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