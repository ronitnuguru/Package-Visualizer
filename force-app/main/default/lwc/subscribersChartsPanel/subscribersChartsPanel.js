import { LightningElement, api } from "lwc";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import chartJs from "@salesforce/resourceUrl/chartJs";
import getSubscriberChartData from "@salesforce/apex/PackageVisualizerCtrl.getSubscriberChartData";

export default class SubscribersChartsPanel extends LightningElement {
  @api subscriberPackageId;
  @api packageSubscriberVersionId;
  @api selectedOrgTypeOptionsString;
  @api selectedOrgStatusOptionsString;
  @api selectedInstancesString;
  @api searchTerm;
  @api applyFilters;
  chartValue = "OrgType";

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
      { label: "Subscribers by Org Type", value: "OrgType" },
      { label: "Subscribers by Org Status", value: "OrgStatus" },
      { label: "Subscribers by Instance", value: "InstanceName" },
      { label: "Subscribers by Version", value: "MetadataPackageVersionId" }
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
    if (this.packageSubscriberVersionId) {
      wrapper = [
        {
          fieldName: "MetadataPackageId",
          value: this.subscriberPackageId,
          dataType: "STRING"
        },
        {
          fieldName: "MetadataPackageVersionId",
          value: this.packageSubscriberVersionId,
          dataType: "STRING"
        }
      ];
    } else {
      wrapper = [
        {
          fieldName: "MetadataPackageId",
          value: this.subscriberPackageId,
          dataType: "STRING"
        }
      ];
    }
    if (this.searchTerm !== undefined) {
      if (this.searchTerm.length >= 3) {
        wrapper.push({
          fieldName: "OrgName",
          value: this.searchTerm,
          dataType: "SEARCH"
        });
      }
    }
    if (this.applyFilters) {
      if (
        this.selectedOrgTypeOptionsString !== "" &&
        this.selectedOrgTypeOptionsString !== undefined
      ) {
        wrapper.push({
          fieldName: "OrgType",
          value: this.selectedOrgTypeOptionsString,
          dataType: "LIST"
        });
      }
      if (
        this.selectedOrgStatusOptionsString !== "" &&
        this.selectedOrgStatusOptionsString !== undefined
      ) {
        wrapper.push({
          fieldName: "OrgStatus",
          value: this.selectedOrgStatusOptionsString,
          dataType: "LIST"
        });
      }
      if (
        this.selectedInstancesString !== "" &&
        this.selectedInstancesString !== undefined
      ) {
        wrapper.push({
          fieldName: "InstanceName",
          value: this.selectedInstancesString,
          dataType: "LIST"
        });
      }
    }
    (async () => {
      await getSubscriberChartData({
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