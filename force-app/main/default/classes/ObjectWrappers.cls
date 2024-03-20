/*******************************************************************************************
* @Name         ObjectWrappers 
* @Date         11/10/2020
* @Description  All the wrapper classes used in 2GP Visualizer Package.  
*******************************************************************************************/

public with sharing class ObjectWrappers{

	/**************************************************************************************
	* @Description  Wrapper Class for Package Details. ObjectWrappers.PackageWrapper
	**************************************************************************************/ 
    public class PackageWrapper { 
        @AuraEnabled public String containerOptions {get;set;}
        @AuraEnabled public String packageErrorUsername {get;set;}
        @AuraEnabled public String description {get;set;}
        @AuraEnabled public String id {get;set;}
        @AuraEnabled public Boolean isDeprecated {get;set;}
        @AuraEnabled public String name {get;set;}
        @AuraEnabled public String namespacePrefix {get;set;}
        @AuraEnabled public String subscriberPackageID {get;set;}
        @AuraEnabled public Boolean isOrgDependent {get;set;}
        @AuraEnabled public Boolean wasTransferred	{get;set;}
        @AuraEnabled public PackageCreator createdBy {get;set;}
        @AuraEnabled public Datetime createdDate {get;set;}
        @AuraEnabled public string owner {get;set;}
    }

	/**************************************************************************************
	* @Description  Wrapper Class for Package Version Details. ObjectWrappers.PackageVersionWrapper
	**************************************************************************************/    
    public class PackageVersionWrapper {
        @AuraEnabled public string id{get;set;} //05i
        @AuraEnabled public string ancestorId{get;set;}
        @AuraEnabled public string package2Id{get;set;} //0Ho
        @AuraEnabled public string name{get;set;} //Name
        @AuraEnabled public string branch{get;set;}
        @AuraEnabled public string description{get;set;}
        @AuraEnabled public Boolean hasPassedCodeCoverageCheck{get;set;}
        @AuraEnabled public Boolean validationSkipped{get;set;}
        @AuraEnabled public string installKey{get;set;}
        @AuraEnabled public Boolean isDeprecated{get;set;}
        @AuraEnabled public Boolean isPasswordProtected{get;set;}
        @AuraEnabled public Boolean isReleased{get;set;}
        @AuraEnabled public Integer majorVersion{get;set;}
        @AuraEnabled public Integer minorVersion{get;set;}
        @AuraEnabled public Integer patchVersion{get;set;} 
        @AuraEnabled public Integer buildNumber{get;set;}
        @AuraEnabled public string versionNumber{get;set;} //Major.minor.patch-build
        @AuraEnabled public string subscriberPackageVersionId{get;set;} //Subscriber Install Id (04t)
        @AuraEnabled public string installUrl{get;set;} //login.salesforce......
        @AuraEnabled public string tag{get;set;}
        @AuraEnabled public string buildDurationInSeconds{get;set;}
        @AuraEnabled public string releaseVersion{get;set;}
        @AuraEnabled public PackageCreator createdBy{get;set;}
        @AuraEnabled public Datetime createdDate{get;set;}
        @AuraEnabled public CodeCoverage codeCoverage{get;set;}
        @AuraEnabled public Boolean isSecurityReviewed {get;set;}
        @AuraEnabled public string language {get;set;}
        @AuraEnabled public string owner {get;set;}
        @AuraEnabled public Boolean hasMetadataRemoved {get; set;}
    }

    public class PackageCreator {
        public string name{get;set;}
    }

    public class CodeCoverage {
        public String apexCodeCoveragePercentage{get;set;}
    }

	/**************************************************************************************
	* @Description  Wrapper Class for Package Subscriber Details. ObjectWrappers.PackageSubscriberWrapper
	**************************************************************************************/     
    public class PackageSubscriberWrapper{
        @AuraEnabled public string id{get;set;} 
        @AuraEnabled public String installedStatus{get;set;}
        @AuraEnabled public String instanceName{get;set;}
        @AuraEnabled public String metadataPackageId{get;set;}
        @AuraEnabled public String metadataPackageVersionId{get;set;}
        @AuraEnabled public String orgKey{get;set;}
        @AuraEnabled public String orgName{get;set;}
        @AuraEnabled public String orgStatus{get;set;}
        @AuraEnabled public String orgType{get;set;}
        @AuraEnabled public String parentOrg{get;set;}
        @AuraEnabled public datetime SystemModstamp;
    }

	/**************************************************************************************
	* @Description  Wrapper Class for Filter Wrapper. ObjectWrappers.FilterWrapper
	**************************************************************************************/     
   	public class FilterWrapper{        
        @AuraEnabled public string fieldName{get;set;}        
        @AuraEnabled public string value{get;set;} 
        @AuraEnabled public string dataType{get;set;} 
    }

    public class PackagePushRequestWrapper{
        @AuraEnabled public string Id;
        @AuraEnabled public String PackageVersionId{get;set;}
        @AuraEnabled public Datetime ScheduledStartTime{get;set;}
        @AuraEnabled public Integer DurationSeconds{get;set;}
        @AuraEnabled public Datetime EndTime{get;set;}
        @AuraEnabled public Datetime StartTime{get;set;}
        @AuraEnabled public String Status{get;set;}
        @AuraEnabled public datetime SystemModstamp;
    }

    public class PackagePushJobWrapper{
        @AuraEnabled public String PackagePushRequestId{get;set;}
        @AuraEnabled public String SubscriberOrganizationKey{get;set;}
        @AuraEnabled public ObjectAttributes attributes{get;set;}
        @AuraEnabled public Integer DurationSeconds{get;set;}
        @AuraEnabled public Datetime EndTime{get;set;}
        @AuraEnabled public Datetime StartTime{get;set;}
        @AuraEnabled public String Status{get;set;}
        @AuraEnabled public datetime SystemModstamp;
        @AuraEnabled public PackagePushErrorsWrapper PackagePushErrors{get;set;}
    }

    public class PackagePushErrorsWrapper{
        @AuraEnabled public List<JobErrorsWrapper> records{get;set;}
    }

    public class JobErrorsWrapper {
        @AuraEnabled public String ErrorTitle{get;set;}
        @AuraEnabled public String ErrorMessage{get;set;}
    }

    public class ObjectAttributes{
        @AuraEnabled public String type{get;set;}
    }

    public class PackagePushResult {
        @AuraEnabled public String id;
        @AuraEnabled public Boolean success;
    }
    
    public class MetadataPackageVersionWrapper{
    	@AuraEnabled public string Id;
        @AuraEnabled public string Name;
        @AuraEnabled public Integer BuildNumber;
        @AuraEnabled public Boolean IsDeprecated;
        @AuraEnabled public Integer MajorVersion;
        @AuraEnabled public string  MetadataPackageId;
        @AuraEnabled public Integer MinorVersion;
        @AuraEnabled public integer PatchVersion;
        @AuraEnabled public string  ReleaseState;
        @AuraEnabled public datetime SystemModstamp;
    }

    public class LMAVersionWrapper{
        @AuraEnabled public Object createdDate;
        @AuraEnabled public Object id;
        @AuraEnabled public Object name;
        @AuraEnabled public Object isBeta;
        @AuraEnabled public Object lmaPackageId;
        @AuraEnabled public Object lmaPackageName;
        @AuraEnabled public Object releaseDate;
        @AuraEnabled public Object packageVersionId;
        @AuraEnabled public Object lmaVersionName;
    }

    public class LMALicenseWrapper{
        @AuraEnabled public Object id;
        @AuraEnabled public Object lastModifiedDate;
        @AuraEnabled public Object name;
        @AuraEnabled public Object accountId;
        @AuraEnabled public Object accountName;
        @AuraEnabled public Object contactId;
        @AuraEnabled public Object contactName;
        @AuraEnabled public Object installDate;
        @AuraEnabled public Object leadId;
        @AuraEnabled public Object leadName;
        @AuraEnabled public Object packageVersionNumber;
        @AuraEnabled public Object licensedSeats;
        @AuraEnabled public Object seats;
        @AuraEnabled public Object licenseStatus;
        @AuraEnabled public Object licenseType;
        @AuraEnabled public Object leadSource;
        @AuraEnabled public Object leadEmail;
        @AuraEnabled public Object lmaExpirationDate;
        @AuraEnabled public Object usedLicenses;
    }

    public class LMAPackageWrapper{
        @AuraEnabled public Object id;
        @AuraEnabled public Object packageSubsriberId;
    }

    public class LMALicenseHistoryWrapper{
        @AuraEnabled public Object Id;
        @AuraEnabled public Object Field;
        @AuraEnabled public Object NewValue;
        @AuraEnabled public Object OldValue;
        @AuraEnabled public Object CreatedDate;
    }

    /**************************************************************************************
	* @Description  Wrapper Class for 1GPPackage Details. ObjectWrappers.PackageWrapper
	**************************************************************************************/ 
    public class PackageWrapper1{ 
        @AuraEnabled public String id{get;set;}
        @AuraEnabled public String name{get;set;}
        @AuraEnabled public String namespacePrefix{get;set;}
        @AuraEnabled public String packageCategory{get;set;}
        @AuraEnabled public datetime systemModstamp{get;set;}
    }

    /**************************************************************************************
	* @Description  Wrapper Class for 1GP Package Version Details. ObjectWrappers.PackageVersionWrapper
	**************************************************************************************/

    public class Package1VersionWrapper{
        @AuraEnabled public String id {get; set;}
        @AuraEnabled public String metadataPackageId {get; set;}
        @AuraEnabled public String name {get; set;}
        @AuraEnabled public Boolean isDeprecated {get; set;}
        @AuraEnabled public Integer majorVersion {get; set;}
        @AuraEnabled public Integer minorVersion {get; set;}
        @AuraEnabled public Integer buildNumber {get; set;}
        @AuraEnabled public Integer patchVersion {get; set;}
        @AuraEnabled public String releaseState {get; set;}
        @AuraEnabled public string versionNumber {get;set;}
        @AuraEnabled public datetime systemModstamp {get;set;}
    }

    public class SignupRequestWrapper{
        @AuraEnabled public String company {get;set;}
        @AuraEnabled public String country {get;set;}
        @AuraEnabled public String createdOrgId {get;set;}
        @AuraEnabled public String createdOrgInstance {get;set;}
        @AuraEnabled public String errorCode {get;set;}
        @AuraEnabled public String firstName {get;set;}
        @AuraEnabled public String lastName {get;set;}
        @AuraEnabled public String preferredLanguage {get;set;}
        @AuraEnabled public String resolvedTemplateId {get;set;}
        @AuraEnabled public Boolean shouldConnectToEnvHub {get;set;}
        @AuraEnabled public String signupEmail {get;set;}
        @AuraEnabled public String signupSource {get;set;}
        @AuraEnabled public String status {get;set;}
        @AuraEnabled public String subdomain {get;set;}
        @AuraEnabled public Boolean isSignupEmailSuppressed {get;set;}
        @AuraEnabled public String templateId {get;set;}
        @AuraEnabled public Integer trialDays {get;set;}
        @AuraEnabled public String trialSourceOrgId {get;set;}
        @AuraEnabled public String username {get;set;}
        @AuraEnabled public String edition {get;set;}
        @AuraEnabled public Boolean isTSO {get;set;}
        @AuraEnabled public datetime systemModstamp;
        @AuraEnabled public datetime createdDate;
        @AuraEnabled public string owner {get;set;}
        @AuraEnabled public PackageCreator createdBy{get;set;}
    }
}