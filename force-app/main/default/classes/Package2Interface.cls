/*******************************************************************************************
* @Name         Package2Interface 
* @Date         11/10/2020
* @Description  Interface Class for making thats make all call out for 2GP Visualizer application.  
*******************************************************************************************/
@NamespaceAccessible
public with sharing class Package2Interface { // NOPMD
    
	/**************************************************************************************
	* @Description  Get the list of packages using tooling API. 
	**************************************************************************************/     
    public static List<ObjectWrappers.PackageWrapper> getPackage2(String sortDirection) {
        List<ObjectWrappers.PackageWrapper> packages = new List<ObjectWrappers.PackageWrapper>();string s = 'Select Id, ContainerOptions, Description, Name, NamespacePrefix, SubscriberPackageID, isOrgDependent, PackageErrorUsername, WasTransferred, CreatedBy.Name, CreatedDate, AppAnalyticsEnabled, DataCloudPackage FROM Package2 WHERE IsDeprecated = false ORDER BY Name ' + String.escapeSingleQuotes(sortDirection) + ' LIMIT 500';List<Object> records = submitQuery(s); 
        for(Object record : records) {ObjectWrappers.PackageWrapper p = (ObjectWrappers.PackageWrapper)JSON.deserialize(JSON.serialize(record), ObjectWrappers.PackageWrapper.class);if(p.CreatedBy != null){p.owner = p.CreatedBy.name;} p.isOrgDependent = p.isOrgDependent == true; packages.add(p); } return packages;
    }

    public static Boolean verifyUnlockedPackageInstalled(){string s = 'SELECT Id, SubscriberPackageId, SubscriberPackage.NamespacePrefix, SubscriberPackage.Name FROM InstalledSubscriberPackage WHERE SubscriberPackageId = \'033Rh000000AYI9IAO\''; List<Object> record = submitQuery(s); if(record.size() == 1){ return true; } return false;}

    /**************************************************************************************
	* @Description  Get the list of 1GP packages using tooling API. 
	**************************************************************************************/     
    public static List<ObjectWrappers.PackageWrapper1> getPackage1(String sortDirection) {
        List<ObjectWrappers.PackageWrapper1> packages = new List<ObjectWrappers.PackageWrapper1>(); string s = 'SELECT Id, Name, NamespacePrefix, PackageCategory, SystemModstamp FROM MetadataPackage WHERE PackageCategory = \'Package\' ORDER BY Name ' + String.escapeSingleQuotes(sortDirection) + ' LIMIT 500';List<Object> records = submitQuery(s); for(Object record:records) { ObjectWrappers.PackageWrapper1 p = (ObjectWrappers.PackageWrapper1)JSON.deserialize(JSON.serialize(record), ObjectWrappers.PackageWrapper1.class); packages.add(p); } return packages;
    }

    /**************************************************************************************
	* @Description	Get the list of 1GP package versions for the given package and additional filters passed through FilterWrapper  
	**************************************************************************************/     
    public static List<ObjectWrappers.Package1VersionWrapper> getPackage1Versions(list<ObjectWrappers.FilterWrapper> filterWrapperList, String minMajorVersion, String maxMajorVersion, String minMinorVersion, String maxMinorVersion, String sortedBy, String sortDirection, String versionLimit, String versionOffset) {
        List<ObjectWrappers.Package1VersionWrapper> packageVersions = new List<ObjectWrappers.Package1VersionWrapper>(); 
        String queryString = 'SELECT BuildNumber, Id, IsDeprecated, MajorVersion, MetadataPackageId, MinorVersion,Name, PatchVersion, ReleaseState, SystemModstamp FROM MetadataPackageVersion WHERE IsDeprecated = false ';String whereClause = '';
        if(!filterWrapperList.isEmpty()){whereClause = getWhereClause(filterWrapperList); if(!String.isBlank(whereClause)){ queryString = queryString + ' AND ' + whereClause; } }if(minMajorVersion != null && maxMajorVersion != null && minMinorVersion != null && maxMinorVersion != null){ String versionClause = getVersionRangeWhereClause(minMajorVersion, maxMajorVersion, minMinorVersion, maxMinorVersion); queryString = queryString + versionClause; }if (sortedBy != null){ if(sortedBy == 'versionNumber'){ queryString = queryString + ' ORDER BY MajorVersion ' + sortDirection + ', MinorVersion ' + sortDirection + ', PatchVersion ' + sortDirection + ', BuildNumber ' + sortDirection; } }queryString = queryString + ' LIMIT ' + String.escapeSingleQuotes(versionLimit) + ' OFFSET ' + String.escapeSingleQuotes(versionOffset);List<Object> records = submitQuery(queryString); for(Object record : records) {ObjectWrappers.Package1VersionWrapper p = (ObjectWrappers.Package1VersionWrapper)JSON.deserialize(JSON.serialize(record), ObjectWrappers.Package1VersionWrapper.class);p.versionNumber = p.majorVersion + '.' + p.minorVersion + '.' + p.patchVersion + '-' + p.buildNumber; p.id = p.id; packageVersions.add(p);}return packageVersions;
    }

    public static List<ObjectWrappers.SignupRequestWrapper> getSignUpRequests(list<ObjectWrappers.FilterWrapper> filterWrapper, String sortedBy, String sortDirection, String signUpLimit, String signUpOffset){
        List<ObjectWrappers.SignupRequestWrapper> signUpList = new List<ObjectWrappers.SignupRequestWrapper>();
        String queryString = 'SELECT Company, Country, CreatedBy.Name, CreatedDate, CreatedOrgId, CreatedOrgInstance, Edition, ErrorCode, FirstName, Id, IsSignupEmailSuppressed, LastModifiedById, LastModifiedDate, LastName, OwnerId, PreferredLanguage, ResolvedTemplateId, ShouldConnectToEnvHub, SignupEmail, SignupSource, Status,Subdomain, SystemModstamp, TemplateId, TrialDays, TrialSourceOrgId, Username FROM SignupRequest  ';String whereClause = '';
        if(!filterWrapper.isEmpty()){whereClause = getWhereClause(filterWrapper);if(!String.isBlank(whereClause)){ queryString = queryString + ' WHERE ' + whereClause; } } queryString = queryString + 'ORDER BY ' + sortedBy + ' ' + sortDirection; queryString = queryString + ' LIMIT ' + String.escapeSingleQuotes(signUplimit) + ' OFFSET ' + String.escapeSingleQuotes(signUpOffset);if (Type.forName('SignupRequest')!= null) {SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE, Database.query(queryString));for (sObject o : decision.getRecords()) {ObjectWrappers.SignupRequestWrapper sw = (ObjectWrappers.SignupRequestWrapper)JSON.deserialize(JSON.serialize(o), ObjectWrappers.SignupRequestWrapper.class); if(sw.CreatedBy != null){sw.owner = sw.CreatedBy.name; } signUpList.add(sw);}} return signUpList;
    }

	/**************************************************************************************
	* @Description  Get the list of packages subscriber by quering PackageSubscriber object. 
	**************************************************************************************/    
    public static List<ObjectWrappers.PackageSubscriberWrapper> get2GPPackageSubscriberList(List<ObjectWrappers.FilterWrapper> filterWrapperList, String sortedBy, String sortDirection, String subscriberLimit, String subscriberOffset){
        List<ObjectWrappers.PackageSubscriberWrapper> packageSubList = new List<ObjectWrappers.PackageSubscriberWrapper>();

        String queryString = 'SELECT Id, MetadataPackageId, MetadataPackageVersionId, OrgKey, OrgName, OrgType, OrgStatus, InstanceName, ParentOrg, SystemModstamp FROM PackageSubscriber '; String whereClause = '';
        if(!filterWrapperList.isEmpty()){ whereClause = getWhereClause(filterWrapperList); if(!String.isBlank(whereClause)){ queryString = queryString + ' WHERE ' + whereClause; }}       queryString = queryString + 'ORDER BY ' + sortedBy + ' ' + sortDirection; queryString = queryString + ' LIMIT ' + String.escapeSingleQuotes(subscriberLimit) + ' OFFSET ' + String.escapeSingleQuotes(subscriberOffset);
        if (Type.forName('PackageSubscriber')!= null) {SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE,Database.query(queryString));for (sObject o : decision.getRecords()) { ObjectWrappers.PackageSubscriberWrapper ps = (ObjectWrappers.PackageSubscriberWrapper)JSON.deserialize(JSON.serialize(o), ObjectWrappers.PackageSubscriberWrapper.class); packageSubList.add(ps);}}return packageSubList;
    }
    
	/**************************************************************************************
	* @Description  Get the list of packages subscriber group by provided field for displaying chart in package subscriber componenet.
					Additional filters can be handled by filter class 
	**************************************************************************************/    
    public static List<AggregateResult> getSubscriberChartData(list<ObjectWrappers.FilterWrapper> filterWrapperList, string groupByField){
        String queryString = 'SELECT Count(Id), '+ String.escapeSingleQuotes(groupByField) +' FROM PackageSubscriber ';String whereClause = '';
        if(!filterWrapperList.isEmpty()){whereClause = getWhereClause(filterWrapperList);if(!String.isBlank(whereClause)){queryString = queryString + ' WHERE '+ whereClause;}}queryString = queryString + ' GROUP BY '+ String.escapeSingleQuotes(groupByField); queryString = queryString + ' ORDER BY Count(Id) DESC LIMIT 6';
 		List<AggregateResult> subChartData = new List<AggregateResult>();if (Type.forName('PackageSubscriber')!= null) { subChartData = Database.query(queryString);} return subChartData; 
    }

    /**************************************************************************************
	* @Description  Get the list of packages subscriber group by provided field for displaying chart in lma data table componenet.
					Additional filters can be handled by filter class 
	**************************************************************************************/    
    public static List<AggregateResult> getLmaChartData(List<ObjectWrappers.FilterWrapper> filterWrapperList, string groupByField){String queryString = 'SELECT Count(Id), '+ String.escapeSingleQuotes(groupByField) +' FROM sfLma__License__c '; String whereClause = '';if(!filterWrapperList.isEmpty()){ whereClause = getWhereClause(filterWrapperList); if(!String.isBlank(whereClause)){ queryString = queryString + ' WHERE '+ whereClause; }}queryString = queryString + ' GROUP BY '+ String.escapeSingleQuotes(groupByField); queryString = queryString + ' ORDER BY Count(Id) DESC LIMIT 6';List<AggregateResult> lmaChartData = new list<AggregateResult>(); if (Type.forName('sfLma__License__c')!= null) { lmaChartData = Database.query(queryString); } return lmaChartData;} 

    public static List<AggregateResult> getPackagePushJobChartData(List<ObjectWrappers.FilterWrapper> filterWrapperList, string groupByField){String queryString = 'SELECT Count(Id), '+ String.escapeSingleQuotes(groupByField) +' FROM PackagePushJob '; String whereClause = '';if(!filterWrapperList.isEmpty()){ whereClause = getWhereClause(filterWrapperList); if(!String.isBlank(whereClause)){ queryString = queryString + ' WHERE '+ whereClause; }}queryString = queryString + ' GROUP BY '+ String.escapeSingleQuotes(groupByField); queryString = queryString + ' ORDER BY Count(Id) DESC LIMIT 6';List<AggregateResult> chartData = new list<AggregateResult>();if (Type.forName('PackagePushJob')!= null) { chartData = Database.query(queryString); } return chartData;}

	/**************************************************************************************
	* @Description	Get the list of package versions for the given package and additional filters passed through FilterWrapper  
	**************************************************************************************/     
    public static List<ObjectWrappers.PackageVersionWrapper> getPackage2Versions(list<ObjectWrappers.FilterWrapper> filterWrapperList, String minMajorVersion, String maxMajorVersion, String minMinorVersion, String maxMinorVersion, String sortedBy, String sortDirection, String versionLimit, String versionOffset) {
        List<ObjectWrappers.PackageVersionWrapper> packageVersions = new List<ObjectWrappers.PackageVersionWrapper>(); 
        String queryString = 'SELECT Id, Branch, Description, IsPasswordProtected, IsReleased, MajorVersion, MinorVersion, PatchVersion, BuildNumber, Tag, Name, Package2Id, SubscriberPackageVersionId, AncestorId, ValidationSkipped, BuildDurationInSeconds, HasPassedCodeCoverageCheck, HasMetadataRemoved, ReleaseVersion, Language, CreatedBy.Name, CreatedDate, ValidatedAsync FROM Package2Version WHERE IsDeprecated = false '; String whereClause = '';
        if(!filterWrapperList.isEmpty()){whereClause = getWhereClause(filterWrapperList); if(!String.isBlank(whereClause)){ queryString = queryString + ' AND ' + whereClause;}}
        if(minMajorVersion != null && maxMajorVersion != null && minMinorVersion != null && maxMinorVersion != null){ String versionClause = getVersionRangeWhereClause(minMajorVersion, maxMajorVersion, minMinorVersion, maxMinorVersion); queryString = queryString + versionClause;}
        if (sortedBy != null){ if(sortedBy == 'versionNumber'){ queryString = queryString + ' ORDER BY MajorVersion ' + sortDirection + ', MinorVersion ' + sortDirection + ', PatchVersion ' + sortDirection + ', BuildNumber ' + sortDirection;} else { queryString = queryString + ' ORDER BY ' + sortedBy + ' ' + sortDirection; }}queryString = queryString + ' LIMIT ' + String.escapeSingleQuotes(versionLimit) + ' OFFSET ' + String.escapeSingleQuotes(versionOffset);List<Object> records = submitQuery(queryString); 
        for(Object record : records) {ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper)JSON.deserialize(JSON.serialize(record), ObjectWrappers.PackageVersionWrapper.class); p.versionNumber = p.majorVersion + '.' + p.minorVersion + '.' + p.patchVersion + '-' + p.buildNumber;if(p.CreatedBy != null){ p.owner = p.CreatedBy.name; } p.id = p.id; p.buildDurationInSeconds = p.buildDurationInSeconds; p.releaseVersion = p.releaseVersion; p.hasPassedCodeCoverageCheck = p.hasPassedCodeCoverageCheck == true; p.isDeprecated = p.isDeprecated == true; p.isPasswordProtected = p.isPasswordProtected == true; p.isReleased = p.isReleased == true; p.validationSkipped = p.validationSkipped == true; p.hasMetadataRemoved = p.hasMetadataRemoved == true; if (!String.isBlank(p.subscriberPackageVersionId)) { p.installUrl = 'https://login.salesforce.com/packaging/installPackage.apexp?p0=' + p.subscriberPackageVersionId; } packageVersions.add(p);} return packageVersions;
    }

    public static List<String> getLatestPackageVersionsList(String packageId, String versionLimit){String queryString = 'SELECT SubscriberPackageVersionId FROM Package2Version WHERE IsDeprecated = false AND IsReleased = true AND Package2Id = '; queryString = queryString + '\'' + String.escapeSingleQuotes(packageId) + '\'' + ' ORDER BY CreatedDate DESC LIMIT ' + String.escapeSingleQuotes(versionLimit);List<Object> records = submitQuery(queryString); List<String> versions = new List<String>();for(Object record : records) { ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper)JSON.deserialize(JSON.serialize(record), ObjectWrappers.PackageVersionWrapper.class); versions.add(p.SubscriberPackageVersionId);} return versions;}

	/**************************************************************************************
	* @Description	Invoke the tooling API query passed from parent menthods like Package details, package version etc..  
	**************************************************************************************/ 
    public static List<Object> submitQuery(String queryString) {List<Object> records = new List<Map<String,Object>>();HTTPRequest req = new HTTPRequest(); req.setEndpoint(getBaseURL('tooling') + 'query?q=' + EncodingUtil.urlEncode(queryString, 'UTF-8')); req.setMethod('GET'); req.setHeader('Authorization', 'Bearer ' + getSessionId()); req.setHeader('Content-Type', 'application/json');Http h = new Http(); HttpResponse res = h.send(req);if (res.getStatusCode() == 200) { String result = res.getBody(); Map<String, Object> m = (Map<String, Object>)JSON.deserializeUntyped(result); if (m.containsKey('records')) { records = (List<Object>) m.get('records'); }} if (res.getStatusCode() == 401) { String result = res.getBody(); } return records;}

	/**************************************************************************************
	* @Description Method for getting the visualforce session id inorder to invoke tooling API  
	**************************************************************************************/ 
    @NamespaceAccessible
    public static string getSessionId() {Pagereference sidPage = Page.SessionCreator; if(Test.isRunningTest()){ return 'we can not run getContent in test class';} else { Map<String,Object> sidJSON = (Map<String,Object>)JSON.deserializeUntyped(sidPage.getContent().toString()); String sessionID = (String)sidJSON.get('sessionId'); return sessionID;}}

	/**************************************************************************************
	* @Description	Method for getting the current org base URL for tooling API  
	**************************************************************************************/ 
    @NamespaceAccessible
    public static string getBaseURL(String apiType) {String baseURL = URL.getSalesforceBaseUrl().toExternalForm() + '/services/data/v61.0/' + String.escapeSingleQuotes(apiType) + '/';return baseURL;}
    
	/**************************************************************************************
	* @Description	Method that build where cloud. We are using escapeSingleQuotes in this method.
	**************************************************************************************/ 
	@TestVisible    
    public static string getWhereClause(list<ObjectWrappers.FilterWrapper> FilterWrapperList){
        string whereClause = '';
        for(ObjectWrappers.FilterWrapper fw : FilterWrapperList){
            string fName = String.escapeSingleQuotes(fw.fieldName); string value = fw.value;
            if(!String.isBlank(fName) && !String.isBlank(value)){ if(!String.isBlank(whereClause)){whereClause = whereClause + ' AND '; } if('STRING'.equals(fw.dataType)){whereClause = whereClause + ' ' + fName + '=' + '\'' + String.escapeSingleQuotes(value) + '\'';}  else if ('LIST'.equals(fw.dataType)){whereClause = whereClause + ' ' + fName + ' IN ' + '('+ parseListValues(String.escapeSingleQuotes(value)) + ') '; } else if ('SEARCH'.equals(fw.dataType)){whereClause = whereClause + ' ' + fName + ' LIKE ' + '\'%' + String.escapeSingleQuotes(value) + '%\'';} else if('BOOLEAN'.equals(fw.dataType)){whereClause = whereClause + ' ' + fName + '=' + String.escapeSingleQuotes(value);} else if('LESSOREQUAL'.equals(fw.dataType)){whereClause = whereClause + ' ' + fName + ' <= ' +  String.escapeSingleQuotes(value);} else if('GREATEROREQUAL'.equals(fw.dataType)){whereClause = whereClause + ' ' + fName + ' >= ' + String.escapeSingleQuotes(value);} else {whereClause = whereClause + ' ' + fName + '=' + String.escapeSingleQuotes(value);} }
        } return whereClause;
    }

    private static string getVersionRangeWhereClause(String minMajorVersion, String maxMajorVersion, String minMinorVersion, String maxMinorVersion){
        string versionClause = ' AND ((MajorVersion = ' + String.escapeSingleQuotes(minMajorVersion) + ' AND MinorVersion >= ' + String.escapeSingleQuotes(minMinorVersion) + ') OR (MajorVersion > ' + String.escapeSingleQuotes(minMajorVersion) + ' )) AND ((MajorVersion = ' + String.escapeSingleQuotes(maxMajorVersion) + ' AND MinorVersion <= ' + String.escapeSingleQuotes(maxMinorVersion) + ') OR (MajorVersion < ' + String.escapeSingleQuotes(maxMajorVersion) + ' ))'; return versionClause;
    }

    public static String getPackageVersionCodeCoverage(String subscriberPackageVersionId){
        string queryString = 'SELECT id, SubscriberPackageVersionId, CodeCoverage FROM Package2Version WHERE SubscriberPackageVersionId = \'' + String.escapeSingleQuotes(subscriberPackageVersionId)  + '\' LIMIT 1'; String codeCoverage;
        List<Object> records = submitQuery(queryString);
        for(Object record:records) { ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper)JSON.deserialize(JSON.serialize(record), ObjectWrappers.PackageVersionWrapper.class);
            try { codeCoverage = p.codeCoverage.apexCodeCoveragePercentage;} catch(Exception e){ codeCoverage = '-1'; } } return codeCoverage;
    }

    public static Boolean getIsSecurityReviewed(String subscriberPackageVersionId){
        string queryString = 'SELECT Id, IsSecurityReviewed FROM SubscriberPackageVersion WHERE Id = \'' + String.escapeSingleQuotes(subscriberPackageVersionId)  + '\' LIMIT 1'; Boolean isSecurityReviewApproved; List<Object> records = submitQuery(queryString);
        for(Object record:records) {
			ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper)JSON.deserialize(JSON.serialize(record), ObjectWrappers.PackageVersionWrapper.class);
            try { isSecurityReviewApproved = p.isSecurityReviewed;
            } catch(Exception e){ isSecurityReviewApproved = null; } } return isSecurityReviewApproved;
    }

	/**************************************************************************************
	* @Description	Private method that rebuild string for IN clause. 
    **************************************************************************************/
    @TestVisible     
    private static String parseListValues(string value){string retString='';if(!String.isBlank(value)){for(String str : value.split('~')){ if(!String.isBlank(str)){ retString = retString + '\'' + str + '\','; } }} if(!String.isBlank(retString)){ retString = retString.substring(0, retString.length()-1); } return retString;}

    public static String updateLicense(String licenseId, String expirationDate, String seats, String status){
        try {
            SObjectType sObjectType = Schema.getGlobalDescribe().get('sfLma__License__c'); Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe(); Map<String,Schema.SObjectField> fieldsMap = describeResult.fields.getMap(); Boolean objectCrudCheck = sObjectType.getDescribe().isUpdateable();
            if(objectCrudCheck == true){SObject lmaLicense = sObjectType.newSObject(); lmaLicense.put('id', licenseId);if(fieldsMap.get('sfLma__Status__c').getDescribe().isUpdateable() && status != null){lmaLicense.put('sfLma__Status__c', String.escapeSingleQuotes(status));}if(fieldsMap.get('sfLma__Expiration__c').getDescribe().isUpdateable()){if(expirationDate != null && expirationDate != ''){ lmaLicense.put('sfLma__Expiration__c', Date.valueOf(String.escapeSingleQuotes(expirationDate)));} else { lmaLicense.put('sfLma__Expiration__c', null);}}if(fieldsMap.get('sfLma__Seats__c').getDescribe().isUpdateable()){if(seats != null && seats != ''){lmaLicense.put('sfLma__Seats__c', Integer.valueOf(seats));} else {lmaLicense.put('sfLma__Seats__c', -1);}}update lmaLicense; return lmaLicense.id;
            }} catch (Exception e){ throw new AuraHandledException('Something went wrong!'); } return null;
    }

    public static String updatePackage2Fields(List<ObjectWrappers.FilterWrapper> filterWrapperList, String objectName, String objectId){
        try {
            String httpBody = '{';
            for(ObjectWrappers.FilterWrapper fw : filterWrapperList){ httpBody =  httpBody + '"' + fw.fieldName + '":"' + fw.value + '",'; }
            httpBody = httpBody.substring(0, httpBody.length()-1); httpBody = httpBody + '}';
            Http http = new Http(); HTTPRequest req = new HTTPRequest();req.setEndpoint(getBaseURL('tooling') + 'sobjects/' + String.escapeSingleQuotes(objectName) + '/' + String.escapeSingleQuotes(objectId) + '/');req.setMethod('PATCH'); req.setHeader('Authorization', 'Bearer ' + getSessionId()); req.setHeader('Content-Type', 'application/json;charset=UTF-8'); req.setHeader('Accept', 'application/json'); req.setBody(httpBody);
            HttpResponse res = http.send(req); if (res.getStatusCode() == 204) { return 'success'; } else { return res.getBody(); }
        } catch (Exception e){ throw new AuraHandledException('Something went wrong!'); }
    }

    public static String getEnvHubMemberId(String orgId){String queryString = 'SELECT Id, MemberEntity FROM EnvironmentHubMember WHERE MemberEntity = :orgId WITH SECURITY_ENFORCED LIMIT 1 '; sObject s = Database.query(queryString); return s.Id;}

    @AuraEnabled(cacheable=true)
    public static boolean isAccount(){ return (Type.forName('Account') != null); }
    
    @AuraEnabled(cacheable=true)
    public static boolean isContact(){ return (Type.forName('Contact') != null); }
    
    @AuraEnabled(cacheable=true)
    public static boolean isLead(){ return (Type.forName('Lead') != null); }
    
    @AuraEnabled(cacheable=true)
    public static boolean isOpportunity(){ return (Type.forName('Opportunity') != null); }
    
    @AuraEnabled(cacheable=true)
    public static boolean isCampaign(){ return (Type.forName('Campaign') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isCase(){ return (Type.forName('Case') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isTask(){ return (Type.forName('Task') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isEvent(){ return (Type.forName('Event') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isUser(){ return (Type.forName('User') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isOrder(){ return (Type.forName('Order') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isAsset(){ return (Type.forName('Asset') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isContract(){ return (Type.forName('Contract') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isPricebook2(){ return (Type.forName('Pricebook2') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isProduct2(){ return (Type.forName('Product2') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isCampaignMember(){ return (Type.forName('CampaignMember') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isActiveScratchOrg(){ return (Type.forName('ActiveScratchOrg') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isRecommendation(){ return (Type.forName('Recommendation') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isPackageVersion(){ return (Type.forName('sfLma__Package_Version__c') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isPackage(){ return (Type.forName('sfLma__Package__c') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isLicense(){ return (Type.forName('sfLma__License__c') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isContentVersion(){ return (Type.forName('ContentVersion') != null); }

    @AuraEnabled(cacheable=true)
    public static boolean isEnvironmentHubMember(){ return (Type.forName('EnvironmentHubMember') != null); }
}