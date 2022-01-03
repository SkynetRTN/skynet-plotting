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

interface ScatterFormElements extends HTMLCollection {
    d: HTMLInputElement,
    x: HTMLInputElement,
    d_num: HTMLInputElement,
    x_num: HTMLInputElement,
}
interface ScatterForm extends HTMLFormElement {
    elements: ScatterFormElements
}

interface VariableFormElements extends HTMLCollection {
    mode: HTMLInputElement
}
interface VariableForm extends HTMLFormElement {
    elements: VariableFormElements
}
interface VariableLightCurveFormElements extends HTMLCollection {
    source: HTMLInputElement,
    mag: HTMLInputElement
}
interface VariableLightCurveForm extends HTMLFormElement {
    elements: LightCurveFormElements
}
interface FourierFormElements extends HTMLCollection {
    start: HTMLInputElement,
    stop: HTMLInputElement
}
interface VariableFourierForm extends HTMLFormElement {
    elements: FourierFormElements
}
interface VariablePeriodFoldingFormElements extends HTMLCollection {
    pf: HTMLInputElement,
}
interface VariablePeriodFoldingForm extends HTMLFormElement {
    elements: PeriodFoldingFormElements
}

interface SpectrumFormElements extends HTMLCollection {
    channel: HTMLSelectElement
}
interface SpectrumForm extends HTMLFormElement {
    elements: SpectrumFormElements
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

interface ClusterForm extends HTMLFormElement {
    d: HTMLInputElement,
    err: HTMLInputElement,
    age: HTMLInputElement,
    red: HTMLInputElement,
    metal: HTMLInputElement,
    d_num: HTMLInputElement,
    err_num: HTMLInputElement,
    age_num: HTMLInputElement,
    red_num: HTMLInputElement,
    metal_num: HTMLInputElement
}

interface FilterForm extends HTMLFormElement {
    red: HTMLInputElement,
    blue: HTMLInputElement,
    lum: HTMLInputElement
}