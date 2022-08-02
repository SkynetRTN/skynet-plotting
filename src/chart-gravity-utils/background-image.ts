import { Chart, Plugin } from "chart.js"
import { AnyObject } from "chart.js/types/basic";

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
    if (options.image.complete) {
      const {ctx, chartArea: {top, bottom, left, right, width, height}} = chart;
      ctx.drawImage(options.image, left, top, width, height);
    } else {
      options.image.onload = () => chart.draw();
    }
  },
};

interface BackgroundOptions extends AnyObject{
  image: HTMLImageElement
}