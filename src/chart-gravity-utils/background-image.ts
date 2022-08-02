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
    let bg: HTMLImageElement;
    if(options.image instanceof Blob)
    {
        var url = URL.createObjectURL(options.image)
        bg.src = url;
    }
    else  
    {
        bg = options.image;
    }

    if (bg.complete) {
    const {ctx, chartArea: {top, bottom, left, right, width, height}} = chart;
    ctx.drawImage(bg, left, top, width, height);
    } else {
    bg.onload = () => chart.draw();
    }
  },
};

interface BackgroundOptions extends AnyObject{
  image: HTMLImageElement | Blob;
}