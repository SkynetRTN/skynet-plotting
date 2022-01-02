import { ChartDatasetProperties, ChartType } from 'chart.js/auto'
declare module 'chart.js/auto'{
    interface ChartDatasetProperties<TType extends ChartType, TData> {
        immutableLabel?: boolean;
    }
}