import { Chart } from "chart.js"

export const image = new Image();
image.src = 'pics/specplot_3.png';

export const backgroundPlugin = {
  id: 'custom_canvas_background_image',
  beforeDraw: (chart: Chart) => {
    if (image.complete) {
      const ctx = chart.ctx;
      const {top, left, width, height} = chart.chartArea;
      const x = left + width / 2 - image.width / 2;
      const y = top + height / 2 - image.height / 2;
      ctx.drawImage(image, x, y);
    } else {
      image.onload = () => chart.draw();
    }
  }
};

export interface BackgroundOptions {
  backgroundImage: HTMLImageElement
}