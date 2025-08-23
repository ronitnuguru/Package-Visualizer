import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import get2GPPackageVersionList from "@salesforce/apexContinuation/PackageVisualizerCtrl.get2GPPackageVersionList";
import calculatePackageVersionCodeCoverage from "@salesforce/apex/PackageVisualizerCtrl.calculatePackageVersionCodeCoverage";
import verifySecurityReviewApproved from "@salesforce/apex/PackageVisualizerCtrl.verifySecurityReviewApproved";
import getSubscriberChartData from "@salesforce/apex/PackageVisualizerCtrl.getSubscriberChartData";
import setPackage2Fields from "@salesforce/apexContinuation/PackageVisualizerCtrl.setPackage2Fields";

export default class PackageVersionDetails extends LightningElement {
  @api versionId;
  @api packageId;
  @api packageBuildNumber;
  @api packageHasPassedCodeCoverageCheck;
  @api packageInstallUrl;
  @api packageIsDeprecated;
  @api packageIsPasswordProtected;
  @api packageIsReleased;
  @api packageName;
  @api packageVersionNumber;
  @api packageSubscriberVersionId;
  @api packageValidationSkipped;
  @api packageMetadataRemoved;
  @api packageAncestorId;
  @api packageBranch;
  @api packageTag;
  @api packageType;
  @api packageDescription;
  @api packageBuildDurationInSeconds;
  @api packageReleaseVersion;
  @api packageLanguage;
  @api packageCreatedDate;
  @api packageCreatedBy;
  @api packageValidatedAsync;

  sfdxPackageInstalls;

  displayCodeCoverage;
  displayCodeCoveragePopover;
  codeCoverageLink;
  displaySpinner;
  subscribersCount;
  subscriberLabel;
  displaySecurityReviewButton;
  displaySecurityReview;
  isSecurityReviewApproved;
  isPatchVersion;

  editMode;

  displayPromoteWarningModal;

  connectedCallback() {
    this.sfdxPackageInstall = `sf force:package:install -p ${this.packageSubscriberVersionId} -w 20`;
    this.displaySecurityReviewButton = this.packageType === "Managed" && this.packageIsReleased ? true : false;
    this.codeCoverageLink =
      this.packageType === "Managed"
        ? `https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_dev2gp_code_coverage.htm`
        : `https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_unlocked_pkg_code_coverage.htm`;
    
    this.isPatchVersion = this.packageVersionNumber.split(".")[2].split('-')[0] > 0 ? true : false;
  }

  get isManaged() {
    return this.packageType === "Managed" ? true : false;
  }

  handlePackageSubscribers() {
    this.dispatchEvent(new CustomEvent("subscribersclick"));
  }

  handleAncestry() {
    this.dispatchEvent(
      new CustomEvent("ancestryclick", {
        detail: this.packageSubscriberVersionId
      })
    );
  }

  handlePushUpgrades() {
    this.dispatchEvent(new CustomEvent("pushupgradesclick"));
  }

  handlePopoverClose() {
    this.displayCodeCoveragePopover = false;
  }

  handleEdit() {
    this.editMode = true;
  }

  handleEditCancel() {
    this.editMode = false;
  }

  get warningPromoteBody() {
    return `Are you sure you want to promote package version "${this.packageVersionNumber}"`;
  }

  get packageReleaseVersionUrl(){
    let releaseNotesVersion = 2 * this.packageReleaseVersion + 128;
    return `https://help.salesforce.com/s/articleView?id=release-notes.salesforce_release_notes.htm&release=${releaseNotesVersion}`;
  }

  onBrandClick(){
    this.handlePromote();
  }

  onNeutralClick(){
    this.displayPromoteWarningModal = false;
  }

  handlePromoteWarning(){
    this.displayPromoteWarningModal = true;
  }

