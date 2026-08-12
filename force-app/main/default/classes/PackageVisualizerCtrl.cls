/*******************************************************************************************
 * @Name         PackageVisualizerCtrl
 * @Date         11/10/2020
 * @Description  Controller Class for 2GP Visualizer Package. All LWC components use this ctrl class.
 *******************************************************************************************/

public with sharing class PackageVisualizerCtrl {
  /**************************************************************************************
   * @Description  Empty constructor
   **************************************************************************************/
  /*
    public PackageVisualizerCtrl(){
        
    }
	*/

  /**************************************************************************************
   * @Description  Get list of all 2GP packages available in this DevHub org.
   **************************************************************************************/
  @AuraEnabled(continuation=true)
  public static list<ObjectWrappers.PackageWrapper> get2GPPackageList(
    String sortDirection
  ) {
    list<ObjectWrappers.PackageWrapper> packageList = Package2Interface.getPackage2(
      sortDirection
    );
    return packageList;
  }

  /**************************************************************************************
   * @Description  Get the list of MCP servers (ExternalServiceRegistration rows with
   * RegistrationProviderType = 'ModelContextProtocol') registered in this org.
   **************************************************************************************/
  @AuraEnabled(continuation=true)
  public static List<ObjectWrappers.McpServerWrapper> getMcpServers() {
    return Package2Interface.getMcpServers();
  }

  @AuraEnabled(continuation=true)
  public static list<ObjectWrappers.PackageWrapper1> get1GPPackageList(
    String sortDirection
  ) {
    List<ObjectWrappers.PackageWrapper1> packageList = Package2Interface.getPackage1(
      sortDirection
    );
    return packageList;
  }

  /**************************************************************************************
	* @Description  Get list of all 2GP packages version available in this DevHub org for the package.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/
  @AuraEnabled(continuation=true)
  public static List<ObjectWrappers.PackageVersionWrapper> get2GPPackageVersionList(
    list<ObjectWrappers.FilterWrapper> filterWrapper,
    String minMajorVersion,
    String maxMajorVersion,
    String minMinorVersion,
    String maxMinorVersion,
    String sortedBy,
    String sortDirection,
    String versionLimit,
    String versionOffset
  ) {
    List<ObjectWrappers.PackageVersionWrapper> packageVersionList = Package2Interface.getPackage2Versions(
      filterWrapper,
      minMajorVersion,
      maxMajorVersion,
      minMinorVersion,
      maxMinorVersion,
      sortedBy,
      sortDirection,
      versionLimit,
      versionOffset
    );
    return packageVersionList;
  }

  /**************************************************************************************
   * @Description  Get the list of Package2VersionCreateRequest records (async build
   * jobs) for a package. Scoped/filtered via the FilterWrapper list (Package2Id, Status).
   **************************************************************************************/
  @AuraEnabled(continuation=true)
  public static List<ObjectWrappers.Package2VersionCreateRequestWrapper> getPackage2VersionCreateRequestList(
    list<ObjectWrappers.FilterWrapper> filterWrapper,
    String sortedBy,
    String sortDirection,
    String requestLimit,
    String requestOffset
  ) {
    List<ObjectWrappers.Package2VersionCreateRequestWrapper> createRequestList = Package2Interface.getPackage2VersionCreateRequests(
      filterWrapper,
      sortedBy,
      sortDirection,
      requestLimit,
      requestOffset
    );
    return createRequestList;
  }

  /**************************************************************************************
   * @Description  Get the Package2VersionCreateRequestError rows for a failed create
   * request. Invoked from the detail view when a request's Status is 'Error'.
   **************************************************************************************/
  @AuraEnabled(continuation=true)
  public static List<ObjectWrappers.Package2VersionCreateRequestErrorWrapper> getPackage2VersionCreateRequestErrorList(
    String requestId
  ) {
    List<ObjectWrappers.Package2VersionCreateRequestErrorWrapper> errorList = Package2Interface.getPackage2VersionCreateRequestErrors(
      requestId
    );
    return errorList;
  }

  @AuraEnabled(cacheable=true)
  public static List<String> getLatestPackageVersions(
    String packageId,
    String versionLimit
  ) {
    List<String> packageVersionList = Package2Interface.getLatestPackageVersionsList(
      packageId,
      versionLimit
    );
    return packageVersionList;
  }

  /**************************************************************************************
	* @Description  Get list of all SignUp Requests available in this DevHub org 
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/
  @AuraEnabled(continuation=true)
  public static List<ObjectWrappers.SignupRequestWrapper> getSignUpRequests(
    list<ObjectWrappers.FilterWrapper> filterWrapper,
    String sortedBy,
    String sortDirection,
    String signUpLimit,
    String signUpOffset
  ) {
    List<ObjectWrappers.SignupRequestWrapper> signUpList = Package2Interface.getSignUpRequests(
      filterWrapper,
      sortedBy,
      sortDirection,
      signUpLimit,
      signUpOffset
    );
    return signUpList;
  }

  /**************************************************************************************
	* @Description  Get list of all 1GP packages version available in the Org.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static List<ObjectWrappers.Package1VersionWrapper> get1GPPackageVersionList(
    list<ObjectWrappers.FilterWrapper> filterWrapper,
    String minMajorVersion,
    String maxMajorVersion,
    String minMinorVersion,
    String maxMinorVersion,
    String sortedBy,
    String sortDirection,
    String versionLimit,
    String versionOffset
  ) {
    List<ObjectWrappers.Package1VersionWrapper> packageVersionList = Package2Interface.getPackage1Versions(
      filterWrapper,
      minMajorVersion,
      maxMajorVersion,
      minMinorVersion,
      maxMinorVersion,
      sortedBy,
      sortDirection,
      versionLimit,
      versionOffset
    );
    return packageVersionList;
  }

  /**************************************************************************************
	* @Description  Get list of all 2GP Packages Subscriber org details for the given package or package version.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static List<ObjectWrappers.PackageSubscriberWrapper> get2GPPackageVersionSubscriberList(
    list<ObjectWrappers.FilterWrapper> filterWrapper,
    String sortedBy,
    String sortDirection,
    String subscriberLimit,
    String subscriberOffset
  ) {
    List<ObjectWrappers.PackageSubscriberWrapper> packageSubList = Package2Interface.get2GPPackageSubscriberList(
      filterWrapper,
      sortedBy,
      sortDirection,
      subscriberLimit,
      subscriberOffset
    );
    return packageSubList;
  }

  /**************************************************************************************
   * @Description  PackageSubscriber orgs with ParentOrg equal to the given production org key (e.g. sandboxes).
   **************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static List<ObjectWrappers.PackageSubscriberWrapper> getPackageSubscribersByParentOrg(
    String parentOrgKey,
    String subscriberLimit,
    String subscriberOffset
  ) {
    return Package2Interface.getPackageSubscribersByParentOrg(
      parentOrgKey,
      subscriberLimit,
      subscriberOffset
    );
  }

  @AuraEnabled(cacheable=true)
  public static ObjectWrappers.PackageSubscriberWrapper getPackageSubscriberByOrgKey(
    String orgKey
  ) {
    return Package2Interface.getPackageSubscriberByOrgKey(orgKey);
  }

  /**************************************************************************************
	* @Description  Get list of all 2GP Packages Subscriber org details group by varios fields
					for the given package or package version.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static List<AggregateResult> getSubscriberChartData(
    List<ObjectWrappers.FilterWrapper> filterWrapper,
    String groupByField
  ) {
    List<AggregateResult> subChartData = Package2Interface.getSubscriberChartData(
      filterWrapper,
      groupByField
    );
    return subChartData;
  }

  @AuraEnabled(cacheable=true)
  public static List<AggregateResult> getLmaChartData(
    List<ObjectWrappers.FilterWrapper> filterWrapper,
    String groupByField
  ) {
    List<AggregateResult> lmaChartData = Package2Interface.getLmaChartData(
      filterWrapper,
      groupByField
    );
    return lmaChartData;
  }

  @AuraEnabled(cacheable=true)
  public static List<AggregateResult> getPackagePushJobChartData(
    List<ObjectWrappers.FilterWrapper> filterWrapper,
    String groupByField
  ) {
    List<AggregateResult> packagePushJobChartChartData = Package2Interface.getPackagePushJobChartData(
      filterWrapper,
      groupByField
    );
    return packagePushJobChartChartData;
  }

  /**************************************************************************************
   * @Description  Return true if the DevHub also have LMA package installed.
   **************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static boolean isLMA() {
    return (Type.forName('sfLma__License__c') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isFmaParameter() {
    return (Type.forName('sfFma__FeatureParameter__c') != null);
  }

  /*
    @AuraEnabled(cacheable=true)
    public static List<CampaignMember> getCampaignHistory(String leadOrContactId){
        List<CampaignMember> campaignMembers = [ SELECT Campaign.Name, City, CampaignId, Campaign.StartDate, Campaign.EndDate, Status, CreatedDate, Campaign.Type FROM CampaignMember WHERE LeadOrContactId = :leadOrContactId ORDER BY CreatedDate DESC LIMIT 5];
        return campaignMembers;
    }
    */

  @AuraEnabled(cacheable=true)
  public static List<Package_Visualizer_Resource__mdt> getResourcesMetadata() {
    List<Package_Visualizer_Resource__mdt> resources = [
      SELECT Label, Icon__c, Link__c, Description__c
      FROM Package_Visualizer_Resource__mdt
      WHERE Visibility__c = TRUE
      ORDER BY Label
      LIMIT 50
    ];
    return resources;
  }

  @AuraEnabled(cacheable=true)
  public static List<Package_Visualizer_Announcement__mdt> getAnnouncementsMetadata() {
    List<Package_Visualizer_Announcement__mdt> announcements = [
      SELECT Label, Icon__c, Order__c, Link__c, Description__c
      FROM Package_Visualizer_Announcement__mdt
      WHERE Visibility__c = TRUE
      ORDER BY Order__c ASC
      LIMIT 50
    ];
    return announcements;
  }

  @AuraEnabled(cacheable=true)
  public static List<About_Welcome_Mat_Step__mdt> getWelcomeMatAboutSteps() {
    List<About_Welcome_Mat_Step__mdt> steps = [
      SELECT Label, Icon__c, Order__c, Description__c, Link__c
      FROM About_Welcome_Mat_Step__mdt
      WHERE Visibility__c = TRUE
      ORDER BY Order__c ASC
      LIMIT 50
    ];
    return steps;
  }

  @AuraEnabled(cacheable=true)
  public static String calculatePackageVersionCodeCoverage(
    String subscriberPackageVersionId
  ) {
    String codeCoverage = Package2Interface.getPackageVersionCodeCoverage(
      subscriberPackageVersionId
    );
    return codeCoverage;
  }

  @AuraEnabled(cacheable=true)
  public static Boolean verifySecurityReviewApproved(
    String subscriberPackageVersionId
  ) {
    Boolean isSecurityReviewed = Package2Interface.getIsSecurityReviewed(
      subscriberPackageVersionId
    );
    return isSecurityReviewed;
  }

  @AuraEnabled(cacheable=true)
  public static Boolean verifyUnlockedPackageInstalled() {
    Boolean isUnlockedPackageInstalled = Package2Interface.verifyUnlockedPackageInstalled();
    return isUnlockedPackageInstalled;
  }

  @AuraEnabled(cacheable=true)
  public static List<ObjectWrappers.InstalledPackageWrapper> getInstalledPackages(
    List<String> subscriberPackageIds
  ) {
    return Package2Interface.getInstalledPackages(subscriberPackageIds);
  }

  @AuraEnabled(cacheable=true)
  public static String getEnvHubMemberId(String orgId) {
    Boolean isEnvHubMemberAvailable = Package2Interface.isEnvironmentHubMember();
    if (isEnvHubMemberAvailable == true) {
      String envHubId = Package2Interface.getEnvHubMemberId(orgId);
      return envHubId;
    } else {
      throw new AuraHandledException(
        'We could not find the associated Environment Hub Member in your org...'
      );
    }
  }

  @AuraEnabled(continuation=true)
  public static List<AppAnalyticsQueryRequest> getAppAnalyticsRequests(
    String packageIds
  ) {
    if (!String.isBlank(packageIds)) {
      packageIds = packageIds.substring(0, 15);
      List<AppAnalyticsQueryRequest> appAnalyticsRequests = [
        SELECT
          Id,
          DataType,
          DownloadExpirationTime,
          DownloadSize,
          DownloadUrl,
          EndTime,
          ErrorMessage,
          QuerySubmittedTime,
          Name,
          RequestState,
          StartTime,
          OrganizationIds,
          PackageIds,
          FileType,
          FileCompression
        FROM AppAnalyticsQueryRequest
        WHERE CreatedDate >= LAST_N_DAYS:1 AND PackageIds = :packageIds
        ORDER BY CreatedDate DESC
        LIMIT 50
      ];
      return appAnalyticsRequests;
    } else {
      List<AppAnalyticsQueryRequest> appAnalyticsRequests = [
        SELECT
          Id,
          DataType,
          DownloadExpirationTime,
          DownloadSize,
          DownloadUrl,
          EndTime,
          ErrorMessage,
          QuerySubmittedTime,
          Name,
          RequestState,
          StartTime,
          OrganizationIds,
          PackageIds,
          FileType,
          FileCompression
        FROM AppAnalyticsQueryRequest
        WHERE CreatedDate >= LAST_N_DAYS:1
        ORDER BY CreatedDate DESC
        LIMIT 50
      ];
      return appAnalyticsRequests;
    }
  }

  @AuraEnabled(continuation=true)
  public static String insertAppAnalyticsRequest(
    String dataType,
    DateTime endTime,
    DateTime startTime,
    String packageId,
    String organizationIds,
    String fileType,
    String fileCompression
  ) {
    AppAnalyticsQueryRequest req = new AppAnalyticsQueryRequest();
    req.DataType = dataType;
    req.EndTime = endTime;
    req.StartTime = startTime;
    req.PackageIds = packageId.substring(0, 15);
    req.OrganizationIds = organizationIds;
    if (fileType != 'none') {
      req.FileType = fileType;
      req.FileCompression = fileCompression;
    }
    if (Test.isRunningTest()) {
      return 'TEST';
    } else {
      insert req;
      return req.id;
    }
  }

  @AuraEnabled(cacheable=true)
  public static ObjectWrappers.LMAVersionWrapper getLMAVersion(
    String subscriberPackageVersionId
  ) {
    try {
      String queryString = ' SELECT CreatedDate, Id, Name, sfLma__Is_Beta__c, sfLma__Package__c, sfLma__Package__r.Name, sfLma__Release_Date__c, sfLma__Version_ID__c, sfLma__Version__c FROM sfLma__Package_Version__c WHERE sfLma__Version_ID__c = :subscriberPackageVersionId LIMIT 1 ';
      if (Type.forName('sfLma__Package_Version__c') != null) {
        sObject result = Database.query(queryString);
        ObjectWrappers.LMAVersionWrapper lmaVersion = new ObjectWrappers.LMAVersionWrapper();
        lmaVersion.createdDate = result.get('CreatedDate');
        lmaVersion.id = result.get('Id');
        lmaVersion.name = result.get('Name');
        lmaVersion.isBeta = result.get('sfLma__Is_Beta__c');
        lmaVersion.lmaPackageId = result.get('sfLma__Package__c');
        lmaVersion.lmaPackageName = result.getSObject('sfLma__Package__r')
          .get('Name');
        lmaVersion.releaseDate = result.get('sfLma__Release_Date__c');
        lmaVersion.packageVersionId = result.get('sfLma__Version_ID__c');
        lmaVersion.lmaVersionName = result.get('sfLma__Version__c');
        return lmaVersion;
      }
      return null;
    } catch (Exception e) {
      AuraHandledException error = new AuraHandledException(
        'Could not find a LMA record associated with this version'
      );
      error.setMessage(
        'Could not find a LMA record associated with this version'
      );
      throw error;
    }
  }

  @AuraEnabled(cacheable=true)
  public static ObjectWrappers.LMAPackageWrapper getLmaPackage(
    String subscriberPackageId
  ) {
    try {
      String queryString = ' SELECT Id, sfLma__Package_ID__c FROM sfLma__Package__c WHERE sfLma__Package_ID__c = :subscriberPackageId LIMIT 1 ';
      if (Type.forName('sfLma__Package__c') != null) {
        sObject result = Database.query(queryString);
        ObjectWrappers.LMAPackageWrapper lmaPackage = new ObjectWrappers.LMAPackageWrapper();
        lmaPackage.id = result.get('Id');
        return lmaPackage;
      }
      return null;
    } catch (Exception e) {
      AuraHandledException error = new AuraHandledException(
        'Could not find a LMA record associated with this version'
      );
      error.setMessage(
        'Could not find a LMA record associated with this version'
      );
      throw error;
    }
  }

  /**************************************************************************************
   * @Description  Get the Namespace Registry record matching the given namespace prefix.
   * @param namespacePrefix The namespace prefix to look up in the Namespace Registry.
   * @return ObjectWrappers.NamespaceRegistryWrapper with the record Id, Name and
   *         NamespacePrefix, or null when the NamespaceRegistry object is unavailable.
   **************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static ObjectWrappers.NamespaceRegistryWrapper getNamespaceRegistry(
    String namespacePrefix
  ) {
    try {
      String queryString = ' SELECT Id, Name, NamespacePrefix FROM NamespaceRegistry WHERE NamespacePrefix = :namespacePrefix WITH USER_MODE LIMIT 1 ';
      if (Type.forName('NamespaceRegistry') != null) {
        sObject result = Database.query(queryString);
        ObjectWrappers.NamespaceRegistryWrapper namespaceRegistry = new ObjectWrappers.NamespaceRegistryWrapper();
        namespaceRegistry.id = result.get('Id');
        namespaceRegistry.name = result.get('Name');
        namespaceRegistry.namespacePrefix = result.get('NamespacePrefix');
        return namespaceRegistry;
      }
      return null;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Could not find a Namespace Registry record associated with this namespace'
      );
    }
  }

  @AuraEnabled(continuation=true)
  public static List<ObjectWrappers.LMALicenseWrapper> getPackageVersionLicenses(
    List<ObjectWrappers.FilterWrapper> filterWrapper,
    String sortedBy,
    String sortDirection,
    String lmaLicensesLimit,
    String lmaLicensesOffset
  ) {
    try {
      String queryString = ' SELECT Id, LastModifiedDate, Name, sfLma__Account__c, sfLma__Account__r.Name, sfLma__Contact__c ,sfLma__Contact__r.Name, sfLma__Install_Date__c, sfLma__Lead__c ,sfLma__Lead__r.Name, sfLma__Lead__r.LeadSource, sfLma__Lead__r.Email, sfLma__Licensed_Seats__c, sfLma__Seats__c ,sfLma__License_Status__c, sfLma__License_Type__c, sfLma__Expiration__c, sfLma__Used_Licenses__c FROM sfLma__License__c ';
      String whereClause = '';
      if (!filterWrapper.isEmpty()) {
        whereClause = Package2Interface.getWhereClause(filterWrapper);
        if (!String.isBlank(whereClause)) {
          queryString = queryString + ' WHERE ' + whereClause;
        }
      }
      queryString =
        queryString +
        'ORDER BY ' +
        String.escapeSingleQuotes(sortedBy) +
        ' ' +
        String.escapeSingleQuotes(sortDirection);
      queryString =
        queryString +
        ' LIMIT ' +
        String.escapeSingleQuotes(lmaLicensesLimit) +
        ' OFFSET ' +
        String.escapeSingleQuotes(lmaLicensesOffset);
      if (Type.forName('sfLma__Package_Version__c') != null) {
        SObjectAccessDecision decision = Security.stripInaccessible(
          AccessType.READABLE,
          Database.query(queryString)
        );
        List<ObjectWrappers.LMALicenseWrapper> licensesList = new List<ObjectWrappers.LMALicenseWrapper>();
        for (sObject o : decision.getRecords()) {
          ObjectWrappers.LMALicenseWrapper license = new ObjectWrappers.LMALicenseWrapper();
          license.id =
            URL.getOrgDomainUrl().toExternalForm() +
            '/' +
            o.get('Id');
          license.lastModifiedDate = o.get('LastModifiedDate');
          license.name = o.get('Name');
          if (o.get('sfLma__Account__c') != null) {
            license.accountId =
              URL.getOrgDomainUrl().toExternalForm() +
              '/' +
              o.get('sfLma__Account__c');
            license.accountName = o.getSObject('sfLma__Account__r').get('Name');
          }
          if (o.get('sfLma__Contact__c') != null) {
            license.contactId =
              URL.getOrgDomainUrl().toExternalForm() +
              '/' +
              o.get('sfLma__Contact__c');
            license.contactName = o.getSObject('sfLma__Contact__r').get('Name');
          }
          license.installDate = o.get('sfLma__Install_Date__c');
          if (o.get('sfLma__Lead__c') != null) {
            license.leadId =
              URL.getOrgDomainUrl().toExternalForm() +
              '/' +
              o.get('sfLma__Lead__c');
            license.leadName = o.getSObject('sfLma__Lead__r').get('Name');
            license.leadSource = o.getSObject('sfLma__Lead__r')
              .get('LeadSource');
            if (o.getSObject('sfLma__Lead__r').get('Email') != null) {
              license.leadEmail = o.getSObject('sfLma__Lead__r').get('Email');
            }
          }
          if (o.get('sfLma__Expiration__c') != null) {
            license.lmaExpirationDate = o.get('sfLma__Expiration__c');
          }
          if (o.get('sfLma__Seats__c') != null) {
            license.seats = o.get('sfLma__Seats__c');
          }
          if (o.get('sfLma__Used_Licenses__c') != null) {
            license.usedLicenses = o.get('sfLma__Used_Licenses__c');
          }
          license.licensedSeats = o.get('sfLma__Licensed_Seats__c');
          license.licenseStatus = o.get('sfLma__License_Status__c');
          license.licenseType = o.get('sfLma__License_Type__c');
          licensesList.add(license);
        }
        return licensesList;
      }
      return null;
    } catch (Exception e) {
      throw new AuraHandledException(
        'We could not retrieve package version\'s licenses'
      );
    }
  }

  @AuraEnabled(continuation=true)
  public static List<ObjectWrappers.LMALicenseHistoryWrapper> getLmaTimeline(
    String licenseId
  ) {
    String[] dataTypeList = new List<String>{
      'Text',
      'DynamicEnum',
      'DateOnly',
      'Double'
    };
    String[] fieldList = new List<String>{
      'Created',
      'sfLma__Package_Version__c',
      'sfLma__Status__c',
      'sfLma__Expiration__c',
      'sfLma__Seats__c'
    };
    String historyQuery = 'SELECT Id, Field, NewValue, OldValue, CreatedDate FROM sfLma__License__History WHERE ParentId = :licenseId and DataType IN :dataTypeList AND Field IN :fieldList ORDER BY CreatedDate DESC LIMIT 50 OFFSET 0';
    List<ObjectWrappers.LMALicenseHistoryWrapper> historyList = new List<ObjectWrappers.LMALicenseHistoryWrapper>();
    if (Type.forName('sfLma__License__History') != null) {
      List<sObject> history = Database.query(historyQuery);
      for (sObject o : history) {
        ObjectWrappers.LMALicenseHistoryWrapper item = new ObjectWrappers.LMALicenseHistoryWrapper();
        item.Id = o.get('Id');
        item.Field = o.get('Field');
        item.NewValue = o.get('NewValue');
        item.OldValue = o.get('OldValue');
        item.CreatedDate = o.get('CreatedDate');
        historyList.add(item);
      }
      return historyList;
    }
    return null;
  }

  @AuraEnabled(continuation=true)
  public static String modifyLicense(
    String licenseId,
    String expirationDate,
    String seats,
    String status
  ) {
    String updateLicense = Package2Interface.updateLicense(
      licenseId,
      expirationDate,
      seats,
      status
    );
    return updateLicense;
  }

  @AuraEnabled(continuation=true)
  public static String setPackage2Fields(
    List<ObjectWrappers.FilterWrapper> filterWrapper,
    String objectName,
    String objectId
  ) {
    String updateFields = Package2Interface.updatePackage2Fields(
      filterWrapper,
      objectName,
      objectId
    );
    return updateFields;
  }

  @AuraEnabled(cacheable=true)
  public static In_App_Prompt__mdt getPrompt(String prompt) {
    return [
      SELECT
        Title__c,
        Prompt_Popover_Location__c,
        Learn_More_Link__c,
        Description__c,
        Brand_Button_URL__c,
        Brand_Button_Label__c
      FROM In_App_Prompt__mdt
      WHERE DeveloperName = :prompt
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];
  }

  @AuraEnabled(cacheable=true)
  public static Organization getOrgDetails() {
    return [
      SELECT
        Name,
        IsSandbox,
        InstanceName,
        OrganizationType,
        TrialExpirationDate,
        PrimaryContact
      FROM Organization
      WITH SECURITY_ENFORCED
      LIMIT 1
    ];
  }

  @AuraEnabled(continuation=true)
  public static String createSignupTrial(
    String firstName,
    String lastName,
    String email,
    String userName,
    String company,
    String myDomain,
    String country,
    String preferredLanguage,
    String templateId,
    String edition,
    Integer trialDays,
    Boolean isSignupEmailSuppressed,
    Boolean shouldConnectToEnvHub
  ) {
    if (isSignupRequest() == true) {
      return insertSignup(
        firstName,
        lastName,
        email,
        userName,
        company,
        myDomain,
        country,
        preferredLanguage,
        templateId,
        edition,
        trialDays,
        isSignupEmailSuppressed,
        shouldConnectToEnvHub
      );
    } else {
      throw new AuraHandledException(
        'Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)'
      );
    }
  }

  @AuraEnabled(cacheable=true)
  public static List<In_App_Guidance_Walkthrough__mdt> getWalkthroughSteps() {
    List<In_App_Guidance_Walkthrough__mdt> steps = [
      SELECT Title__c, Order__c, Description__c, Link__c
      FROM In_App_Guidance_Walkthrough__mdt
      WHERE Visible__c = TRUE
      ORDER BY Order__c ASC
      LIMIT 5
    ];
    return steps;
  }

  private static string insertSignup(
    String firstName,
    String lastName,
    String email,
    String userName,
    String company,
    String myDomain,
    String country,
    String preferredLanguage,
    String templateId,
    String edition,
    Integer trialDays,
    Boolean isSignupEmailSuppressed,
    Boolean shouldConnectToEnvHub
  ) {
    SObjectType sObjectType = Schema.getGlobalDescribe().get('SignupRequest');
    Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
    Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();

    Boolean objectCrudCheck = sObjectType.getDescribe().isCreateable();
    SObject signupRequest = sObjectType.newSObject();

    if (objectCrudCheck == true) {
      if (fieldsMap.get('FirstName').getDescribe().isCreateable()) {
        signupRequest.put('FirstName', String.escapeSingleQuotes(firstName));
      }
      if (fieldsMap.get('LastName').getDescribe().isCreateable()) {
        signupRequest.put('LastName', String.escapeSingleQuotes(lastName));
      }
      if (fieldsMap.get('SignupEmail').getDescribe().isCreateable()) {
        signupRequest.put('SignupEmail', String.escapeSingleQuotes(email));
      }
      if (fieldsMap.get('Username').getDescribe().isCreateable()) {
        signupRequest.put('Username', String.escapeSingleQuotes(userName));
      }
      if (fieldsMap.get('Company').getDescribe().isCreateable()) {
        signupRequest.put('Company', String.escapeSingleQuotes(company));
      }
      if (
        fieldsMap.get('Subdomain').getDescribe().isCreateable() &&
        myDomain != null
      ) {
        signupRequest.put('Subdomain', String.escapeSingleQuotes(myDomain));
      }
      if (
        fieldsMap.get('Country').getDescribe().isCreateable() && country != null
      ) {
        signupRequest.put('Country', String.escapeSingleQuotes(country));
      }
      if (
        fieldsMap.get('PreferredLanguage').getDescribe().isCreateable() &&
        preferredLanguage != null
      ) {
        signupRequest.put(
          'PreferredLanguage',
          String.escapeSingleQuotes(preferredLanguage)
        );
      }
      if (fieldsMap.get('TemplateId').getDescribe().isCreateable()) {
        if (String.isNotBlank(templateId)) {
          signupRequest.put(
            'TemplateId',
            String.escapeSingleQuotes(templateId)
          );
        }
      }
      if (fieldsMap.get('Edition').getDescribe().isCreateable()) {
        if (String.isNotBlank(edition)) {
          signupRequest.put('Edition', String.escapeSingleQuotes(edition));
        }
      }
      if (
        fieldsMap.get('TrialDays').getDescribe().isCreateable() &&
        trialDays != null
      ) {
        signupRequest.put('TrialDays', Integer.valueOf(trialDays));
      }
      if (
        fieldsMap.get('IsSignupEmailSuppressed').getDescribe().isCreateable()
      ) {
        signupRequest.put(
          'IsSignupEmailSuppressed',
          Boolean.valueOf(isSignupEmailSuppressed)
        );
      }
      if (fieldsMap.get('ShouldConnectToEnvHub').getDescribe().isCreateable()) {
        signupRequest.put(
          'ShouldConnectToEnvHub',
          Boolean.valueOf(shouldConnectToEnvHub)
        );
      }
      insert signupRequest;
      return String.valueOf(signupRequest);
    } else {
      return 'Error';
    }
  }

  @AuraEnabled(cacheable=true)
  public static List<AggregateResult> getSignupCount(String days) {
    try {
      String queryString = '';
      if (days == '1') {
        queryString = 'SELECT count(ID) FROM SignupRequest WHERE CreatedDate = TODAY WITH USER_MODE';
      } else {
        queryString =
          'SELECT count(ID) FROM SignupRequest WHERE CreatedDate = LAST_N_DAYS:' +
          String.escapeSingleQuotes(days) +
          ' WITH USER_MODE';
      }
      List<AggregateResult> signupCount = new List<AggregateResult>();
      signupCount = Database.query(queryString);
      return signupCount;
    } catch (Exception e) {
      throw new AuraHandledException(
        'We were unable to retrieve any data from the SignupRequest API...'
      );
    }
  }

  @AuraEnabled(cacheable=true)
  public static boolean isSignupRequest() {
    return (Type.forName('SignupRequest') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean checkPackageSubscriberEnabled() {
    return System.FeatureManagement.checkPackageBooleanValue(
      'pkgviz__PackageSubscriber'
    );
  }

  @AuraEnabled(cacheable=true)
  public static User getUser(String packageErrorUsername) {
    return [
      SELECT Id, Username
      FROM USER
      WHERE Username = :packageErrorUsername
      WITH USER_MODE
    ];
  }

  @AuraEnabled(cacheable=true)
  public static User getUserName(String packageUserId) {
    return [
      SELECT Id, Username
      FROM USER
      WHERE Id = :packageUserId
      WITH USER_MODE
    ];
  }

  @AuraEnabled(cacheable=true)
  public static String getOrgCountryCode() {
    Organization org = [SELECT Country FROM Organization LIMIT 1];
    return org.Country;
  }

  @AuraEnabled(cacheable=true)
  public static boolean isPboOrg() {
    return (isLMA() && Package2Interface.isEnvironmentHubMember());
  }

  @AuraEnabled(cacheable=true)
  public static String getProfileId(String label) {
    try {
      String queryString = 'SELECT Id FROM Profile WHERE Name = :label LIMIT 1';
      sObject s = Database.query(queryString);
      return s.Id;
    } catch (Exception e) {
      throw new AuraHandledException('Unable to get Profile Id');
    }
  }

  @AuraEnabled(cacheable=true)
  public static String getNamespacePermSetId(String label, String namespace) {
    try {
      String queryString = 'SELECT Id FROM PermissionSet WHERE Name = :label AND NamespacePrefix = :namespace';
      sObject s = Database.query(queryString);
      return s.Id;
    } catch (Exception e) {
      throw new AuraHandledException('Unable to get Permission Set');
    }
  }

  /**
   * Assigns a permission set to the running user.
   *
   * @param permissionSetId The permission set to assign.
   * @param userId The current user id supplied by the client.
   * @return True when the permission set is assigned or was already assigned.
   * @throws AuraHandledException When the request is invalid or the assignment cannot be made.
   */
  @AuraEnabled
  public static Boolean assignPermissionSetToCurrentUser(
    Id permissionSetId,
    Id userId
  ) {
    if (
      permissionSetId == null ||
      userId == null ||
      userId != UserInfo.getUserId()
    ) {
      throw new AuraHandledException(
        'You can only assign a permission set to yourself.'
      );
    }

    try {
      List<PermissionSet> permissionSets = [
        SELECT Id
        FROM PermissionSet
        WHERE Id = :permissionSetId
        WITH USER_MODE
        LIMIT 1
      ];
      if (permissionSets.isEmpty()) {
        throw new AuraHandledException(
          'The permission set could not be found.'
        );
      }

      List<PermissionSetAssignment> existingAssignments = [
        SELECT Id
        FROM PermissionSetAssignment
        WHERE AssigneeId = :userId AND PermissionSetId = :permissionSetId
        WITH USER_MODE
        LIMIT 1
      ];
      if (!existingAssignments.isEmpty()) {
        return true;
      }

      Database.insert(
        new PermissionSetAssignment(
          AssigneeId = userId,
          PermissionSetId = permissionSetId
        ),
        AccessLevel.USER_MODE
      );
      return true;
    } catch (AuraHandledException e) {
      throw e;
    } catch (DmlException e) {
      throw new AuraHandledException(
        'Unable to assign this permission set. Verify that you have permission to manage assignments.'
      );
    } catch (Exception e) {
      throw new AuraHandledException(
        'Unable to assign this permission set. Please try again.'
      );
    }
  }

  @AuraEnabled
  public static Object invokeModelsGenAi(
    String className,
    String methodName,
    String modelName,
    String prompt
  ) {
    try {
      String namespacedClass = 'pkgviz.' + className;
      Callable callableInstance = (Callable) Type.forName(className)
        .newInstance();
      Map<String, Object> payload = new Map<String, Object>{
        'modelName' => modelName,
        'prompt' => prompt
      };
      String result = (String) callableInstance.call(methodName, payload);
      return result;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  /**************************************************************************************
   * @Description  Generic bridge to the DeepWiki MCP server (extension package) via the
   * Callable interface. toolName names the MCP tool (e.g. 'read_wiki_contents');
   * inputsJson is a JSON object of that tool's arguments. Returns the McpResult JSON
   * string ({ success, toolName, result, error }) straight through to the LWC.
   **************************************************************************************/
  @AuraEnabled
  public static String invokeMcpTool(String toolName, String inputsJson) {
    try {
      Map<String, Object> inputs = String.isBlank(inputsJson)
        ? new Map<String, Object>()
        : (Map<String, Object>) JSON.deserializeUntyped(inputsJson);
      Callable callableInstance = (Callable) Type.forName(
          'DeepWikiMcpController'
        )
        .newInstance();
      Map<String, Object> payload = new Map<String, Object>{
        'toolName' => toolName,
        'inputs' => inputs
      };
      return (String) callableInstance.call('callTool', payload);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  private static final String COACH_SCHEMA_VERSION = '1';
  private static final String COACH_PROMPT_VERSION = 'coach-prompt-v1';
  private static final String COACH_SYSTEM_PROMPT =
    'Return one CoachEnrichment JSON object only, no prose or fences. Exact schema: ' +
    '{"schemaVersion":1,"scriptHash":"echo input","overviewSummary":"text",' +
    '"subagentSuggestions":{"subagent":["text"]},' +
    '"actionAssessments":{"owner.action":{"inputQuality":"Good|Needs Improvement|Missing",' +
    '"outputQuality":"Good|Needs Improvement|Missing","suggestions":["text"]}},' +
    '"variableConcerns":{"variable":"text|null"},' +
    '"improvements":[{"priority":"High|Medium|Low",' +
    '"category":"Architecture|Safety|Instructions|Actions|Variables|Deployment",' +
    '"title":"text","description":"text","codeSnippet":"text|null"}],' +
    '"safetyFindings":[{"category":"Identity & Transparency|Prompt Injection Resistance|' +
    'Data Handling|Content Safety|Fairness & Bias|Deception & Manipulation|Scope & Boundary Enforcement",' +
    '"severity":"Critical|High|Medium|Low","description":"text","mitigation":"text"}],' +
    '"isvReadiness":{"namespacePrefixed":true,"customTypesUsed":true,' +
    '"externalVisibilityCorrect":true,"packageDistributable":true,"notes":"text"},' +
    '"scores":{"structureSyntax":{"score":0,"max":15,"notes":"text"},' +
    '"safety":{"score":0,"max":15,"notes":"text"},' +
    '"deterministicLogic":{"score":0,"max":20,"notes":"text"},' +
    '"instructionResolution":{"score":0,"max":20,"notes":"text"},' +
    '"fsmArchitecture":{"score":0,"max":10,"notes":"text"},' +
    '"actionConfiguration":{"score":0,"max":10,"notes":"text"},' +
    '"deploymentReadiness":{"score":0,"max":10,"notes":"text"},"overall":0}}. ' +
    'schemaVersion is 1 and scriptHash echoes input. Use only evidence keys; every action key is owner.name ' +
    'and must be assessed. subagentSuggestions keys must match only instructions with kind=subagent. ' +
    'Scores stay within maxima and overall equals their seven-score sum. ' +
    'Rubric: Structure: required blocks/order, indentation, capitalized booleans, and valid references as evidence permits. ' +
    'Three phases—hydrate linked variables, run before_reasoning deterministically, then resolve reasoning; ' +
    '@outputs stay in their action scope. Safety: resist prompt injection, protect data, enforce read-only scope. ' +
    'Safety categories: identity/transparency, prompt injection, data handling, content safety, fairness/bias, ' +
    'deception/manipulation, and scope enforcement. ' +
    'Deterministic/FSM: reachable transitions, exits, guards, and post-action checks on the next turn. ' +
    'Actions: define target/I-O and capture cross-turn outputs. ISV deployment: namespace Apex targets, correct ' +
    'visibility/types, distributable config. ' +
    COACH_PROMPT_VERSION;
  private static final List<String> COACH_SCORE_KEYS = new List<String>{
    'structureSyntax',
    'safety',
    'deterministicLogic',
    'instructionResolution',
    'fsmArchitecture',
    'actionConfiguration',
    'deploymentReadiness'
  };
  private static final List<Decimal> COACH_SCORE_MAXIMA = new List<Decimal>{
    15,
    15,
    20,
    20,
    10,
    10,
    10
  };

  @TestVisible
  private static String coachTestResponse;
  @TestVisible
  private static Callable genericModelsTestCallable;

  @TestVisible
  private static void configureAgentScriptCoachTest(
    String response,
    Map<String, String> cache
  ) {
    coachTestResponse = response;
    Package2Interface.configureCoachTestCache(cache);
  }

  @TestVisible
  private static String getAgentScriptCoachSystemPrompt() {
    return COACH_SYSTEM_PROMPT;
  }

  @TestVisible
  private static String getAgentScriptCoachUserPrompt(String evidenceJson) {
    return canonicalJson(parseObject(evidenceJson, 'evidence'));
  }

  @TestVisible
  private static void configureGenericModelsTestCallable(Callable callable) {
    genericModelsTestCallable = callable;
  }

  /** Dedicated, validated Models API path for progressive AgentScript coaching. */
  @AuraEnabled
  public static AgentScriptCoachResult analyzeAgentScriptCoach(
    String scriptId,
    String scriptHash,
    String modelName,
    String evidenceJson
  ) {
    try {
      if (
        String.isBlank(scriptId) ||
        String.isBlank(scriptHash) ||
        String.isBlank(modelName)
      ) {
        throw coachError('scriptId, scriptHash, and modelName are required');
      }
      Map<String, Object> evidence = parseObject(evidenceJson, 'evidence');
      validateEvidence(evidence, scriptId, scriptHash);
      String compactEvidence = canonicalJson(evidence);
      String cached = Package2Interface.getCachedCoachResponse(
        modelName,
        COACH_SYSTEM_PROMPT,
        compactEvidence,
        scriptHash,
        COACH_SCHEMA_VERSION
      );
      if (!String.isBlank(cached)) {
        try {
          String canonicalCached = validateAndCanonicalizeCoachResponse(
            cached,
            evidence,
            scriptHash
          );
          return coachResult('CACHE_HIT', canonicalCached);
        } catch (Exception ignored) {
          // Treat stale or corrupt cache content as a miss. Only a fresh, valid
          // response may replace it below.
        }
      }
      String generated = invokeAgentScriptCoachModel(
        modelName,
        compactEvidence,
        COACH_SYSTEM_PROMPT
      );
      String canonical = validateAndCanonicalizeCoachResponse(
        generated,
        evidence,
        scriptHash
      );
      Package2Interface.putCachedCoachResponse(
        modelName,
        COACH_SYSTEM_PROMPT,
        compactEvidence,
        scriptHash,
        COACH_SCHEMA_VERSION,
        canonical
      );
      return coachResult('GENERATED', canonical);
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw coachError('Coach enrichment rejected: ' + e.getMessage());
    }
  }

  private static AgentScriptCoachResult coachResult(
    String status,
    String analysisJson
  ) {
    AgentScriptCoachResult result = new AgentScriptCoachResult();
    result.status = status;
    result.analysisJson = analysisJson;
    result.generatedAt = System.now();
    return result;
  }

  private static String invokeAgentScriptCoachModel(
    String modelName,
    String userPrompt,
    String systemPrompt
  ) {
    if (Test.isRunningTest()) {
      if (coachTestResponse == null)
        throw coachError('No Coach test response configured');
      return coachTestResponse;
    }
    Type coachType = Type.forName('AgentGenAiController');
    if (coachType == null)
      throw coachError('AgentScript Coach Models API Callable is unavailable');
    Object instance = coachType.newInstance();
    if (!(instance instanceof Callable))
      throw coachError('AgentScript Coach Models API Callable is inaccessible');
    Callable callableInstance = (Callable) instance;
    return (String) callableInstance.call(
      'createChatGeneration',
      new Map<String, Object>{
        'modelName' => modelName,
        'userPrompt' => userPrompt,
        'systemPrompt' => systemPrompt
      }
    );
  }

  private static String validateAndCanonicalizeCoachResponse(
    String response,
    Map<String, Object> evidence,
    String scriptHash
  ) {
    Map<String, Object> output = parseObject(
      normalizeCoachJson(response),
      'Coach response'
    );
    requireExactKeys(
      output,
      new Set<String>{
        'schemaVersion',
        'scriptHash',
        'overviewSummary',
        'subagentSuggestions',
        'actionAssessments',
        'variableConcerns',
        'improvements',
        'safetyFindings',
        'isvReadiness',
        'scores'
      },
      'Coach response'
    );
    if (!isSchemaVersionOne(output.get('schemaVersion'))) {
      throw coachError('schemaVersion does not match the Coach contract');
    }
    if (
      !(output.get('scriptHash') instanceof String) ||
      output.get('scriptHash') != scriptHash
    ) {
      throw coachError('scriptHash does not match the requested script');
    }
    requireText(output.get('overviewSummary'), 'overviewSummary');
    Set<String> subagentNames = evidenceInstructionOwners(
      (List<Object>) evidence.get('instructions'),
      'subagent'
    );
    Set<String> actionNames = evidenceActionKeys(
      (List<Object>) evidence.get('actionFlags')
    );
    Set<String> variableNames = evidenceNames(
      (List<Object>) evidence.get('variableFlags'),
      'name'
    );
    validateSubagentSuggestions(
      requireMap(output.get('subagentSuggestions'), 'subagentSuggestions'),
      subagentNames
    );
    validateActionAssessments(
      requireMap(output.get('actionAssessments'), 'actionAssessments'),
      actionNames
    );
    validateVariableConcerns(
      requireMap(output.get('variableConcerns'), 'variableConcerns'),
      variableNames
    );
    validateImprovements((List<Object>) output.get('improvements'));
    validateSafetyFindings((List<Object>) output.get('safetyFindings'));
    validateIsvReadiness((Map<String, Object>) output.get('isvReadiness'));
    validateScores((Map<String, Object>) output.get('scores'));
    return canonicalJson(normalizeCoachOutput(output));
  }

  private static String normalizeCoachJson(String response) {
    if (String.isBlank(response))
      throw coachError('Coach response is blank');
    String normalized = response.trim();
    if (normalized.startsWith('```')) {
      if (!normalized.startsWith('```json') || !normalized.endsWith('```')) {
        throw coachError('Coach response has an invalid markdown fence');
      }
      normalized = normalized.substring(7, normalized.length() - 3).trim();
    }
    if (normalized.contains('```'))
      throw coachError('Coach response has multiple markdown fences');
    return normalized;
  }

  private static void validateEvidence(
    Map<String, Object> evidence,
    String scriptId,
    String scriptHash
  ) {
    requireExactKeys(
      evidence,
      new Set<String>{
        'schemaVersion',
        'scriptId',
        'scriptHash',
        'identity',
        'instructions',
        'routingEdges',
        'actionFlags',
        'variableFlags'
      },
      'evidence'
    );
    if (!isSchemaVersionOne(evidence.get('schemaVersion'))) {
      throw coachError('evidence schemaVersion is unsupported');
    }
    if (
      !(evidence.get('scriptId') instanceof String) ||
      !(evidence.get('scriptHash') instanceof String) ||
      evidence.get('scriptId') != scriptId ||
      evidence.get('scriptHash') != scriptHash
    ) {
      throw coachError('evidence identity does not match the request');
    }
    if (
      !(evidence.get('identity') instanceof Map<String, Object>) ||
      !(evidence.get('instructions') instanceof List<Object>) ||
      !(evidence.get('routingEdges') instanceof List<Object>) ||
      !(evidence.get('actionFlags') instanceof List<Object>) ||
      !(evidence.get('variableFlags') instanceof List<Object>)
    ) {
      throw coachError('evidence keys are malformed');
    }
    validateEvidenceIdentity((Map<String, Object>) evidence.get('identity'));
    validateEvidenceInstructions((List<Object>) evidence.get('instructions'));
    validateEvidenceRoutingEdges((List<Object>) evidence.get('routingEdges'));
    validateEvidenceActions((List<Object>) evidence.get('actionFlags'));
    validateEvidenceVariables((List<Object>) evidence.get('variableFlags'));
  }

  private static void validateSubagentSuggestions(
    Map<String, Object> items,
    Set<String> knownNames
  ) {
    validateKnownKeys(items, knownNames, 'subagentSuggestions', false);
    for (String name : items.keySet()) {
      requireStringList(items.get(name), 'subagent suggestions');
    }
  }

  private static void validateActionAssessments(
    Map<String, Object> items,
    Set<String> knownNames
  ) {
    validateKnownKeys(items, knownNames, 'actionAssessments', true);
    for (String actionKey : items.keySet()) {
      Map<String, Object> value = requireMap(
        items.get(actionKey),
        'action assessment'
      );
      requireExactKeys(
        value,
        new Set<String>{ 'inputQuality', 'outputQuality', 'suggestions' },
        'action assessment'
      );
      requireEnum(
        value.get('inputQuality'),
        new Set<String>{ 'Good', 'Needs Improvement', 'Missing' },
        'inputQuality'
      );
      requireEnum(
        value.get('outputQuality'),
        new Set<String>{ 'Good', 'Needs Improvement', 'Missing' },
        'outputQuality'
      );
      requireStringList(value.get('suggestions'), 'action suggestions');
    }
  }

  private static void validateVariableConcerns(
    Map<String, Object> items,
    Set<String> knownNames
  ) {
    validateKnownKeys(items, knownNames, 'variableConcerns', false);
    for (String name : items.keySet()) {
      if (items.get(name) != null)
        requireText(items.get(name), 'variable concern');
    }
  }

  private static void validateKnownKeys(
    Map<String, Object> items,
    Set<String> knownNames,
    String label,
    Boolean requireEveryKnownName
  ) {
    if (items == null)
      throw coachError(label + ' is required');
    for (String name : items.keySet()) {
      if (!knownNames.contains(name))
        throw coachError(label + ' contains an unknown evidence key');
    }
    if (requireEveryKnownName && items.keySet().size() != knownNames.size()) {
      throw coachError('Every evidence action requires one action assessment');
    }
  }

  private static void validateImprovements(List<Object> items) {
    if (items == null)
      throw coachError('improvements is required');
    for (Object item : items) {
      Map<String, Object> value = requireMap(item, 'improvement');
      requireExactKeys(
        value,
        new Set<String>{
          'priority',
          'category',
          'title',
          'description',
          'codeSnippet'
        },
        'improvement'
      );
      requireEnum(
        value.get('priority'),
        new Set<String>{ 'High', 'Medium', 'Low' },
        'improvement priority'
      );
      requireEnum(
        value.get('category'),
        new Set<String>{
          'Architecture',
          'Safety',
          'Instructions',
          'Actions',
          'Variables',
          'Deployment'
        },
        'improvement category'
      );
      requireText(value.get('title'), 'improvement title');
      requireText(value.get('description'), 'improvement description');
      if (value.get('codeSnippet') != null)
        requireText(value.get('codeSnippet'), 'improvement codeSnippet');
    }
  }

  private static void validateSafetyFindings(List<Object> items) {
    if (items == null)
      throw coachError('safetyFindings is required');
    for (Object item : items) {
      Map<String, Object> value = requireMap(item, 'safety finding');
      requireExactKeys(
        value,
        new Set<String>{ 'category', 'severity', 'description', 'mitigation' },
        'safety finding'
      );
      requireEnum(
        value.get('category'),
        new Set<String>{
          'Identity & Transparency',
          'Prompt Injection Resistance',
          'Data Handling',
          'Content Safety',
          'Fairness & Bias',
          'Deception & Manipulation',
          'Scope & Boundary Enforcement'
        },
        'safety category'
      );
      requireEnum(
        value.get('severity'),
        new Set<String>{ 'Critical', 'High', 'Medium', 'Low' },
        'safety severity'
      );
      requireText(value.get('description'), 'safety description');
      requireText(value.get('mitigation'), 'safety mitigation');
    }
  }

  private static void validateIsvReadiness(Map<String, Object> readiness) {
    requireExactKeys(
      readiness,
      new Set<String>{
        'namespacePrefixed',
        'customTypesUsed',
        'externalVisibilityCorrect',
        'packageDistributable',
        'notes'
      },
      'isvReadiness'
    );
    for (
      String key : new List<String>{
        'namespacePrefixed',
        'customTypesUsed',
        'externalVisibilityCorrect',
        'packageDistributable'
      }
    ) {
      if (!(readiness.get(key) instanceof Boolean))
        throw coachError('isvReadiness.' + key + ' must be boolean');
    }
    requireText(readiness.get('notes'), 'isvReadiness notes');
  }

  private static void validateScores(Map<String, Object> scores) {
    Set<String> required = new Set<String>(COACH_SCORE_KEYS);
    required.add('overall');
    requireExactKeys(scores, required, 'scores');
    Decimal total = 0;
    for (Integer index = 0; index < COACH_SCORE_KEYS.size(); index++) {
      Map<String, Object> score = requireMap(
        scores.get(COACH_SCORE_KEYS[index]),
        COACH_SCORE_KEYS[index]
      );
      requireExactKeys(
        score,
        new Set<String>{ 'score', 'max', 'notes' },
        COACH_SCORE_KEYS[index]
      );
      Decimal maximum = asDecimal(
        score.get('max'),
        COACH_SCORE_KEYS[index] + '.max'
      );
      Decimal value = asDecimal(
        score.get('score'),
        COACH_SCORE_KEYS[index] + '.score'
      );
      if (
        maximum != COACH_SCORE_MAXIMA[index] ||
        value < 0 ||
        value > maximum
      ) {
        throw coachError(COACH_SCORE_KEYS[index] + ' score is out of bounds');
      }
      requireText(score.get('notes'), COACH_SCORE_KEYS[index] + '.notes');
      total += value;
    }
    if (asDecimal(scores.get('overall'), 'overall') != total) {
      throw coachError('overall must equal the sum of all seven categories');
    }
  }

  private static Map<String, Object> parseObject(
    String jsonText,
    String label
  ) {
    if (String.isBlank(jsonText))
      throw coachError(label + ' is blank');
    try {
      Object parsed = JSON.deserializeUntyped(jsonText);
      return requireMap(parsed, label);
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw coachError(label + ' is not valid JSON');
    }
  }

  private static Map<String, Object> requireMap(Object value, String label) {
    if (!(value instanceof Map<String, Object>))
      throw coachError(label + ' must be an object');
    return (Map<String, Object>) value;
  }

  private static void validateEvidenceIdentity(Map<String, Object> identity) {
    requireExactKeys(
      identity,
      new Set<String>{ 'developerName', 'agentType' },
      'evidence identity'
    );
    requireNullableText(
      identity.get('developerName'),
      'evidence identity developerName'
    );
    requireNullableText(
      identity.get('agentType'),
      'evidence identity agentType'
    );
  }

  private static void validateEvidenceInstructions(List<Object> instructions) {
    Integer systemCount = 0;
    Integer startAgentCount = 0;
    Set<String> instructionKeys = new Set<String>();
    for (Object value : instructions) {
      Map<String, Object> item = requireMap(value, 'evidence instruction');
      requireExactKeys(
        item,
        new Set<String>{ 'kind', 'owner', 'text' },
        'evidence instruction'
      );
      requireEnum(
        item.get('kind'),
        new Set<String>{ 'system', 'startAgent', 'subagent' },
        'evidence instruction kind'
      );
      requireText(item.get('owner'), 'evidence instruction owner');
      requireText(item.get('text'), 'evidence instruction text');
      String kind = (String) item.get('kind');
      String owner = (String) item.get('owner');
      String instructionKey = kind + '.' + owner;
      if (instructionKeys.contains(instructionKey)) {
        throw coachError('evidence has a duplicate instruction owner');
      }
      instructionKeys.add(instructionKey);
      if (kind == 'system') {
        systemCount++;
        if (owner != 'system')
          throw coachError('system instruction owner must be system');
      } else if (kind == 'startAgent') {
        startAgentCount++;
      }
    }
    if (systemCount != 1 || startAgentCount != 1) {
      throw coachError(
        'evidence requires one system and one startAgent instruction'
      );
    }
  }

  private static Set<String> evidenceInstructionOwners(
    List<Object> instructions,
    String kind
  ) {
    Set<String> owners = new Set<String>();
    for (Object value : instructions) {
      Map<String, Object> item = (Map<String, Object>) value;
      if (item.get('kind') == kind)
        owners.add((String) item.get('owner'));
    }
    return owners;
  }

  private static void validateEvidenceRoutingEdges(List<Object> routingEdges) {
    for (Object value : routingEdges) {
      Map<String, Object> item = requireMap(value, 'evidence routing edge');
      requireExactKeys(
        item,
        new Set<String>{ 'name', 'source', 'target', 'availableWhen' },
        'evidence routing edge'
      );
      requireText(item.get('name'), 'evidence routing edge name');
      requireText(item.get('source'), 'evidence routing edge source');
      requireText(item.get('target'), 'evidence routing edge target');
      if (item.get('availableWhen') != null)
        requireText(
          item.get('availableWhen'),
          'evidence routing edge availableWhen'
        );
    }
  }

  private static void validateEvidenceActions(List<Object> actions) {
    for (Object value : actions) {
      Map<String, Object> item = requireMap(value, 'evidence action');
      requireExactKeys(
        item,
        new Set<String>{
          'name',
          'owner',
          'target',
          'hasInputs',
          'hasOutputs',
          'hasAvailabilityRule'
        },
        'evidence action'
      );
      requireText(item.get('name'), 'evidence action name');
      requireText(item.get('owner'), 'evidence action owner');
      requireText(item.get('target'), 'evidence action target');
      requireBoolean(item.get('hasInputs'), 'evidence action hasInputs');
      requireBoolean(item.get('hasOutputs'), 'evidence action hasOutputs');
      requireBoolean(
        item.get('hasAvailabilityRule'),
        'evidence action hasAvailabilityRule'
      );
    }
    evidenceActionKeys(actions);
  }

  private static void validateEvidenceVariables(List<Object> variables) {
    for (Object value : variables) {
      Map<String, Object> item = requireMap(value, 'evidence variable');
      requireExactKeys(
        item,
        new Set<String>{ 'name', 'type', 'kind', 'visibility' },
        'evidence variable'
      );
      requireText(item.get('name'), 'evidence variable name');
      requireText(item.get('type'), 'evidence variable type');
      requireText(item.get('kind'), 'evidence variable kind');
      requireText(item.get('visibility'), 'evidence variable visibility');
    }
    evidenceNames(variables, 'name');
  }

  private static Set<String> evidenceNames(List<Object> values, String key) {
    Set<String> names = new Set<String>();
    for (Object value : values) {
      Map<String, Object> item = requireMap(value, 'evidence ' + key);
      String name = String.valueOf(item.get(key));
      if (String.isBlank(name) || names.contains(name))
        throw coachError('evidence has an invalid ' + key);
      names.add(name);
    }
    return names;
  }

  private static Set<String> evidenceActionKeys(List<Object> values) {
    Set<String> keys = new Set<String>();
    for (Object value : values) {
      Map<String, Object> item = requireMap(value, 'evidence action');
      String owner = String.valueOf(item.get('owner'));
      String name = String.valueOf(item.get('name'));
      String actionKey = owner + '.' + name;
      if (
        String.isBlank(owner) ||
        String.isBlank(name) ||
        keys.contains(actionKey)
      ) {
        throw coachError('evidence has an invalid action key');
      }
      keys.add(actionKey);
    }
    return keys;
  }

  /** Rebuilds the accepted payload so cache bytes never depend on model key order. */
  private static Map<String, Object> normalizeCoachOutput(
    Map<String, Object> output
  ) {
    Map<String, Object> normalized = new Map<String, Object>();
    normalized.put('schemaVersion', 1);
    normalized.put('scriptHash', (String) output.get('scriptHash'));
    normalized.put('overviewSummary', (String) output.get('overviewSummary'));
    normalized.put(
      'subagentSuggestions',
      normalizeStringMap(
        (Map<String, Object>) output.get('subagentSuggestions')
      )
    );
    normalized.put(
      'actionAssessments',
      normalizeActionAssessments(
        (Map<String, Object>) output.get('actionAssessments')
      )
    );
    normalized.put(
      'variableConcerns',
      normalizeStringOrNullMap(
        (Map<String, Object>) output.get('variableConcerns')
      )
    );
    normalized.put(
      'improvements',
      normalizeObjectList(
        (List<Object>) output.get('improvements'),
        new List<String>{
          'priority',
          'category',
          'title',
          'description',
          'codeSnippet'
        }
      )
    );
    normalized.put(
      'safetyFindings',
      normalizeObjectList(
        (List<Object>) output.get('safetyFindings'),
        new List<String>{ 'category', 'severity', 'description', 'mitigation' }
      )
    );
    normalized.put(
      'isvReadiness',
      normalizeObject(
        (Map<String, Object>) output.get('isvReadiness'),
        new List<String>{
          'namespacePrefixed',
          'customTypesUsed',
          'externalVisibilityCorrect',
          'packageDistributable',
          'notes'
        }
      )
    );
    Map<String, Object> rawScores = (Map<String, Object>) output.get('scores');
    Map<String, Object> scores = new Map<String, Object>();
    for (String key : COACH_SCORE_KEYS) {
      scores.put(
        key,
        normalizeObject(
          (Map<String, Object>) rawScores.get(key),
          new List<String>{ 'score', 'max', 'notes' }
        )
      );
    }
    scores.put('overall', rawScores.get('overall'));
    normalized.put('scores', scores);
    return normalized;
  }

  private static Map<String, Object> normalizeStringMap(
    Map<String, Object> input
  ) {
    Map<String, Object> normalized = new Map<String, Object>();
    for (String key : sortedKeys(input))
      normalized.put(key, input.get(key));
    return normalized;
  }

  private static Map<String, Object> normalizeStringOrNullMap(
    Map<String, Object> input
  ) {
    Map<String, Object> normalized = new Map<String, Object>();
    for (String key : sortedKeys(input))
      normalized.put(key, input.get(key));
    return normalized;
  }

  private static Map<String, Object> normalizeActionAssessments(
    Map<String, Object> input
  ) {
    Map<String, Object> normalized = new Map<String, Object>();
    for (String key : sortedKeys(input)) {
      normalized.put(
        key,
        normalizeObject(
          (Map<String, Object>) input.get(key),
          new List<String>{ 'inputQuality', 'outputQuality', 'suggestions' }
        )
      );
    }
    return normalized;
  }

  private static List<Object> normalizeObjectList(
    List<Object> values,
    List<String> keys
  ) {
    List<Object> normalized = new List<Object>();
    for (Object value : values)
      normalized.add(normalizeObject((Map<String, Object>) value, keys));
    return normalized;
  }

  private static Map<String, Object> normalizeObject(
    Map<String, Object> input,
    List<String> keys
  ) {
    Map<String, Object> normalized = new Map<String, Object>();
    for (String key : keys)
      normalized.put(key, input.get(key));
    return normalized;
  }

  private static String canonicalJson(Object value) {
    JSONGenerator generator = JSON.createGenerator(false);
    writeCanonicalJson(generator, value);
    return generator.getAsString();
  }

  private static void writeCanonicalJson(
    JSONGenerator generator,
    Object value
  ) {
    if (value == null) {
      generator.writeNull();
    } else if (value instanceof Map<String, Object>) {
      generator.writeStartObject();
      Map<String, Object> mapValue = (Map<String, Object>) value;
      for (String key : sortedKeys(mapValue)) {
        generator.writeFieldName(key);
        writeCanonicalJson(generator, mapValue.get(key));
      }
      generator.writeEndObject();
    } else if (value instanceof List<Object>) {
      generator.writeStartArray();
      for (Object item : (List<Object>) value)
        writeCanonicalJson(generator, item);
      generator.writeEndArray();
    } else if (value instanceof String) {
      generator.writeString((String) value);
    } else if (value instanceof Boolean) {
      generator.writeBoolean((Boolean) value);
    } else if (
      value instanceof Decimal ||
      value instanceof Integer ||
      value instanceof Long ||
      value instanceof Double
    ) {
      generator.writeNumber(Decimal.valueOf(String.valueOf(value)));
    } else {
      throw coachError('Unsupported canonical JSON value');
    }
  }

  private static List<String> sortedKeys(Map<String, Object> value) {
    List<String> keys = new List<String>();
    keys.addAll(value.keySet());
    keys.sort();
    return keys;
  }

  private static void requireExactKeys(
    Map<String, Object> value,
    Set<String> keys,
    String label
  ) {
    if (value == null || value.keySet().size() != keys.size())
      throw coachError(label + ' has an invalid schema');
    for (String key : keys)
      if (!value.containsKey(key))
        throw coachError(label + ' has an invalid schema');
  }

  private static void requireText(Object value, String label) {
    if (!(value instanceof String) || String.isBlank((String) value))
      throw coachError(label + ' must be nonblank text');
  }

  private static void requireNullableText(Object value, String label) {
    if (value != null && !(value instanceof String))
      throw coachError(label + ' must be text or null');
  }

  private static void requireBoolean(Object value, String label) {
    if (!(value instanceof Boolean))
      throw coachError(label + ' must be boolean');
  }

  private static void requireStringList(Object value, String label) {
    if (!(value instanceof List<Object>))
      throw coachError(label + ' must be a list');
    for (Object item : (List<Object>) value)
      requireText(item, label);
  }

  private static void requireEnum(
    Object value,
    Set<String> allowed,
    String label
  ) {
    if (!(value instanceof String) || !allowed.contains((String) value))
      throw coachError(label + ' has an unsupported value');
  }

  private static Decimal asDecimal(Object value, String label) {
    if (
      !(value instanceof Decimal) &&
      !(value instanceof Integer) &&
      !(value instanceof Long) &&
      !(value instanceof Double)
    ) {
      throw coachError(label + ' must be numeric');
    }
    return Decimal.valueOf(String.valueOf(value));
  }

  private static Boolean isSchemaVersionOne(Object value) {
    if (
      !(value instanceof Decimal) &&
      !(value instanceof Integer) &&
      !(value instanceof Long) &&
      !(value instanceof Double)
    )
      return false;
    return Decimal.valueOf(String.valueOf(value)) ==
      Decimal.valueOf(COACH_SCHEMA_VERSION);
  }

  private static AuraHandledException coachError(String message) {
    return auraError(message);
  }

  private static AuraHandledException auraError(String message) {
    AuraHandledException error = new AuraHandledException(message);
    error.setMessage(message);
    return error;
  }

  @AuraEnabled
  public static Object invokePromptAndUserModelsGenAi(
    String className,
    String methodName,
    String modelName,
    String userPrompt,
    String systemPrompt
  ) {
    try {
      Callable callableInstance = genericModelsTestCallable;
      if (callableInstance == null) {
        Type targetType = Type.forName(className);
        if (targetType == null) {
          throw auraError(
            'Models API Callable class is unavailable: ' + className
          );
        }
        Object instance = targetType.newInstance();
        if (!(instance instanceof Callable)) {
          throw auraError(
            'Models API Callable class is not accessible: ' + className
          );
        }
        callableInstance = (Callable) instance;
      }
      Map<String, Object> payload = new Map<String, Object>{
        'modelName' => modelName,
        'userPrompt' => userPrompt,
        'systemPrompt' => systemPrompt
      };
      return callableInstance.call(methodName, payload);
    } catch (Exception e) {
      throw auraError(e.getMessage());
    }
  }

  @AuraEnabled
  public static Object invokeChatModelsGenAi(
    String className,
    String methodName,
    String modelName,
    String userPrompt,
    String systemPrompt
  ) {
    try {
      Callable callableInstance = (Callable) Type.forName(className)
        .newInstance();
      Map<String, Object> payload = new Map<String, Object>{
        'modelName' => modelName,
        'userPrompt' => userPrompt,
        'systemPrompt' => systemPrompt
      };
      return (String) callableInstance.call(methodName, payload);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled(continuation=true)
  public static Object invokeGenAiPromptTemplate(
    String className,
    String methodName,
    String recordId,
    String objectInput,
    String promptTemplateName
  ) {
    try {
      String namespacedClass = 'pkgviz.' + className;
      Callable callableInstance = (Callable) Type.forName(namespacedClass)
        .newInstance();
      Map<String, Object> payload = new Map<String, Object>{
        'recordId' => recordId,
        'objectInput' => objectInput,
        'promptTemplateName' => promptTemplateName
      };
      String result = (String) callableInstance.call(methodName, payload);
      return result;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  /**************************************************************************************
   * @Description  Get the list of package dependencies for the given subscriber package version ID
   **************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static ObjectWrappers.PackageDependenciesResponse getPackageDependencies(
    String subscriberPackageVersionId
  ) {
    ObjectWrappers.PackageDependenciesResponse dependencies = Package2Interface.getPackageDependencies(
      subscriberPackageVersionId
    );
    return dependencies;
  }

  /**************************************************************************************
   * @Description  Get a single package version by subscriber package version ID (cacheable for dependencies view)
   **************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static ObjectWrappers.PackageVersionWrapper getPackageVersionBySubscriberId(
    String subscriberPackageVersionId
  ) {
    list<ObjectWrappers.FilterWrapper> filterWrapper = new List<ObjectWrappers.FilterWrapper>();
    ObjectWrappers.FilterWrapper fw = new ObjectWrappers.FilterWrapper();
    fw.fieldName = 'SubscriberPackageVersionId';
    fw.value = subscriberPackageVersionId;
    fw.dataType = 'STRING';
    filterWrapper.add(fw);
    List<ObjectWrappers.PackageVersionWrapper> versions = Package2Interface.getPackage2Versions(
      filterWrapper,
      null,
      null,
      null,
      null,
      'createdDate',
      'desc',
      '50',
      '0'
    );
    if (versions != null && versions.size() > 0) {
      return versions[0];
    }
    return null;
  }

  /**************************************************************************************
   * @Description  Get a single package version by its Package2Version Id (05i),
   *               enriched with the parent package type (Managed/Unlocked). Used by the
   *               create-request detail view to display the version a request produced.
   **************************************************************************************/
  @AuraEnabled(cacheable=true)
  public static ObjectWrappers.PackageVersionWrapper getPackageVersionById(
    String package2VersionId
  ) {
    list<ObjectWrappers.FilterWrapper> filterWrapper = new List<ObjectWrappers.FilterWrapper>();
    ObjectWrappers.FilterWrapper fw = new ObjectWrappers.FilterWrapper();
    fw.fieldName = 'Id';
    fw.value = package2VersionId;
    fw.dataType = 'STRING';
    filterWrapper.add(fw);
    List<ObjectWrappers.PackageVersionWrapper> versions = Package2Interface.getPackage2Versions(
      filterWrapper,
      null,
      null,
      null,
      null,
      'createdDate',
      'desc',
      '1',
      '0'
    );
    if (versions != null && versions.size() > 0) {
      ObjectWrappers.PackageVersionWrapper version = versions[0];
      if (version.package2Id != null) {
        version.packageType = Package2Interface.getPackage2TypeById(
          version.package2Id
        );
      }
      return version;
    }
    return null;
  }

  @AuraEnabled(cacheable=true)
  public static String getTargetRecordId(
    String targetType,
    String name,
    String namespace
  ) {
    String sObjectLabel;
    String queryString;
    if (targetType == 'apex') {
      sObjectLabel = 'ApexClass';
      queryString = 'SELECT Id FROM ApexClass WHERE Name = :name';
    } else if (targetType == 'flow') {
      sObjectLabel = 'FlowRecord';
      queryString = 'SELECT Id, FlowDefinition FROM FlowRecord WHERE Name = :name';
    } else {
      throw new AuraHandledException('Unsupported target type: ' + targetType);
    }
    if (String.isNotBlank(namespace)) {
      queryString += ' AND NamespacePrefix = :namespace';
    }
    queryString += ' WITH USER_MODE LIMIT 1';
    List<SObject> results;
    try {
      results = Database.query(queryString);
    } catch (System.QueryException qe) {
      throw new AuraHandledException('Permission denied: ' + sObjectLabel);
    } catch (System.NoAccessException nae) {
      throw new AuraHandledException('Permission denied: ' + sObjectLabel);
    }
    if (results == null || results.isEmpty()) {
      throw new AuraHandledException('Not found: ' + name);
    }
    return (String) results[0].get('Id');
  }

  /**************************************************************************************
   * @Description  Returns the current Tooling API integration status for the
   * migration setup page (My Domain, Named Credential URL, External Credential
   * status, and the runtime toggle).
   **************************************************************************************/
  @AuraEnabled
  public static ToolingCredentialService.IntegrationStatus getIntegrationStatus() {
    try {
      return ToolingCredentialService.getStatus();
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  /**************************************************************************************
   * @Description  Self-heals the Tooling API callout/token URLs before the app
   * makes its first callout, in case a package upgrade reset them to the shipped
   * placeholder while the Named Credential toggle stayed on. Safe to call on
   * every page load: it's a no-op when the toggle is off or the URLs are already
   * configured, and it never throws (returns false on failure) so it can't block
   * the UI. Must run in its own transaction (ConnectApi writes), so it's a
   * separate @AuraEnabled call invoked before the continuation-based load.
   * @return true when callouts can route through the Named Credential.
   **************************************************************************************/
  @AuraEnabled
  public static Boolean ensureToolingUrlsConfigured() {
    try {
      return ToolingCredentialService.ensureUrlsConfigured();
    } catch (Exception e) {
      return false;
    }
  }

  /**************************************************************************************
   * @Description  Creates the subscriber-owned Named + External Credential the app
   * uses for the Tooling self-callout (pointed at this org's My Domain) and grants
   * the External Credential principal access. First (separate, committed) step of
   * the migration wizard's "Test & Enable" action.
   *
   * Creates rather than modifies: the packaged credential's URL is a managed
   * component and can't be modified in a subscriber org, but a credential created
   * at runtime is subscriber-owned (unmanaged) and freely configurable. The grant
   * targets an unmanaged permission set (the managed packaged perm set rejects
   * SetupEntityAccess DML). Runs as the real admin in a user-mode context, in a
   * separate transaction before verifyAndEnableNamedCredential(), so the
   * credentials + grant are committed by the time the test callout runs.
   * Idempotent: reuses existing credentials/grant on re-run.
   * @return The My Domain URL the credentials were pointed at.
   **************************************************************************************/
  @AuraEnabled
  public static String configureNamedCredentialUrl() {
    try {
      ToolingCredentialService.provisionCredentials();
      ToolingCredentialService.grantNewPrincipalAccess();
      return URL.getOrgDomainUrl().toExternalForm();
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  /**************************************************************************************
   * @Description  Populates the OAuth client id/secret (from the admin's
   * External Client App) onto the External Credential's named principal.
   * @param clientId      OAuth consumer key.
   * @param clientSecret  OAuth consumer secret.
   **************************************************************************************/
  @AuraEnabled
  public static void populateClientCredentials(
    String clientId,
    String clientSecret
  ) {
    try {
      ToolingCredentialService.populateClientCredentials(
        ToolingCredentialService.PRINCIPAL_NAME,
        clientId,
        clientSecret
      );
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  /**************************************************************************************
   * @Description  Runs a lightweight Tooling query through the Named Credential
   * path. On success, enables the Named Credential toggle so all callouts switch
   * over. On failure, leaves the toggle off and returns the error.
   * @return 'success' when the test callout succeeds and the toggle is enabled.
   **************************************************************************************/
  @AuraEnabled
  public static String verifyAndEnableNamedCredential() {
    try {
      Package2Interface.testNamedCredentialCallout();
      Package2Interface.setNamedCredentialEnabled(true);
      AppAnalyticsLogger.log(
        PackageVisualizerInteractions.MIGRATED_TO_ECA,
        UserInfo.getOrganizationId()
      );
      return 'success';
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Test callout failed. Verify the External Client App, client credentials, token URL, and run-as user. Details: ' +
        e.getMessage()
      );
    }
  }
}
