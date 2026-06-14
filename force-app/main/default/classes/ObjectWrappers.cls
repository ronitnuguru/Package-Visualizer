/*******************************************************************************************
 * @Name         ObjectWrappers
 * @Date         11/10/2020
 * @Description  All the wrapper classes used in 2GP Visualizer Package.
 *******************************************************************************************/

global with sharing class ObjectWrappers {
  /**************************************************************************************
   * @Description  Wrapper Class for Package Details. ObjectWrappers.PackageWrapper
   **************************************************************************************/
  public class PackageWrapper {
    @AuraEnabled
    public String containerOptions { get; set; }
    @AuraEnabled
    public String packageErrorUsername { get; set; }
    @AuraEnabled
    public String description { get; set; }
    @AuraEnabled
    public String id { get; set; }
    @AuraEnabled
    public Boolean isDeprecated { get; set; }
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String namespacePrefix { get; set; }
    @AuraEnabled
    public String subscriberPackageID { get; set; }
    @AuraEnabled
    public Boolean isOrgDependent { get; set; }
    @AuraEnabled
    public Boolean wasTransferred { get; set; }
    @AuraEnabled
    public PackageCreator createdBy { get; set; }
    @AuraEnabled
    public Datetime createdDate { get; set; }
    @AuraEnabled
    public Boolean appAnalyticsEnabled { get; set; }
    @AuraEnabled
    public Boolean dataCloudPackage { get; set; }
    @AuraEnabled
    public string owner { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for Package Version Details. ObjectWrappers.PackageVersionWrapper
   **************************************************************************************/
  global class PackageVersionWrapper {
    @AuraEnabled
    global string id { get; set; } //05i
    @AuraEnabled
    global string ancestorId { get; set; }
    @AuraEnabled
    global string package2Id { get; set; } //0Ho
    @AuraEnabled
    global string name { get; set; } //Name
    @AuraEnabled
    global string branch { get; set; }
    @AuraEnabled
    global string description { get; set; }
    @AuraEnabled
    global Boolean hasPassedCodeCoverageCheck { get; set; }
    @AuraEnabled
    global Boolean validationSkipped { get; set; }
    @AuraEnabled
    global string installKey { get; set; }
    @AuraEnabled
    global Boolean isDeprecated { get; set; }
    @AuraEnabled
    global Boolean isPasswordProtected { get; set; }
    @AuraEnabled
    global Boolean isReleased { get; set; }
    @AuraEnabled
    global Integer majorVersion { get; set; }
    @AuraEnabled
    global Integer minorVersion { get; set; }
    @AuraEnabled
    global Integer patchVersion { get; set; }
    @AuraEnabled
    global Integer buildNumber { get; set; }
    @AuraEnabled
    global string versionNumber { get; set; } //Major.minor.patch-build
    @AuraEnabled
    global string subscriberPackageVersionId { get; set; } //Subscriber Install Id (04t)
    @AuraEnabled
    global string installUrl { get; set; } //login.salesforce......
    @AuraEnabled
    global string tag { get; set; }
    @AuraEnabled
    global string buildDurationInSeconds { get; set; }
    @AuraEnabled
    global string releaseVersion { get; set; }
    @AuraEnabled
    global PackageCreator createdBy { get; set; }
    @AuraEnabled
    global Datetime createdDate { get; set; }
    @AuraEnabled
    global CodeCoverage codeCoverage { get; set; }
    @AuraEnabled
    global Boolean isSecurityReviewed { get; set; }
    @AuraEnabled
    global string language { get; set; }
    @AuraEnabled
    global string owner { get; set; }
    @AuraEnabled
    global Boolean hasMetadataRemoved { get; set; }
    @AuraEnabled
    global Boolean validatedAsync { get; set; }
  }

  global class PackageCreator {
    global string name { get; set; }
  }

  global class CodeCoverage {
    global String apexCodeCoveragePercentage { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for Package Subscriber Details. ObjectWrappers.PackageSubscriberWrapper
   **************************************************************************************/
  global class PackageSubscriberWrapper {
    @AuraEnabled
    global string id { get; set; }
    @AuraEnabled
    global String installedStatus { get; set; }
    @AuraEnabled
    global String instanceName { get; set; }
    @AuraEnabled
    global String metadataPackageId { get; set; }
    @AuraEnabled
    global String metadataPackageVersionId { get; set; }
    @AuraEnabled
    global String orgKey { get; set; }
    @AuraEnabled
    global String orgName { get; set; }
    @AuraEnabled
    global String orgStatus { get; set; }
    @AuraEnabled
    global String orgType { get; set; }
    @AuraEnabled
    global String parentOrg { get; set; }
    @AuraEnabled
    global String customUpgradeType { get; set; }
    @AuraEnabled
    global Boolean hasRestrictionEnabled { get; set; }
    @AuraEnabled
    global Boolean isCustomUpgradeAllowed { get; set; }
    @AuraEnabled
    global datetime SystemModstamp;
  }

  /**************************************************************************************
   * @Description  Wrapper Class for Filter Wrapper. ObjectWrappers.FilterWrapper
   **************************************************************************************/
  global class FilterWrapper {
    @AuraEnabled
    global string fieldName { get; set; }
    @AuraEnabled
    global string value { get; set; }
    @AuraEnabled
    global string dataType { get; set; }
  }

  public class PackagePushRequestWrapper {
    @AuraEnabled
    public string Id;
    @AuraEnabled
    public String PackageVersionId { get; set; }
    @AuraEnabled
    public Datetime ScheduledStartTime { get; set; }
    @AuraEnabled
    public Integer DurationSeconds { get; set; }
    @AuraEnabled
    public Datetime EndTime { get; set; }
    @AuraEnabled
    public Datetime StartTime { get; set; }
    @AuraEnabled
    public String Status { get; set; }
    @AuraEnabled
    public datetime SystemModstamp;
  }

  public class PackagePushJobWrapper {
    @AuraEnabled
    public String PackagePushRequestId { get; set; }
    @AuraEnabled
    public String SubscriberOrganizationKey { get; set; }
    @AuraEnabled
    public ObjectAttributes attributes { get; set; }
    @AuraEnabled
    public Integer DurationSeconds { get; set; }
    @AuraEnabled
    public Datetime EndTime { get; set; }
    @AuraEnabled
    public Datetime StartTime { get; set; }
    @AuraEnabled
    public String Status { get; set; }
    @AuraEnabled
    public datetime SystemModstamp;
    @AuraEnabled
    public PackagePushErrorsWrapper PackagePushErrors { get; set; }
  }

  public class PackagePushErrorsWrapper {
    @AuraEnabled
    public List<JobErrorsWrapper> records { get; set; }
  }

  public class JobErrorsWrapper {
    @AuraEnabled
    public String ErrorTitle { get; set; }
    @AuraEnabled
    public String ErrorMessage { get; set; }
    @AuraEnabled
    public String ErrorType { get; set; }
    @AuraEnabled
    public String ErrorDetails { get; set; }
    @AuraEnabled
    public String ErrorSeverity { get; set; }
  }

  public class ObjectAttributes {
    @AuraEnabled
    public String type { get; set; }
  }

  public class PackagePushResult {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public Boolean success;
  }

  public class MetadataPackageVersionWrapper {
    @AuraEnabled
    public string Id;
    @AuraEnabled
    public string Name;
    @AuraEnabled
    public Integer BuildNumber;
    @AuraEnabled
    public Boolean IsDeprecated;
    @AuraEnabled
    public Integer MajorVersion;
    @AuraEnabled
    public string MetadataPackageId;
    @AuraEnabled
    public Integer MinorVersion;
    @AuraEnabled
    public integer PatchVersion;
    @AuraEnabled
    public string ReleaseState;
    @AuraEnabled
    public datetime SystemModstamp;
  }

  public class LMAVersionWrapper {
    @AuraEnabled
    public Object createdDate;
    @AuraEnabled
    public Object id;
    @AuraEnabled
    public Object name;
    @AuraEnabled
    public Object isBeta;
    @AuraEnabled
    public Object lmaPackageId;
    @AuraEnabled
    public Object lmaPackageName;
    @AuraEnabled
    public Object releaseDate;
    @AuraEnabled
    public Object packageVersionId;
    @AuraEnabled
    public Object lmaVersionName;
  }

  public class LMALicenseWrapper {
    @AuraEnabled
    public Object id;
    @AuraEnabled
    public Object lastModifiedDate;
    @AuraEnabled
    public Object name;
    @AuraEnabled
    public Object accountId;
    @AuraEnabled
    public Object accountName;
    @AuraEnabled
    public Object contactId;
    @AuraEnabled
    public Object contactName;
    @AuraEnabled
    public Object installDate;
    @AuraEnabled
    public Object leadId;
    @AuraEnabled
    public Object leadName;
    @AuraEnabled
    public Object packageVersionNumber;
    @AuraEnabled
    public Object licensedSeats;
    @AuraEnabled
    public Object seats;
    @AuraEnabled
    public Object licenseStatus;
    @AuraEnabled
    public Object licenseType;
    @AuraEnabled
    public Object leadSource;
    @AuraEnabled
    public Object leadEmail;
    @AuraEnabled
    public Object lmaExpirationDate;
    @AuraEnabled
    public Object usedLicenses;
  }

  public class LMAPackageWrapper {
    @AuraEnabled
    public Object id;
    @AuraEnabled
    public Object packageSubsriberId;
  }

  /**************************************************************************************
   * @Description  Wrapper Class for a Namespace Registry record. ObjectWrappers.NamespaceRegistryWrapper
   **************************************************************************************/
  public class NamespaceRegistryWrapper {
    @AuraEnabled
    public Object id;
    @AuraEnabled
    public Object name;
    @AuraEnabled
    public Object namespacePrefix;
  }

  public class LMALicenseHistoryWrapper {
    @AuraEnabled
    public Object Id;
    @AuraEnabled
    public Object Field;
    @AuraEnabled
    public Object NewValue;
    @AuraEnabled
    public Object OldValue;
    @AuraEnabled
    public Object CreatedDate;
  }

  /**************************************************************************************
   * @Description  Wrapper Class for 1GPPackage Details. ObjectWrappers.PackageWrapper
   **************************************************************************************/
  public class PackageWrapper1 {
    @AuraEnabled
    public String id { get; set; }
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String namespacePrefix { get; set; }
    @AuraEnabled
    public String packageCategory { get; set; }
    @AuraEnabled
    public datetime systemModstamp { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for 1GP Package Version Details. ObjectWrappers.PackageVersionWrapper
   **************************************************************************************/

  public class Package1VersionWrapper {
    @AuraEnabled
    public String id { get; set; }
    @AuraEnabled
    public String metadataPackageId { get; set; }
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public Boolean isDeprecated { get; set; }
    @AuraEnabled
    public Integer majorVersion { get; set; }
    @AuraEnabled
    public Integer minorVersion { get; set; }
    @AuraEnabled
    public Integer buildNumber { get; set; }
    @AuraEnabled
    public Integer patchVersion { get; set; }
    @AuraEnabled
    public String releaseState { get; set; }
    @AuraEnabled
    public string versionNumber { get; set; }
    @AuraEnabled
    public datetime systemModstamp { get; set; }
  }

  public class SignupRequestWrapper {
    @AuraEnabled
    public String company { get; set; }
    @AuraEnabled
    public String country { get; set; }
    @AuraEnabled
    public String createdOrgId { get; set; }
    @AuraEnabled
    public String createdOrgInstance { get; set; }
    @AuraEnabled
    public String errorCode { get; set; }
    @AuraEnabled
    public String firstName { get; set; }
    @AuraEnabled
    public String lastName { get; set; }
    @AuraEnabled
    public String preferredLanguage { get; set; }
    @AuraEnabled
    public String resolvedTemplateId { get; set; }
    @AuraEnabled
    public Boolean shouldConnectToEnvHub { get; set; }
    @AuraEnabled
    public String signupEmail { get; set; }
    @AuraEnabled
    public String signupSource { get; set; }
    @AuraEnabled
    public String status { get; set; }
    @AuraEnabled
    public String subdomain { get; set; }
    @AuraEnabled
    public Boolean isSignupEmailSuppressed { get; set; }
    @AuraEnabled
    public String templateId { get; set; }
    @AuraEnabled
    public Integer trialDays { get; set; }
    @AuraEnabled
    public String trialSourceOrgId { get; set; }
    @AuraEnabled
    public String username { get; set; }
    @AuraEnabled
    public String edition { get; set; }
    @AuraEnabled
    public datetime systemModstamp;
    @AuraEnabled
    public datetime createdDate;
    @AuraEnabled
    public string owner { get; set; }
    @AuraEnabled
    public PackageCreator createdBy { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for Package Dependencies. ObjectWrappers.PackageDependencyWrapper
   **************************************************************************************/
  public class PackageDependencyWrapper {
    @AuraEnabled
    public String subscriberPackageVersionId { get; set; }
    @AuraEnabled
    public String packageName { get; set; }
    @AuraEnabled
    public String versionNumber { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for Package Dependencies Response. ObjectWrappers.PackageDependenciesResponse
   **************************************************************************************/
  public class PackageDependenciesResponse {
    @AuraEnabled
    public List<PackageDependencyWrapper> dependencies { get; set; }
  }

  public class InstalledPackageWrapper {
    @AuraEnabled
    public String subscriberPackageId { get; set; }
    @AuraEnabled
    public String subscriberPackageVersionId { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for an MCP Server (ExternalServiceRegistration with
   * RegistrationProviderType = 'ModelContextProtocol'). ObjectWrappers.McpServerWrapper
   **************************************************************************************/
  public class McpServerWrapper {
    @AuraEnabled
    public String id { get; set; }
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public String serverName { get; set; }
    @AuraEnabled
    public String serverVersion { get; set; }
    @AuraEnabled
    public String protocolVersion { get; set; }
    @AuraEnabled
    public String description { get; set; }
    @AuraEnabled
    public String namedCredential { get; set; }
    @AuraEnabled
    public String status { get; set; }
    @AuraEnabled
    public Boolean isActive { get; set; }
    @AuraEnabled
    public Integer toolCount { get; set; }
    @AuraEnabled
    public String setupUrl { get; set; }
    @AuraEnabled
    public Boolean schemaParseFailed { get; set; }
    // True when at least one accepted tool (GenAiFunction) was matched to this server.
    @AuraEnabled
    public Boolean hasTools { get; set; }
    @AuraEnabled
    public List<McpToolWrapper> tools { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for a single MCP tool exposed by a server. A tool is an
   * accepted GenAiFunction (InvocationTargetType = 'mcpTool'), enriched with the
   * input/output field shapes parsed from the server's Schema. ObjectWrappers.McpToolWrapper
   **************************************************************************************/
  public class McpToolWrapper {
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String description { get; set; }
    // GenAiFunction Id — used to build the Agentforce Assets deep-link URL.
    @AuraEnabled
    public String genAiFunctionId { get; set; }
    // GenAiFunction DeveloperName — used as the AgentScript action key and source.
    @AuraEnabled
    public String developerName { get; set; }
    // GenAiFunction MasterLabel — used verbatim as the AgentScript action label.
    @AuraEnabled
    public String masterLabel { get; set; }
    // ESR operation name (e.g. mcptoolx5fx5faskx5fquestion) — the AgentScript target tail.
    @AuraEnabled
    public String operationName { get; set; }
    // True when this tool maps to a GenAiFunction (always true under GenAiFunction-driven discovery).
    @AuraEnabled
    public Boolean isWired { get; set; }
    @AuraEnabled
    public List<McpIoFieldWrapper> inputs { get; set; }
    @AuraEnabled
    public List<McpIoFieldWrapper> outputs { get; set; }
  }

  /**************************************************************************************
   * @Description  Wrapper Class for a single MCP tool input/output field.
   * ObjectWrappers.McpIoFieldWrapper
   **************************************************************************************/
  public class McpIoFieldWrapper {
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String type { get; set; }
    @AuraEnabled
    public Boolean isRequired { get; set; }
  }
}
