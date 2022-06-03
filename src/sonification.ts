/*************************************
 * SONIFICATION
 ************************************/
 import { Chart } from "chart.js/auto";
 import { ScatterDataPoint } from "chart.js";
 import { colors } from "./config"
 import { saveAs } from 'file-saver';
 import { formatTime, getDateString } from "./util"
 import { ArrMath, sfc32 } from "./my-math"


 export function check(oldVal: number, myChart:Chart ){
    let speed: number = +myChart.data.sonification.audioControls.speed.value;
    if(speed !== oldVal){
        pause(myChart);
    }
}

export function Set2DefaultSpeed(myChart:Chart){
    myChart.data.sonification.audioControls.speed.setAttribute("value", "1"); 
    myChart.data.sonification.audioControls.speed.value = "1";   
}


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
    let speed: number = +sonification.audioControls.speed.value;

    sonification.audioControls.playPause.innerHTML = "Wait";
    sonification.audioControls.playPause.style.backgroundColor = colors['yellow']
    sonification.audioControls.playPause.style.color = "black";
    setTimeout(() => {//so for some dumb idiot reason, the color of the button doesnt change to yellow until AFTER sonification unless you put a timeout on this
    //audioCtx.resume();
    if(myChart.data.modeLabels.lastMode == "gravity"){
        console.log("gravity mode played");
        sonification.audioSource = sonify(myChart,[0], speed, false);
        sonification.audioSource.onended = () => pause(myChart);
    } 
    if(myChart.data.modeLabels.lastMode === 'lc'){
        sonification.audioSource = sonify(myChart,[0,1], speed, false);
        sonification.audioSource.onended = () => pause(myChart);
    }
    else if(myChart.data.modeLabels.lastMode === 'pf'){
        sonification.audioSource = sonify(myChart,[5,6], speed);
    }
    else if(myChart.data.modeLabels.lastMode === 'pressto'){
        sonification.audioSource = sonify(myChart,[5,6], speed);
    }

//    if(speed == 0){
//        sonification.audioSource.playbackRate.value = 1;
//    }
//    else{
//        sonification.audioSource.playbackRate.value = speed;
//    }
    sonification.audioSource.start();

    setInterval(check, 500, speed, myChart);

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
export function pause(myChart: Chart, clearInter: boolean = true){
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
        sonification.audioControls.playPause.innerHTML = "Sonify";
        sonification.audioControls.playPause.style.backgroundColor = ''
        sonification.audioControls.playPause.style.color = "black";
        if(clearInter){
            var i = setInterval(function () {}, 100);
//            console.log(i);
//            console.log(i-1);
            clearInterval(i-1);
            clearInterval(i);
        }  
    }
    catch (DOMException)
    {}

    //change button to normal

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
    let speed: number = +sonification.audioControls.speed.value;

    
    if(myChart.data.modeLabels.lastMode == "gravity"){
        if(!sonification.audioSource.buffer)
            sonification.audioSource = sonify(myChart,[0], speed, false);
        downloadBuffer(sonification.audioSource.buffer)
    }  
    else if(myChart.data.modeLabels.lastMode === 'lc')
    {
        if(!sonification.audioSource.buffer)
            sonification.audioSource = sonify(myChart,[0,1], speed)
        downloadBuffer(sonification.audioSource.buffer)
    }
    else if(myChart.data.modeLabels.lastMode === 'pf')
    {
        if(!sonification.audioSource.buffer)
            sonification.audioSource = sonify(myChart,[5,6], speed)
        downloadBuffer(sonification.audioSource.buffer, 60)
    }
    else if(myChart.data.modeLabels.lastMode === 'pressto')
    {
        if(!sonification.audioSource.buffer)
            sonification.audioSource = sonify(myChart, [5], speed)
        downloadBuffer(sonification.audioSource.buffer, 60)
    }
}

/**
 * This function creates an audioBuffer using data from the chart
 * @param myChart The chart to be sonified.
 * @param dataSets A number array containing the numbers of datasets to be converted into channels
 * @param loop Loop audio?
 * @param destination node to link the audioBuffer to. links to the contxt's destination by default.
 */
export function sonify(myChart: Chart, dataSets: number[], speed: number = 1, loop: boolean = true, destination?: AudioNode){
    
    let rand = sfc32(2,3,5,7);// We actually WANT the generator seeded the same every time- that way the resulting buffer is always the same with repeated playbacks
    let ctx = myChart.data.sonification.audioContext

    let channels =  (dataSets.map(d => myChart.data.datasets[d].data as ScatterDataPoint[]));


    console.log(channels);


    for (let j = 0; j < channels[0].length; j++){
        // console.log(channels[i][j]);
        channels[0][j].x = (channels[0][j].x) / speed;
        // console.log(channels[i][j]);
    }

    

    let time = (channels[0][channels[0].length - 1].x - channels[0][0].x);

    if(loop)//This smooths out the looping by adding an extra point with the same y value as the first on the end
    {
        for (let i = 0; i < channels.length; i++)
        {
            var first: ScatterDataPoint = {x:0,y:0};
            first.y = channels[i][0].y;
//            console.log("first.y is " + first.y);
            first.x = (channels[i][channels[i].length-1].x + time/channels[i].length);
//            console.log("first.x is " + first.x);
            channels[i] = channels[i].concat(first);
        }
        time = channels[0][channels[0].length - 1].x - channels[0][0].x;
//        console.log("time is " + time);
//        console.log("channels length is " + channels.length);
    }

    let norm = channels.map(c => 1 / ArrMath.max(c.map(p => p.y)));

    // Create an empty stereo buffer at the sample rate of the AudioContext. First channel is channel 1, second is channel 2.
    var arrayBuffer = ctx.createBuffer(channels.length,ctx.sampleRate*time, ctx.sampleRate);//lasts as long as time

    for (var c = 0; c < channels.length; c++)
    {
        let prev = 0;//data point with the greatest time value less than the current time
        let next = 1;//next data point

        for (var i = 0; i < arrayBuffer.length; i++) {
            let x = channels[c][0].x + i/ctx.sampleRate;//channel0[0].x + i/ctx.sampleRate is the time on the chart the sample is
            if(x > channels[c][next].x){
                prev = next;
                next++;
            }

            arrayBuffer.getChannelData(c)[i] = Math.abs(norm[c] * linearInterpolation(channels[c][prev],channels[c][next],x) * (2*rand()-1));
                ; // Left Channel

        }
    }

    for (let j = 0; j < channels[0].length; j++){
        // console.log(channels[i][j]);
        channels[0][j].x = (channels[0][j].x) * speed;
        // console.log(channels[i][j]);
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