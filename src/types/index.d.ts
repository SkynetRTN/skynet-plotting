interface ChartInfoFormElements extends HTMLCollection {
    title: HTMLInputElement,
    data: HTMLInputElement,
    xAxis: HTMLInputElement,
    yAxis: HTMLInputElement,
    x2Axis: HTMLInputElement,
    y2Axis: HTMLInputElement
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
    period: HTMLInputElement,
    period_num: HTMLInputElement,
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
    bins: HTMLInputElement,
    period: HTMLInputElement,
    period_num: HTMLInputElement,
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
    distrangeCheckbox: HTMLInputElement,
    d: HTMLInputElement,
    distrange: HTMLInputElement,
    err: HTMLInputElement,
    red: HTMLInputElement,
    d_num: HTMLInputElement,
    distrange_num: HTMLInputElement,
    err_num: HTMLInputElement,
    red_num: HTMLInputElement,
    distScatter: HTMLInputElement,
    distScatter_num: HTMLInputElement,
    redScatter: HTMLInputElement,
    redScatter_num: HTMLInputElement,
}

interface ModelForm extends HTMLFormElement {
    age: HTMLInputElement,
    age_num: HTMLInputElement,
    metal: HTMLInputElement,
    metal_num: HTMLInputElement,
    ageScatter: HTMLInputElement,
    ageScatter_num: HTMLInputElement,
    metalScatter: HTMLInputElement,
    metalScatter_num: HTMLInputElement,
    red: HTMLInputElement,
    blue: HTMLInputElement,
    lum: HTMLInputElement,
    red2: HTMLInputElement,
    blue2: HTMLInputElement,
    lum2: HTMLInputElement,
    red3: HTMLInputElement,
    blue3: HTMLInputElement,
    lum3: HTMLInputElement,
    red4: HTMLInputElement,
    blue4: HTMLInputElement,
    lum4: HTMLInputElement,
}
interface ClusterProForm extends HTMLFormElement {
    ramotion: HTMLInputElement,
    ramotion_num: HTMLInputElement,
    rarange: HTMLInputElement,
    rarange_num: HTMLInputElement,
    decmotion: HTMLInputElement,
    decmotion_num: HTMLInputElement,
    decrange: HTMLInputElement,
    decrange_num: HTMLInputElement,
    rarangeCheckbox: HTMLInputElement,
    decrangeCheckbox: HTMLInputElement,
}

interface GravityForm extends HTMLFormElement {
    mass: HTMLInputElement,
    ratio: HTMLInputElement,
    mass_num: HTMLInputElement,
    ratio_num: HTMLInputElement
    dist: HTMLInputElement,
    dist_num: HTMLInputElement
    merge: HTMLInputElement,
    merge_num: HTMLInputElement
    Time: HTMLInputElement,
    Strain: HTMLInputElement,

}
interface ClusterSimForm extends HTMLFormElement {
    starNum: HTMLInputElement,
    starNum_num: HTMLInputElement,
    noise: HTMLInputElement,
    noise_num: HTMLInputElement,
}