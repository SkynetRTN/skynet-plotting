import {Chart, Plugin} from "chart.js"
import {AnyObject} from "chart.js/types/basic";
import {ChartType} from "chart.js/auto";

export const drReichart = new Image();
drReichart.src = 'https://www.nasa.gov/images/content/133199main_Daniel_Reichart_photo.jpg';

declare module 'chart.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface PluginOptionsByType<TType extends ChartType> {
        background: BackgroundOptions;
    }

    enum UpdateModeEnum {
        background = 'backgroundPlugin'
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-var
}

export const backgroundPlugin: Plugin = {
    id: 'background',
    beforeDraw: (chart: Chart, args, options: BackgroundOptions) => {
        if (options.image === null) {
            return;
        }

        if (!(options.image instanceof HTMLImageElement)) {
            var url = URL.createObjectURL(options.image);
            options.image = new Image();
            options.image.src = url;
        }

        if (options.image.complete) {
            const {ctx, chartArea: {top, bottom, left, right, width, height}} = chart;
            //draw spectogram
            ctx.drawImage(options.image, 121, 61, 958, 460, left, top, width, height);
            //draw color bar
            ctx.drawImage(options.image, 1090, 60, 12, 462, right + 5, top, 12, height)
        } else {
            options.image.onload = () => chart.draw();
        }
    },
};

interface BackgroundOptions extends AnyObject {
    image: HTMLImageElement | Blob;
}