  handlePromote() {
    let wrapper = [
      {
        fieldName: "IsReleased",
        value: true,
        dataType: "BOOLEAN"
      }
    ];
    this.displaySpinner = true;
    (async () => {
      await setPackage2Fields({
        filterWrapper: wrapper,
        objectName: "Package2Version",
        objectId: this.versionId
      })
        .then(result => {
          if (result === 'success') {
            this.loadPackageVersion();
          } else {
            let resultMessage = JSON.parse(result);
            if (resultMessage[0].errorCode) {
              this.displaySpinner = false;
              this.dispatchEvent(
                new ShowToastEvent({
                  title: resultMessage[0].errorCode,
                  message: resultMessage[0].message,
                  variant: "error"
                })
              );
            } else {
              console.error(errorMessage);
              this.displaySpinner = false;
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Something went wrong",
                  message: errorMessage,
                  variant: "error"
                })
              );
            }
          }
          this.displayPromoteWarningModal = false;
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
          this.displayPromoteWarningModal = false;
        });
    })();
  }

  handleEditSave() {
    try {
      let wrapper = [];
      let editableFields = this.template.querySelectorAll(".edit-field");
      editableFields.forEach(input => {
        if (input.value) {
          wrapper.push({
            fieldName: input.name,
            value: input.value,
            dataType: "STRING"
          });
        }
      });
      if (wrapper.length > 0) {
        this.displaySpinner = true;
        (async () => {
          await setPackage2Fields({
            filterWrapper: wrapper,
            objectName: "Package2Version",
            objectId: this.versionId
          })
            .then(result => {
              if (result === "success") {
                this.editMode = false;
                this.loadPackageVersion();
              } else {
                let errorMessage = JSON.parse(result);
                this.editMode = false;
                console.error(errorMessage);
                this.displaySpinner = false;
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: "Something went wrong",
                    message: errorMessage,
                    variant: "error"
                  })
                );
              }
            })
            .catch(error => {
              console.error(error);
              this.displaySpinner = false;
              this.editMode = false;
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
    } catch (error) {
      console.error(error);
      this.displaySpinner = false;
      this.editMode = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Something went wrong",
          message: error,
          variant: "error"
        })
      );
    }
  }

  loadPackageVersion() {
    let wrapper = [
      {
        fieldName: "SubscriberPackageVersionId",
        value: this.packageSubscriberVersionId,
        dataType: "STRING"
      }
    ];
    (async () => {
      await get2GPPackageVersionList({
        filterWrapper: wrapper,
        sortedBy: "createdDate",
        sortDirection: "asc",
        versionLimit: 1,
        versionOffset: 0
      })
        .then(result => {
          this.displaySpinner = false;
          const version = result[0];
          this.packageName = version.name;
          this.packageBranch = version.branch;
          this.packageTag = version.tag;
          this.packageDescription = version.description;
          this.packageIsReleased = version.isReleased;
          this.displaySecurityReviewButton = this.packageType === "Managed" && this.packageIsReleased ? true : false;
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: `${this.packageVersionNumber} was successfully updated`,
              variant: "success"
            })
          );
          this.dispatchEvent(new CustomEvent("packageupdate", {
            detail: {
              packageName: version.name,
              packageBranch: version.branch,
              packageTag: version.tag,
              packageDescription: version.description,
              packageIsReleased: version.isReleased
            }
          }));
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

  handleSubscriberMenuSelect(event) {
    this.handleSubscribersCount(event.detail.value);
  }

  handleAllSubscribers() {
    this.handleSubscribersCount("");
  }

  handleSubscribersCount(orgType) {
    this.displaySpinner = true;
    let wrapper;
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
    if (orgType !== "") {
      wrapper.push({
        fieldName: "OrgType",
        value: orgType,
        dataType: "STRING"
      });
    }
    (async () => {
      await getSubscriberChartData({
        filterWrapper: wrapper,
        groupByField: "MetadataPackageVersionId"
      })
        .then(result => {
          this.displaySpinner = false;
          if (result.length > 0) {
            this.subscribersCount = result[0].expr0;
            this.subscriberLabel =
              orgType === "" ? `Subscribers` : `${orgType} Subscribers`;
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Subscribers Count Calculated",
                message: `${this.packageVersionNumber} currently has ${this.subscribersCount} ${orgType} Subscribers`,
                variant: "success"
              })
            );
          } else {
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Subscribers Count Calculated",
                message: `${this.packageVersionNumber} currently has 0 ${orgType} Subscribers`,
                variant: "warning"
              })
            );
          }
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

  handleSecurityReview() {
    this.displaySpinner = true;
    (async () => {
      await verifySecurityReviewApproved({
        subscriberPackageVersionId: this.packageSubscriberVersionId
      })
        .then(result => {
          this.displaySpinner = false;
          this.displaySecurityReview = true;
          this.isSecurityReviewApproved = result;
          if (this.isSecurityReviewApproved === true) {
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Security Review",
                message: `${this.packageVersionNumber} has passed Security Review!`,
                variant: "success"
              })
            );
          } else {
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Security Review",
                message: `${this.packageVersionNumber} has not passed Security Review! {0}`,
                messageData: [
                  {
                      url: `https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/security_review_guidelines.htm`,
                      label: 'Learn More'
                  },
                ],
                variant: "warning"
              })
            );
          }
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

  handleCodeCoverage() {
    this.displaySpinner = true;
    (async () => {
      await calculatePackageVersionCodeCoverage({
        subscriberPackageVersionId: this.packageSubscriberVersionId
      })
        .then(result => {
          this.displaySpinner = false;
          this.displayCodeCoverage = result >= 0 ? result : undefined;
          this.displayCodeCoveragePopover = result === "-1" ? true : false;
          if (!this.displayCodeCoveragePopover) {
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Code Coverage Calculated",
                message: `${this.packageVersionNumber} currently has ${this.displayCodeCoverage}% code coverage`,
                variant: "success"
              })
            );
          }
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