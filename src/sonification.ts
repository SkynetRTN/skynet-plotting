/*************************************
 * SONIFICATION
 ************************************/
 import { Chart } from "chart.js/auto";
 import { ScatterDataPoint } from "chart.js";
 import { colors } from "./config"
 import { saveAs } from 'file-saver';
 import { formatTime, getDateString } from "./util"
 import { ArrMath, sfc32 } from "./my-math"

 /**
 * This function plays a Chart's sonification (or restarts it if it is already playing).
 * @param myChart The chart to play.
 */
 export function play(myChart: Chart){
    if(!myChart.data.sonification)
    {
        console.error("Chart has no sonification options provided.");
        return;
    }

    let sonification = myChart.data.sonification

    sonification.audioControls.playPause.innerHTML = "Wait";
    sonification.audioControls.playPause.style.backgroundColor = colors['yellow']
    sonification.audioControls.playPause.style.color = "black";
    setTimeout(() => {//so for some dumb idiot reason, the color of the button doesnt change to yellow until AFTER sonification unless you put a timeout on this
    //audioCtx.resume();
    if(myChart.data.modeLabels.lastMode === 'lc')
    {
        sonification.audioSource = sonify(myChart,0,1,false);
        sonification.audioSource.onended = () => pause(myChart);
    };
    if(myChart.data.modeLabels.lastMode === 'pf')
        sonification.audioSource = sonify(myChart,5,6,true);
    sonification.audioSource.start();
    sonification.audioControls.playPause.onclick = () => {pause(myChart)}

    sonification.audioControls.playPause.innerHTML = "Stop";
    sonification.audioControls.playPause.style.backgroundColor = colors['red']
    sonification.audioControls.playPause.style.color = "white";
    }, 0);
}

/**
 * This function stops a Chart's playing sonification (or does nothing if it isn't playing).
 * @param myChart The chart to stop.
 */
export function pause(myChart: Chart){
    if(!myChart.data.sonification)
    {
        console.error("Chart has no sonification options provided.");
        return;
    }

    let sonification = myChart.data.sonification
    sonification.audioControls.playPause.onclick = () => {play(myChart)};

    try//If the buffer is already stopped, don't do it again
    {
        sonification.audioSource.stop();
    }
    catch (DOMException)
    {}

    //change button to normal
    sonification.audioControls.playPause.innerHTML = "Sonify";
    sonification.audioControls.playPause.style.backgroundColor = ''
    sonification.audioControls.playPause.style.color = "black";
}

/**
 * Updates a chart's playback speed
 * @param myChart The chart to be mutated
 
 export function updateSpeed(myChart: Chart)
 {
    myChart.data.sonification.audioSource.setplaybackRate = 
 }*/

/**
 * This saves a chart's sonification as a .wav
 * @param myChart The chart to be saved.
 */
export function saveSonify(myChart: Chart){
    let sonification = myChart.data.sonification
    if(myChart.data.modeLabels.lastMode === 'lc')
    {
        if(!sonification.audioSource.buffer)
            sonification.audioSource = sonify(myChart,0,1)
        downloadBuffer(sonification.audioSource.buffer)
    }

    
    if(myChart.data.modeLabels.lastMode === 'pf')
    {
        if(!sonification.audioSource.buffer)
            sonification.audioSource = sonify(myChart,4,5, true)
        downloadBuffer(sonification.audioSource.buffer, 60)
    }
}

//May want to add a mono mode. I hate how this function looks but it works
/**
 * This function creates an audioBuffer using data from the chart
 * @param myChart The chart to be sonified.
 * @param dataSet1 The dataset to sonify as the first stereo channel.
*  @param dataSet2 The dataset to sonify as the second stereo channel.
 * @param loop Loop audio?
 * @param destination node to link the audioBuffer to. links to the contxt's destination by default.
 */
