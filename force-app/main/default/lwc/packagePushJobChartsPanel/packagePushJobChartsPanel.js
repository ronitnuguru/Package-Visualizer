import { LightningElement, api } from 'lwc';
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import chartJs from "@salesforce/resourceUrl/chartJs";
import getPackagePushJobChartData from "@salesforce/apex/PackageVisualizerCtrl.getPackagePushJobChartData";

export default class PackagePushJobChartsPanel extends LightningElement {
    @api pushId;
    @api selectedStatusOptionsString;
    @api applyFilters;
    chartValue = "Status";

    chartsJsInit = false;
    displaySpinner = true;

    chart;
    chartData;
    chartFields;
    chartVals;

    renderedCallback() {
        this.chartsJsInitialized();
    }

    chartsJsInitialized() {
        if (this.chartsJsInit) {
            return;
        }
        this.chartsJsInit = true;
        this.displaySpinner = true;
        Promise.all([
            loadScript(this, chartJs + "/chartJs/Chart.min.js"),
            loadStyle(this, chartJs + "/chartJs/Chart.min.css")
        ])
            .then(() => {
                this.displaySpinner = false;
                this.prepData();
            })
            .catch(error => {
                console.error(error);
                this.displaySpinner = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Error loading Charts",
                        message: error,
                        variant: "error"
                    })
                );
            });
    }

    createCharts() {
        if (this.chartsJsInit) {
            window.Chart.platform.disableCSSInjection = true;
            const canvas = document.createElement("canvas");
            this.template.querySelector("div.chart").appendChild(canvas);
            const ctx = canvas.getContext("2d");
            const config = {
                type: "doughnut",
                data: {
                    datasets: [
                        {
                            data: this.chartVals,
                            backgroundColor: [
                                "#52B7D8",
                                "#E16032",
                                "#FFB03B",
                                "#54A77B",
                                "#4FD2D2",
                                "#E287B2"
                            ]
                        }
                    ],
                    labels: this.chartFields
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "right",
                        align: "start"
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            };
            this.chart = new window.Chart(ctx, config);
        }
    }

    get chartOptions() {
        return [
            { label: "Status", value: "Status" }
        ];
    }

    handleChartOptionsChange(event) {
        this.chartValue = event.detail.value;
        this.chartData = false;
        this.template
            .querySelector("div.chart")
            .removeChild(this.template.querySelector("canvas"));
        this.prepData();
    }

    prepData() {
        this.displaySpinner = true;
        let wrapper;
        wrapper = [
            {
                fieldName: "PackagePushRequestId",
                value: this.pushId,
                dataType: "STRING"
            }
        ];
        if (this.applyFilters) {
            if (
                this.selectedStatusOptionsString !== "" &&
                this.selectedStatusOptionsString !== undefined
            ) {
                wrapper.push({
                    fieldName: "Status",
                    value: this.selectedStatusOptionsString,
                    dataType: "LIST"
                });
            }
        }
        (async () => {
            await getPackagePushJobChartData({
                filterWrapper: wrapper,
                groupByField: this.chartValue
            })
                .then(result => {
                    this.chartData = result;
                    this.chartFields = result.map(field => {
                        return field[this.chartValue];
                    });
                    this.chartVals = result.map(value => {
                        return value.expr0;
                    });
                    this.displaySpinner = false;
                    this.createCharts();
                })
                .catch(error => {
                    console.error(error);
                    this.displaySpinner = false;
                    // Toast for Failure
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Something went wrong",
                            message: error,
                            variant: "error"
                        })
                    );
                });
        })();
    }
}