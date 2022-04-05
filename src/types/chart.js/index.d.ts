import { ChartDatasetProperties, ChartType, ScatterDataPoint } from 'chart.js/auto'

declare module 'chart.js/auto'{
    interface ChartData<TType extends ChartType, TData, TLabel = unknown> {
        minT?: number,
        minMJD?: number,
        maxMJD?: number,
        modified?: {
            lightCurveChanged: boolean,
            fourierChanged: boolean,
            periodFoldingChanged: boolean
        },
        modeLabels?: {
            lc: ModeLabels,
            ft: ModeLabels,
            pf: ModeLabels,
            lastMode: PulsarMode
        },
        sonification?:{
            audioContext: AudioContext,
            audioSource: AudioBufferSourceNode,
            audioControls:
            {
                playPause: HTMLButtonElement,
                save: HTMLButtonElement
            },
        }
    }
    interface ChartDatasetProperties<TType extends ChartType, TData> {
        immutableLabel?: boolean,
        rawData?: ScatterDataPoint[]
    }
}

type PulsarMode = 'lc' | 'ft' | 'pf' ;

interface ModeLabels {
    t: string,
    x: string,
    y: string
}