interface ChartInfoFormElements extends HTMLCollection {
    title: HTMLInputElement,
    data: HTMLInputElement,
    xAxis: HTMLInputElement,
    yAxis: HTMLInputElement
}

interface ChartInfoForm extends HTMLFormElement {
    elements: ChartInfoFormElements
}

interface LineFormElements extends HTMLCollection {
    magnitude: HTMLInputElement,
    lineCount: HTMLInputElement
}

interface InputPoint {
    x: string,
    y: string
}

interface MoonFormElements extends HTMLCollection {
    a: HTMLInputElement,
    p: HTMLInputElement,
    phase: HTMLInputElement,
    tilt: HTMLInputElement,
    a_num: HTMLInputElement,
    p_num: HTMLInputElement,
    phase_num: HTMLInputElement,
    tilt_num: HTMLInputElement,
}

interface MoonForm extends HTMLFormElement {
    elements: MoonFormElements
}