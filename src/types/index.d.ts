interface InputPoint {
    x: string,
    y: string
}

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
interface LineForm extends HTMLFormElement {
    elements: LineFormElements
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

interface PulsarFormElements extends HTMLCollection {
    mode: HTMLInputElement
}
interface PulsarForm extends HTMLFormElement {
    elements: PulsarFormElements
}
interface LightCurveFormElements extends HTMLCollection {
    dt: HTMLInputElement
}
interface LightCurveForm extends HTMLFormElement {
    elements: LightCurveFormElements
}
interface FourierFormElements extends HTMLCollection {
    fouriermode: HTMLInputElement,
    pstart: HTMLInputElement,
    pstop: HTMLInputElement,
    fstart: HTMLInputElement,
    fstop: HTMLInputElement,
    rc: HTMLInputElement
}
interface FourierForm extends HTMLFormElement {
    elements: FourierFormElements
}
interface PeriodFoldingFormElements extends HTMLCollection {
    pf: HTMLInputElement,
    bins: HTMLInputElement
}
interface PeriodFoldingForm extends HTMLFormElement {
    elements: PeriodFoldingFormElements
}
interface PolarizationFormElements extends HTMLCollection {
    diff: HTMLInputElement,
    eq: HTMLInputElement,
    eq_num: HTMLInputElement
}
interface PolarizationForm extends HTMLFormElement {
    elements: PolarizationFormElements
}