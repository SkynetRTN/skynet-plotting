# Cluster Tools Functions

## Dependency

The following outline shows how cluster main file class function/class from each package.
Their dependencies are also listed.

Functions in _italic_ are private. Links are not clickable, but look good in markdown. xD

    No cross-reference!

* Cluster
    * @[scatter](./chart-cluster-scatter.ts)
        * ChartScaleControl
            * insertGraphControl @[interface](./chart-cluster-interface.ts)
            * modelFormKey @[util](./chart-cluster-util.ts)
            * HRrainbow @[util](./chart-cluster-util.ts)
            * _chartRescale_
                * filterMags @[util](./chart-cluster-util.ts)
                * filterWavelength @[util](./chart-cluster-util.ts)
                * modelFormKey @[util](./chart-cluster-util.ts)
                * HRrainbow @[util](./chart-cluster-util.ts)
        * graphScale
        * updateScatter
            * filterWavelength @[util](./chart-cluster-util.ts)
            * modelFormKey @[util](./chart-cluster-util.ts)
            * pointMinMax @[util](./chart-cluster-util.ts)
            * HRrainbow @[util](./chart-cluster-util.ts)
            * _chartRescale_
                * filterMags @[util](./chart-cluster-util.ts)
                * filterWavelength @[util](./chart-cluster-util.ts)
                * modelFormKey @[util](./chart-cluster-util.ts)
                * HRrainbow @[util](./chart-cluster-util.ts)
    * insertClusterControls @[interface](./chart-cluster-interface.ts)
    * updateHRModel @[model](./chart-cluster-model.ts)
        * httpGetAsync @[util](./chart-cluster-util.ts)
        * modelFormKey @[util](./chart-cluster-util.ts)
        * modelFormKeys @[util](./chart-cluster-util.ts)
        * pointMinMax @[util](./chart-cluster-util.ts)
    * HRrainbow @[util](./chart-cluster-util.ts)
    * dummyData @[dummy](./chart-cluster-dummy.ts)
