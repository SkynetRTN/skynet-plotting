import * as Chart from 'chart.js';
declare module 'chart.js'{
    interface ChartDataSets {
        immutableLabel: boolean;
    }
}