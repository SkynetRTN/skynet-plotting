import { Chart, Plugin } from "chart.js"
import { AnyObject } from "chart.js/types/basic";
import {ChartType} from "chart.js/auto";
import { auto } from "@popperjs/core";

//The Gif that plays over the graph (could be a still image if we really want)
const loadAnim = weightedRandomString();

function weightedRandomString(): string {
  // Calculate the total weight
  const weightedStrings = [
    { value: "waitbear.gif", weight: 1 },
    { value: "wizardtype.gif", weight: 33 },
    { value: "wizardzap.gif", weight: 33 },
    { value: "wizardmistify.gif", weight: 33 }
  ];
  const totalWeight = weightedStrings.reduce((sum, str) => sum + str.weight, 0);

  // Generate a random number between 0 and totalWeight
  const randomValue = Math.random() * totalWeight;

  // Find the string with the corresponding weight
  let cumulativeWeight = 0;
  for (const weightedString of weightedStrings) {
      cumulativeWeight += weightedString.weight;
      if (randomValue <= cumulativeWeight) {
          // Add the chosen string to the base string
          return "../assets/" + weightedString.value;
      }
  }
  // This should not happen, but if it does, return the original base string
  return "../assets/waitbear.gif";
}

declare module 'chart.js' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface PluginOptionsByType<TType extends ChartType> {
      buffer: BufferAnimOptions;
    }
  
    enum UpdateModeEnum {
      buffer = 'buffer-anim-Plugin'
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-var
}

export const bufferAnimPlugin: Plugin = {
  id: 'bufferAnim',

  start: (chart: Chart, _args, options: BufferAnimOptions) => {

    //create the gif, but hide it for now
    var imageObj = new Image()
    imageObj.src = loadAnim;
    imageObj.hidden = true;

    //Fits in the chart area
    imageObj.style.width = "auto";
    imageObj.style.height = "45%";
    imageObj.style.objectFit = "contain"
    imageObj.style.position = "absolute";
    imageObj.style.top = imageObj.style.bottom = imageObj.style.left = imageObj.style.right = "0";
    imageObj.style.margin = "auto";


    chart.ctx.canvas.parentNode.appendChild(imageObj)

    //I can't figure out how to add these to the interface, but these functions DO work and ARE useable, even if they get marked
    chart.startBuffer = () => {imageObj.hidden = false};
    chart.endBuffer = () => {imageObj.hidden = true};

  },
  
};

interface BufferAnimOptions extends AnyObject{
  image: string;
}