export function sonify(myChart: Chart, dataSet1: number, dataSet2: number, loop: boolean = true, destination?: AudioNode){
    let rand = sfc32(2,3,5,7);// We actually WANT the generator seeded the same every time- that way the resulting buffer is always the same with repeated playbacks
    let ctx = myChart.data.sonification.audioContext

    let channel0 = myChart.data.datasets[dataSet1].data as ScatterDataPoint[],
        channel1 = myChart.data.datasets[dataSet2].data as ScatterDataPoint[],
        time = channel0[channel0.length-1].x - channel0[0].x;//length of the audio buffer
    
    if(loop)//This smooths out the looping by adding an extra point with the same y value as the first on the end
    {
        var first1: ScatterDataPoint = {y:0,x:0};
        first1.y = channel0[0].y;
        var first2: ScatterDataPoint = {y:0,x:0};
        first2.y = channel1[0].y;

        first1.x = channel0[channel0.length-1].x + time/channel0.length;
        first2.x = channel0[channel0.length-1].x + time/channel0.length;

        channel0 = channel0.concat(first1);
        channel1 = channel1.concat(first2);
        time = channel0[channel0.length-1].x - channel0[0].x;//length of the audio buffer
    }

    let norm0 = 1 / ArrMath.max(channel0.map(p => p.y))
    let norm1 = 1 / ArrMath.max(channel1.map(p => p.y))

    // Create an empty stereo buffer at the sample rate of the AudioContext. First channel is channel 1, second is channel 2.
    var arrayBuffer = ctx.createBuffer(2,ctx.sampleRate*time, ctx.sampleRate);//lasts as long as time

    let prev0 = 0;//data point with the greatest time value less than the current time
    let prev1 = 0;
    let next0 = 1;//next data point
    let next1 = 1;

    for (var i = 0; i < arrayBuffer.length; i++) {
        let x0 = channel0[0].x + i/ctx.sampleRate;//channel0[0].x + i/ctx.sampleRate is the time on the chart the sample is
        let x1 = channel0[0].x + i/ctx.sampleRate;
        if(x0 > channel0[next0].x){
            prev0 = next0;
            next0++;
        }
        if(x1 > channel1[next1].x){
            prev1 = next1
            next1++;
        }

        arrayBuffer.getChannelData(0)[i] = norm0 * linearInterpolation(channel0[prev0],channel0[next0],x0) * (2*rand()-1); // Left Channel
        arrayBuffer.getChannelData(1)[i] = norm1 * linearInterpolation(channel1[prev1],channel1[next1],x1) * (2*rand()-1);  //multiply by norm: the maximum y value is 10 in the buffer
    }
    
    // Get an AudioBufferSourceNode to play our buffer.
    const sonifiedChart = ctx.createBufferSource();//Note to self: see if this works if not a const
    sonifiedChart.loop = loop; //play on repeat?
    sonifiedChart.buffer = arrayBuffer
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    if(destination)
        sonifiedChart.connect(destination);
    else
    sonifiedChart.connect(ctx.destination);
    return sonifiedChart;

    //accepts x values and returns a y value based on a line between the points immediately before and after the given x value
    function linearInterpolation(prev: ScatterDataPoint, next: ScatterDataPoint, x: number): number
    {
        let slope = (next.y-prev.y)/(next.x-prev.x)
        let y = slope*(x-prev.x) + prev.y
        return y;
    }
}

/**
 * This function converts an icky Buffer [ :( ] into an epic blob in the stylings of a .wav [ :D ]
 * @param buf The audioBuffer to make into a file.
 * @param time Desired time length of the file in seconds. Loops the buffer if greater than the buffer time.
 */
function bufferToWav(buf: AudioBuffer, time: number)
{   
    var numOfChan = buf.numberOfChannels,
        numOfSamples = Math.round(time * buf.sampleRate),
        length = numOfSamples * numOfChan * 4 + 44//add room for metadata
    length = length > 2147483648? 2147483648 : length; //cuts back if the length is beyond 2GB (Hopefully )
    
    var buffer = new ArrayBuffer(length),
        view = new DataView(buffer), //Where we put a da data
        channels = [], 
        sample,
        i,
        offset = 0,
        pos = 0;

    // write WAVE header
	setUint32(0x46464952);                         //"RIFF"
	setUint32(length - 8);                         //The length of the rest of the file
	setUint32(0x45564157);                         //"WAVE"

	setUint32(0x20746d66);                         //"fmt " chunk
	setUint32(16);                                 //subchunk size = 16
	setUint16(1);                                  //PCM (uncompressed)
	setUint16(numOfChan);                          //What it says on the tin
	setUint32(buf.sampleRate);                     
	setUint32(buf.sampleRate * 4 * numOfChan);     //byte rate
	setUint16(numOfChan * 4);                      //block-align
	setUint16(32);                                 //32-bit

	setUint32(0x61746164);                         //"DATA" - chunk
	setUint32(length - pos - 4);                   //chunk length

    // write interleaved data
    for(i = 0; i < numOfChan; i++)
        channels.push(buf.getChannelData(i));
    
    while(pos < length) {
        for(i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clip invalid values
            sample *= ((1<<31)-1); // scale to 32-bit signed int
            setUint32(sample);
        }

        offset++                                     // next source sample
        if (offset >= buf.length)
            offset = 0;//loop back to buffer start
            
    }

    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data: any) {
        view.setUint16(pos, data, true);
        pos += 2;
      }
    
    function setUint32(data: any) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

/**
 * This function downloads a buffer as a .wav
 * @param buf The audioBuffer to make into a file.
 * @param time Time length of the file in seconds. Defaults to the length of the buffer.
 */
function downloadBuffer(buf: AudioBuffer, time?: number)
{
    if(!time)
        time = buf.length / buf.sampleRate; //default to buffer length

    saveAs(bufferToWav(buf,time), 'sonification-' + formatTime(getDateString()) + '.wav');
}