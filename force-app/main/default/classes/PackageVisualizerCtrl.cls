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
    public static list<ObjectWrappers.PackageWrapper> get2GPPackageList(String sortDirection){
        list <ObjectWrappers.PackageWrapper> packageList = Package2Interface.getPackage2(sortDirection);
        return packageList;
    }

    @AuraEnabled(continuation=true)
    public static list<ObjectWrappers.PackageWrapper1> get1GPPackageList(String sortDirection){
        List <ObjectWrappers.PackageWrapper1> packageList = Package2Interface.getPackage1(sortDirection);
        return packageList;
    }

	/**************************************************************************************
	* @Description  Get list of all 2GP packages version available in this DevHub org for the package.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/       
    @AuraEnabled(continuation=true)
    public static List<ObjectWrappers.PackageVersionWrapper> get2GPPackageVersionList(list<ObjectWrappers.FilterWrapper> filterWrapper, String minMajorVersion, String maxMajorVersion, String minMinorVersion, String maxMinorVersion, String sortedBy, String sortDirection, String versionLimit, String versionOffset){
        List <ObjectWrappers.PackageVersionWrapper> packageVersionList = Package2Interface.getPackage2Versions(filterWrapper, minMajorVersion, maxMajorVersion, minMinorVersion, maxMinorVersion, sortedBy, sortDirection, versionLimit, versionOffset);
        return packageVersionList;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getLatestPackageVersions(String packageId, String versionLimit){
        List <String> packageVersionList = Package2Interface.getLatestPackageVersionsList(packageId, versionLimit);
        return packageVersionList;
    }

    /**************************************************************************************
	* @Description  Get list of all SignUp Requests available in this DevHub org 
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/
    @AuraEnabled(continuation=true)
    public static List<ObjectWrappers.SignupRequestWrapper> getSignUpRequests(list<ObjectWrappers.FilterWrapper> filterWrapper, String sortedBy, String sortDirection, String signUpLimit, String signUpOffset){
        List<ObjectWrappers.SignupRequestWrapper> signUpList = Package2Interface.getSignUpRequests(filterWrapper, sortedBy, sortDirection, signUpLimit, signUpOffset);
        return signUpList;
    }

    /**************************************************************************************
	* @Description  Get list of all 1GP packages version available in the Org.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/       
    @AuraEnabled(cacheable=true)
    public static List<ObjectWrappers.Package1VersionWrapper> get1GPPackageVersionList(list<ObjectWrappers.FilterWrapper> filterWrapper, String minMajorVersion, String maxMajorVersion, String minMinorVersion, String maxMinorVersion, String sortedBy, String sortDirection, String versionLimit, String versionOffset){
        List <ObjectWrappers.Package1VersionWrapper> packageVersionList = Package2Interface.getPackage1Versions(filterWrapper, minMajorVersion, maxMajorVersion, minMinorVersion, maxMinorVersion, sortedBy, sortDirection, versionLimit, versionOffset);
        return packageVersionList;
    }

	/**************************************************************************************
	* @Description  Get list of all 2GP Packages Subscriber org details for the given package or package version.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/ 
    @AuraEnabled(cacheable=true)
    public static List<ObjectWrappers.PackageSubscriberWrapper> get2GPPackageVersionSubscriberList(list<ObjectWrappers.FilterWrapper> filterWrapper, String sortedBy, String sortDirection, String subscriberLimit, String subscriberOffset){
        List <ObjectWrappers.PackageSubscriberWrapper> packageSubList = Package2Interface.get2GPPackageSubscriberList(filterWrapper, sortedBy, sortDirection, subscriberLimit, subscriberOffset);
        return packageSubList;
    }
    
	/**************************************************************************************
	* @Description  Get list of all 2GP Packages Subscriber org details group by varios fields
					for the given package or package version.
					Additional filters can be included in the FilterWrapper list.
	**************************************************************************************/    
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getSubscriberChartData(List<ObjectWrappers.FilterWrapper> filterWrapper, String groupByField){
        List <AggregateResult> subChartData = Package2Interface.getSubscriberChartData(filterWrapper, groupByField);
        return subChartData;
    }

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getLmaChartData(List<ObjectWrappers.FilterWrapper> filterWrapper, String groupByField){
        List <AggregateResult> lmaChartData = Package2Interface.getLmaChartData(filterWrapper, groupByField);
        return lmaChartData;
    }

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getPackagePushJobChartData(List<ObjectWrappers.FilterWrapper> filterWrapper, String groupByField){
        List <AggregateResult> packagePushJobChartChartData = Package2Interface.getPackagePushJobChartData(filterWrapper, groupByField);
        return packagePushJobChartChartData;
    }
        
	/**************************************************************************************
	* @Description  Return true if the DevHub also have LMA package installed.
	**************************************************************************************/ 
    @AuraEnabled(cacheable=true)
    public static boolean isLMA(){
        return (Type.forName('sfLma__License__c') != null);
    }

    @AuraEnabled(cacheable=true)
    public static List<Package_Visualizer_Resource__mdt> getResourcesMetadata(){
        List<Package_Visualizer_Resource__mdt> resources = [ SELECT Label, Icon__c, Link__c, Description__c FROM Package_Visualizer_Resource__mdt WHERE Visibility__c = true ORDER BY Label LIMIT 50 ];
        return resources;
    }

    @AuraEnabled(cacheable=true)
    public static List<Package_Visualizer_Announcement__mdt> getAnnouncementsMetadata(){
        List<Package_Visualizer_Announcement__mdt> announcements = [ SELECT Label, Icon__c, Order__c, Link__c, Description__c FROM Package_Visualizer_Announcement__mdt WHERE Visibility__c = true ORDER BY Order__c ASC LIMIT 50 ];
        return announcements;
    }

    @AuraEnabled(cacheable=true)
    public static List<About_Welcome_Mat_Step__mdt> getWelcomeMatAboutSteps(){
        List<About_Welcome_Mat_Step__mdt> steps = [ SELECT Label, Icon__c, Order__c, Description__c, Link__c FROM About_Welcome_Mat_Step__mdt WHERE Visibility__c = true ORDER BY Order__c ASC LIMIT 50 ];
        return steps;
    }

    @AuraEnabled(cacheable=true)
    public static String calculatePackageVersionCodeCoverage(String subscriberPackageVersionId){
        String codeCoverage = Package2Interface.getPackageVersionCodeCoverage(subscriberPackageVersionId);
        return codeCoverage;
    }

    @AuraEnabled(cacheable=true)
    public static Boolean verifySecurityReviewApproved(String subscriberPackageVersionId){
        Boolean isSecurityReviewed = Package2Interface.getIsSecurityReviewed(subscriberPackageVersionId);
        return isSecurityReviewed;
    }

    @AuraEnabled(cacheable=true)
    public static String getEnvHubMemberId(String orgId){
        Boolean isEnvHubMemberAvailable = Package2Interface.isEnvironmentHubMember();
        if(isEnvHubMemberAvailable == true){
            String envHubId = Package2Interface.getEnvHubMemberId(orgId);
            return envHubId;
        } else {
            throw new AuraHandledException('We could not find the associated Environment Hub Member in your org...');
        }
    }

    @AuraEnabled(continuation=true)
    public static List<AppAnalyticsQueryRequest> getAppAnalyticsRequests(String packageIds){
        if(!String.isBlank(packageIds)){
            packageIds = packageIds.substring(0,15);
            List<AppAnalyticsQueryRequest> appAnalyticsRequests = [ SELECT Id, DataType, DownloadExpirationTime, DownloadSize, DownloadUrl, EndTime, ErrorMessage, QuerySubmittedTime, Name, RequestState, StartTime, OrganizationIds, PackageIds, FileType, FileCompression FROM AppAnalyticsQueryRequest WHERE CreatedDate >= LAST_N_DAYS:1 AND PackageIds = :packageIds ORDER BY CreatedDate DESC LIMIT 50 ];return appAnalyticsRequests;
        } else {
            List<AppAnalyticsQueryRequest> appAnalyticsRequests = [ SELECT Id, DataType, DownloadExpirationTime, DownloadSize, DownloadUrl, EndTime, ErrorMessage, QuerySubmittedTime, Name, RequestState, StartTime, OrganizationIds, PackageIds, FileType, FileCompression FROM AppAnalyticsQueryRequest WHERE CreatedDate >= LAST_N_DAYS:1 ORDER BY CreatedDate DESC LIMIT 50 ];return appAnalyticsRequests;
        }
    }

    @AuraEnabled(continuation=true) 
    public static String insertAppAnalyticsRequest(String dataType, DateTime endTime, DateTime startTime, String packageId, String organizationIds, String fileType, String fileCompression){
        AppAnalyticsQueryRequest req = new AppAnalyticsQueryRequest();
        req.DataType = dataType;req.EndTime = endTime;req.StartTime = startTime;req.PackageIds = packageId.substring(0,15);req.OrganizationIds = organizationIds;

        if(fileType != 'none'){req.FileType = fileType;req.FileCompression = fileCompression;}

        if(Test.isRunningTest()){
            return 'TEST';
        } else{
        	insert req;
            return req.id;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static ObjectWrappers.LMAVersionWrapper getLMAVersion (String subscriberPackageVersionId){
        try {
            String queryString = ' SELECT CreatedDate, Id, Name, sfLma__Is_Beta__c, sfLma__Package__c, sfLma__Package__r.Name, sfLma__Release_Date__c, sfLma__Version_ID__c, sfLma__Version__c FROM sfLma__Package_Version__c WHERE sfLma__Version_ID__c = :subscriberPackageVersionId LIMIT 1 ';
            if(Type.forName('sfLma__Package_Version__c') != null){
                sObject result = Database.query(queryString);ObjectWrappers.LMAVersionWrapper lmaVersion = new ObjectWrappers.LMAVersionWrapper();lmaVersion.createdDate = result.get('CreatedDate');lmaVersion.id = result.get('Id');lmaVersion.name = result.get('Name');lmaVersion.isBeta = result.get('sfLma__Is_Beta__c');lmaVersion.lmaPackageId = result.get('sfLma__Package__c');lmaVersion.lmaPackageName = result.getSObject('sfLma__Package__r').get('Name');lmaVersion.releaseDate = result.get('sfLma__Release_Date__c');lmaVersion.packageVersionId = result.get('sfLma__Version_ID__c');lmaVersion.lmaVersionName = result.get('sfLma__Version__c');
                return lmaVersion;
            }
            return null;
        } catch(Exception e){throw new AuraHandledException('Could not find a LMA record associated with this version'); }
    }

    @AuraEnabled(cacheable=true)
    public static ObjectWrappers.LMAPackageWrapper getLmaPackage(String subscriberPackageId){
        try {
            String queryString = ' SELECT Id, sfLma__Package_ID__c FROM sfLma__Package__c WHERE sfLma__Package_ID__c = :subscriberPackageId LIMIT 1 ';
            if(Type.forName('sfLma__Package__c') != null){
                sObject result = Database.query(queryString);ObjectWrappers.LMAPackageWrapper lmaPackage = new ObjectWrappers.LMAPackageWrapper();lmaPackage.id = result.get('Id');
                return lmaPackage;
            }
            return null;
        } catch(Exception e){throw new AuraHandledException('Could not find a LMA record associated with this version'); }
    }

    @AuraEnabled(continuation=true)
    public static List<ObjectWrappers.LMALicenseWrapper> getPackageVersionLicenses (List<ObjectWrappers.FilterWrapper> filterWrapper, String sortedBy, String sortDirection, String lmaLicensesLimit, String lmaLicensesOffset) {
        try {
            String queryString = ' SELECT Id, LastModifiedDate, Name, sfLma__Account__c, sfLma__Account__r.Name, sfLma__Contact__c ,sfLma__Contact__r.Name, sfLma__Install_Date__c, sfLma__Lead__c ,sfLma__Lead__r.Name, sfLma__Lead__r.LeadSource, sfLma__Lead__r.Email, sfLma__Licensed_Seats__c, sfLma__Seats__c ,sfLma__License_Status__c, sfLma__License_Type__c, sfLma__Expiration__c, sfLma__Used_Licenses__c FROM sfLma__License__c ';String whereClause = '';
            if(!filterWrapper.isEmpty()){
                whereClause = Package2Interface.getWhereClause(filterWrapper);
                if(!String.isBlank(whereClause)){
                    queryString = queryString + ' WHERE ' + whereClause;
                }
            }
            queryString = queryString + 'ORDER BY ' + String.escapeSingleQuotes(sortedBy) + ' ' + String.escapeSingleQuotes(sortDirection);queryString = queryString + ' LIMIT ' + String.escapeSingleQuotes(lmaLicensesLimit) + ' OFFSET ' + String.escapeSingleQuotes(lmaLicensesOffset);
            if(Type.forName('sfLma__Package_Version__c') != null){
                SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE, Database.query(queryString));
                List<ObjectWrappers.LMALicenseWrapper> licensesList = new List<ObjectWrappers.LMALicenseWrapper>();
                for (sObject o : decision.getRecords()) {
                    ObjectWrappers.LMALicenseWrapper license = new ObjectWrappers.LMALicenseWrapper();
                    license.id = URL.getSalesforceBaseUrl().toExternalForm() + '/' + o.get('Id');license.lastModifiedDate = o.get('LastModifiedDate');license.name = o.get('Name');
                    if(o.get('sfLma__Account__c') != null){
                        license.accountId = URL.getSalesforceBaseUrl().toExternalForm() + '/' + o.get('sfLma__Account__c');license.accountName = o.getSObject('sfLma__Account__r').get('Name');
                    }
                    if(o.get('sfLma__Contact__c') != null){license.contactId = URL.getSalesforceBaseUrl().toExternalForm() + '/' + o.get('sfLma__Contact__c');license.contactName = o.getSObject('sfLma__Contact__r').get('Name');}
                    license.installDate = o.get('sfLma__Install_Date__c');
                    if(o.get('sfLma__Lead__c') != null){
                        license.leadId = URL.getSalesforceBaseUrl().toExternalForm() + '/' + o.get('sfLma__Lead__c');license.leadName = o.getSObject('sfLma__Lead__r').get('Name');license.leadSource = o.getSObject('sfLma__Lead__r').get('LeadSource');
                        if(o.getSObject('sfLma__Lead__r').get('Email') != null){license.leadEmail = o.getSObject('sfLma__Lead__r').get('Email');}
                    }
                    if(o.get('sfLma__Expiration__c') != null){license.lmaExpirationDate = o.get('sfLma__Expiration__c');}if(o.get('sfLma__Seats__c') != null){license.seats = o.get('sfLma__Seats__c');}if(o.get('sfLma__Used_Licenses__c') != null){license.usedLicenses = o.get('sfLma__Used_Licenses__c');}
                    license.licensedSeats = o.get('sfLma__Licensed_Seats__c');license.licenseStatus = o.get('sfLma__License_Status__c');license.licenseType = o.get('sfLma__License_Type__c');licensesList.add(license);
                }
                return licensesList;
            }
            return null;
        } catch(Exception e){throw new AuraHandledException('We could not retrieve package version\'s licenses');}
    }

    @AuraEnabled(continuation=true)
    public static List<ObjectWrappers.LMALicenseHistoryWrapper> getLmaTimeline(String licenseId){
        String[] dataTypeList = new String[]{ 'Text', 'DynamicEnum', 'DateOnly', 'Double' };
        String[] fieldList = new String[]{ 'Created', 'sfLma__Package_Version__c', 'sfLma__Status__c', 'sfLma__Expiration__c', 'sfLma__Seats__c' };
        String historyQuery = 'SELECT Id, Field, NewValue, OldValue, CreatedDate FROM sfLma__License__History WHERE ParentId = :licenseId and DataType IN :dataTypeList AND Field IN :fieldList ORDER BY CreatedDate DESC LIMIT 50 OFFSET 0';
        
        List<ObjectWrappers.LMALicenseHistoryWrapper> historyList = new List<ObjectWrappers.LMALicenseHistoryWrapper>();
        if(Type.forName('sfLma__License__History') != null){
            List<sObject> history = Database.query(historyQuery);

            for (sObject o : history) {
                ObjectWrappers.LMALicenseHistoryWrapper item = new ObjectWrappers.LMALicenseHistoryWrapper();
                item.Id = o.get('Id');item.Field = o.get('Field');item.NewValue = o.get('NewValue');item.OldValue = o.get('OldValue');item.CreatedDate = o.get('CreatedDate');
                historyList.add(item);
            }
            return historyList;
        }
        return null;
    }

    @AuraEnabled(continuation=true)
    public static String modifyLicense(String licenseId, String expirationDate, String seats, String status){
        String updateLicense = Package2Interface.updateLicense(licenseId, expirationDate, seats, status);
        return updateLicense;
    }

    @AuraEnabled(continuation=true)
    public static String setPackage2Fields(List<ObjectWrappers.FilterWrapper> filterWrapper, String objectName, String objectId){
        String updateFields = Package2Interface.updatePackage2Fields(filterWrapper, objectName, objectId);
        return updateFields;
    }

    @AuraEnabled(cacheable=true)
    public static In_App_Prompt__mdt getPrompt(String prompt){
        return [ SELECT Title__c, Prompt_Popover_Location__c, Learn_More_Link__c, Description__c, Brand_Button_URL__c, Brand_Button_Label__c FROM In_App_Prompt__mdt WHERE DeveloperName = :prompt WITH SECURITY_ENFORCED LIMIT 1 ];
    }

    @AuraEnabled(cacheable=true)
    public static Organization getOrgDetails(){
        return [ SELECT Name, IsSandbox, InstanceName, OrganizationType, TrialExpirationDate, PrimaryContact FROM Organization WITH SECURITY_ENFORCED LIMIT 1 ];
    }

    @AuraEnabled(continuation=true)
    public static String createSignupTrial(String firstName, String lastName, String email, String userName, String company, String myDomain, String country, String preferredLanguage, String templateId, String edition, Integer trialDays, Boolean isSignupEmailSuppressed, Boolean shouldConnectToEnvHub){
        if(isSignupRequest() == true){
            return insertSignup(firstName, lastName, email, userName, company, myDomain, country, preferredLanguage, templateId, edition, trialDays, isSignupEmailSuppressed, shouldConnectToEnvHub);
        } else {throw new AuraHandledException('Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)');}
    }

    private static string insertSignup(String firstName, String lastName, String email, String userName, String company, String myDomain, String country, String preferredLanguage, String templateId, String edition, Integer trialDays, Boolean isSignupEmailSuppressed, Boolean shouldConnectToEnvHub){
        SObjectType sObjectType = Schema.getGlobalDescribe().get('SignupRequest');
        Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe(); 
        Map<String,Schema.SObjectField> fieldsMap = describeResult.fields.getMap(); 

        Boolean objectCrudCheck = sObjectType.getDescribe().isCreateable();
        SObject signupRequest = sObjectType.newSObject();
        
        if(objectCrudCheck == true){
            if(fieldsMap.get('FirstName').getDescribe().isCreateable()){signupRequest.put('FirstName', String.escapeSingleQuotes(firstName));}
            if(fieldsMap.get('LastName').getDescribe().isCreateable()){signupRequest.put('LastName', String.escapeSingleQuotes(lastName));}
            if(fieldsMap.get('SignupEmail').getDescribe().isCreateable()){signupRequest.put('SignupEmail', String.escapeSingleQuotes(email));}
            if(fieldsMap.get('Username').getDescribe().isCreateable()){signupRequest.put('Username', String.escapeSingleQuotes(userName));}
            if(fieldsMap.get('Company').getDescribe().isCreateable()){signupRequest.put('Company', String.escapeSingleQuotes(company));}
            if(fieldsMap.get('Subdomain').getDescribe().isCreateable() && myDomain != null){signupRequest.put('Subdomain', String.escapeSingleQuotes(myDomain));}
            if(fieldsMap.get('Country').getDescribe().isCreateable() && country != null){signupRequest.put('Country', String.escapeSingleQuotes(country));}
            if(fieldsMap.get('PreferredLanguage').getDescribe().isCreateable() && preferredLanguage != null){signupRequest.put('PreferredLanguage', String.escapeSingleQuotes(preferredLanguage));}
            if(fieldsMap.get('TemplateId').getDescribe().isCreateable()){if(String.isNotBlank(templateId)){signupRequest.put('TemplateId', String.escapeSingleQuotes(templateId));}}
            if(fieldsMap.get('Edition').getDescribe().isCreateable()){if(String.isNotBlank(edition)){signupRequest.put('Edition', String.escapeSingleQuotes(edition));}}
            if(fieldsMap.get('TrialDays').getDescribe().isCreateable() && trialDays != null){signupRequest.put('TrialDays', Integer.valueOf(trialDays));}
            if(fieldsMap.get('IsSignupEmailSuppressed').getDescribe().isCreateable()){signupRequest.put('IsSignupEmailSuppressed', Boolean.valueOf(isSignupEmailSuppressed));}
            if(fieldsMap.get('ShouldConnectToEnvHub').getDescribe().isCreateable()){signupRequest.put('ShouldConnectToEnvHub', Boolean.valueOf(shouldConnectToEnvHub));}
            insert signupRequest; return String.valueOf(signupRequest);
        } else {return 'Error';}
    }

    @AuraEnabled(cacheable=true)
    public static boolean isSignupRequest() {
        return (Type.forName('SignupRequest') != null);
    }
}