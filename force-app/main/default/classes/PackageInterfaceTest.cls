/*******************************************************************************************
* @Name         PackageInterfaceTest 
* @Date         11/10/2020
* @Description  All the test classes for 2GP Visualizer application.  
*******************************************************************************************/
@isTest
private class PackageInterfaceTest { 
    
	/**************************************************************************************
	* @Description  Test class for 2GP Package Retrice Logic.
	**************************************************************************************/    
    @isTest public static void testPackage2() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
        list<ObjectWrappers.PackageWrapper> Package2List = PackageVisualizerCtrl.get2GPPackageList('DESC');
        system.assertEquals(1, Package2List.size());
        Test.stopTest(); 
    }

    /**************************************************************************************
	* @Description  Test class for 1GP Package Retrice Logic.
	**************************************************************************************/    
    @isTest public static void testPackage1() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
        list<ObjectWrappers.PackageWrapper1> Package1List = PackageVisualizerCtrl.get1GPPackageList('DESC');
        system.assertEquals(0, Package1List.size());
        Test.stopTest(); 
    }

	/**************************************************************************************
	* @Description  Test class for 2GP Package version Retrice Logic.
	**************************************************************************************/     
    @isTest public static void testPackage2Version() { 
        
        TEST.startTest();
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('Package2Id', '0Ho000000000000AAA', 'STRING');
        //ObjectWrappers.FilterVersionRangeWrapper fvrw = new ObjectWrappers.FilterVersionRangeWrapper();
        //fvrw.applyRangeFilter = true;
        string minMajorVersion = '1';
        string maxMajorVersion = '0';
        string minMinorVersion = '5';
        string maxMinorVersion = '0';
        list<ObjectWrappers.PackageVersionWrapper> Package2VersionList = PackageVisualizerCtrl.get2GPPackageVersionList(fltList, minMajorVersion, maxMajorVersion, minMinorVersion, maxMinorVersion, 'MajorVersion', 'asc','10','10');
        system.assertEquals(1, Package2VersionList.size());
        TEST.stopTest();
    }

    /**************************************************************************************
	* @Description  Test class for 1GP Package version Retrice Logic.
	**************************************************************************************/     
    @isTest public static void testPackage1Version() { 
        
        TEST.startTest();
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('Package1Id', '0Ho000000000000AAA', 'STRING');
        //ObjectWrappers.FilterVersionRangeWrapper fvrw = new ObjectWrappers.FilterVersionRangeWrapper();
        //fvrw.applyRangeFilter = true;
        string minMajorVersion = '1';
        string maxMajorVersion = '0';
        string minMinorVersion = '5';
        string maxMinorVersion = '0';
        list<ObjectWrappers.Package1VersionWrapper> Package1VersionList = PackageVisualizerCtrl.get1GPPackageVersionList(fltList, minMajorVersion, maxMajorVersion, minMinorVersion, maxMinorVersion, 'MajorVersion', 'asc','10','10');
        system.assertEquals(0, Package1VersionList.size());
        TEST.stopTest();
    }


	/**************************************************************************************
	* @Description  Test class for Package Subscriber Retrive Logic.
	**************************************************************************************/     
    @isTest public static void testPackage2SubscriberList() {
        TEST.startTest();
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('MetadataPackageId', '0Ho000000000000AAA', 'STRING'); 
        List<ObjectWrappers.PackageSubscriberWrapper> p2s = PackageVisualizerCtrl.get2GPPackageVersionSubscriberList(fltList, 'OrgName', 'asc','10','10'); 

        system.assertNotEquals(null,p2s.size());
        /*system.assertEquals('00F000000000000',p2s[0].id);
        system.assertEquals('i',p2s[0].installedStatus);
        system.assertEquals('NA256',p2s[0].instanceName);
        system.assertEquals('033000000000000',p2s[0].metadataPackageId);
        system.assertEquals('00D000000000000',p2s[0].orgKey);
        system.assertEquals('NoOrg',p2s[0].orgName);
        system.assertEquals('Demo',p2s[0].orgStatus);
        system.assertEquals('Production',p2s[0].orgType);
        system.assertEquals('',p2s[0].parentOrg);
		*/
        TEST.stopTest();
    } 
    
	/**************************************************************************************
	* @Description  Test class for Package Subscriber Chart Data Retrive Logic.
	**************************************************************************************/     
    @isTest public static void testGetSubscriberChartData() {
   		Test.startTest();
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('MetadataPackageId', '0Ho000000000000AAA', 'STRING'); 
        List<AggregateResult> chartData = PackageVisualizerCtrl.getSubscriberChartData(fltList, 'OrgType'); 
        system.assertNotEquals(null,chartData);
        Test.stopTest();
    }    

    
    /**************************************************************************************
	* @Description  Test class for LMA Subscriber Chart Data Retrive Logic.
	**************************************************************************************/  
      
    @isTest public static void testLmaChartData() {
   		Test.startTest();
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('sfLma__Package_Version__c', '0Ho000000000000AAA', 'STRING'); 
        List<AggregateResult> chartData = PackageVisualizerCtrl.getLmaChartData(fltList, 'sfLma__Status__c'); 
        system.assertNotEquals(null,chartData);
        Test.stopTest();
    }
    
    @isTest public static void testPackagePushJobChartData() {
        Test.startTest();
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('Status', '0DVRh00000003FdOAI', 'STRING'); 
        List<AggregateResult> chartData = PackageVisualizerCtrl.getPackagePushJobChartData(fltList, 'Status'); 
        system.assertNotEquals(null,chartData);
        Test.stopTest();
    }
    
	/**************************************************************************************
	* @Description  Test class for Where Clouse use Cases Logic.
	**************************************************************************************/     
    @isTest public static void testGetWhereClause(){
        List<ObjectWrappers.FilterWrapper> fltList = new List<ObjectWrappers.FilterWrapper>();
        fltList.add(createFilterObject('Id', 'Value','STRING'));
        fltList.add(createFilterObject('Id', 'Production~Demo~Trial','LIST'));
        fltList.add(createFilterObject('Id', 'Value','SEARCH'));
        fltList.add(createFilterObject('Id', 'Value','BOOLEAN'));
        fltList.add(createFilterObject('Id', 'Value','ID'));
        fltList.add(createFilterObject('Id', '10','LESSOREQUAL'));
        fltList.add(createFilterObject('Id', '100','GREATEROREQUAL'));
        
        Test.StartTest();
        string whereClouse = Package2Interface.getWhereClause(fltList);
        system.assertNotEquals(null, whereClouse);
        TEST.stopTest();
    }  

	/**************************************************************************************
	* @Description  Test class for Where Clouse use Cases Logic.
	**************************************************************************************/     
    /*
    @isTest public static void testGetPackageSliderRanges(){
        Test.StartTest();
        List<Object> data = PackageVisualizerCtrl.getPackageSliderRanges('0Ho000000000000AAA'); 
        system.assertNotEquals(null,data);        
        TEST.stopTest();
    }*/    

	/**************************************************************************************
	* @Description  Test class for Object Wrapper Class
	**************************************************************************************/     
    @isTest public static void testObjectWrappers(){
        Test.StartTest();
 		List<ObjectWrappers.FilterWrapper> fltList = new List<ObjectWrappers.FilterWrapper>();
        fltList.add(createFilterObject('Id', 'Value','STRING'));
        system.assertNotEquals(null, fltList);
        
        ObjectWrappers.PackageCreator pc = new ObjectWrappers.PackageCreator();
        pc.name = 'TEST';
        
        ObjectWrappers.PackageWrapper pkg = new ObjectWrappers.PackageWrapper();
        pkg.containerOptions = 'TEST';
        pkg.packageErrorUsername = 'TEST';
        pkg.description = 'TEST';
        pkg.id = 'TEST';
        pkg.isDeprecated = true;
        pkg.name = 'TEST';
        pkg.namespacePrefix = 'TEST';
        pkg.subscriberPackageID = 'TEST';
        pkg.isOrgDependent = true;
        pkg.wasTransferred = false;
        pkg.appAnalyticsEnabled = false;
        pkg.dataCloudPackage = false;
        pkg.createdBy = pc;
        pkg.createdDate = System.now();
        pkg.owner = 'TEST';
        system.assertNotEquals(null, pkg);
        
        ObjectWrappers.CodeCoverage codecover = new ObjectWrappers.CodeCoverage();
        codecover.apexCodeCoveragePercentage = '100';
        
        ObjectWrappers.PackageVersionWrapper pkgVersion = new ObjectWrappers.PackageVersionWrapper();
        pkgVersion.id = 'TEST';
        pkgVersion.ancestorId = 'TEST';
        pkgVersion.package2Id = 'TEST';
        pkgVersion.name = 'TEST';
        pkgVersion.branch = 'TEST';
        pkgVersion.codeCoverage = codecover;
        pkgVersion.description = 'TEST';
        pkgVersion.hasPassedCodeCoverageCheck = true;
        pkgVersion.validationSkipped = true;
        pkgVersion.installKey = 'TEST';
        pkgVersion.isDeprecated = true;
        pkgVersion.isPasswordProtected = true;
        pkgVersion.isReleased = true;
        pkgVersion.majorVersion = 0;
        pkgVersion.minorVersion = 0;
        pkgVersion.patchVersion = 0;
        pkgVersion.buildNumber = 0;
        pkgVersion.versionNumber = 'TEST';
        pkgVersion.subscriberPackageVersionId = 'TEST';
        pkgVersion.installUrl = 'TEST';
        pkgVersion.tag = 'TEST';
        pkgVersion.owner = 'TEST';
        pkgVersion.createdDate = System.now();
        pkgVersion.createdBy = pc;
        pkgVersion.ReleaseVersion = 'TEST';
        pkgVersion.isSecurityReviewed = false;
        pkgVersion.BuildDurationInSeconds = 'TEST';
        pkgVersion.language = 'en';
        pkgVersion.validatedAsync = false;
        system.assertNotEquals(null, pkgVersion);
        
        ObjectWrappers.PackageSubscriberWrapper pkgSub = new ObjectWrappers.PackageSubscriberWrapper();
        pkgSub.id = 'TEST';
        pkgSub.installedStatus = 'TEST';
        pkgSub.instanceName = 'TEST';
        pkgSub.metadataPackageId = 'TEST';
        pkgSub.metadataPackageVersionId = 'TEST';
        pkgSub.orgKey = 'TEST';
        pkgSub.orgName = 'TEST';
        pkgSub.orgStatus = 'TEST';
        pkgSub.orgType = 'TEST';
        pkgSub.parentOrg = 'TEST';  
        system.assertNotEquals(null, pkgSub);
    
        
        ObjectWrappers.PackagePushRequestWrapper pprw = new ObjectWrappers.PackagePushRequestWrapper();
        pprw.Id = 'TEST';
        pprw.PackageVersionId = 'TEST';
        pprw.ScheduledStartTime = System.now();
        pprw.DurationSeconds = 1;
        pprw.EndTime = System.now();
        pprw.StartTime = System.now();
        pprw.Status = 'TEST';
        pprw.SystemModstamp = System.now();
            
        
        ObjectWrappers.PackagePushJobWrapper ppjw= new ObjectWrappers.PackagePushJobWrapper();
        ppjw.PackagePushRequestId = 'TEST';
        ppjw.SubscriberOrganizationKey = 'TEST';
        ppjw.attributes = new ObjectWrappers.ObjectAttributes();
        ppjw.DurationSeconds = 1;
        ppjw.EndTime = System.now();
        ppjw.StartTime = System.now();
        ppjw.Status = 'TEST';
        ppjw.SystemModstamp = System.now();
        ppjw.PackagePushErrors = new ObjectWrappers.PackagePushErrorsWrapper();
       
        ObjectWrappers.JobErrorsWrapper jew= new ObjectWrappers.JobErrorsWrapper();
        jew.ErrorTitle = 'TEST';
        jew.ErrorMessage = 'TEST';        
        
        ObjectWrappers.PackagePushErrorsWrapper ppew= new ObjectWrappers.PackagePushErrorsWrapper();
        ppew.records = new List<ObjectWrappers.JobErrorsWrapper>();  
        
        ObjectWrappers.ObjectAttributes oa= new ObjectWrappers.ObjectAttributes();
        oa.type = 'TEST';
        
        ObjectWrappers.PackagePushResult ppr = new ObjectWrappers.PackagePushResult();
        ppr.id = 'TEST';
        ppr.success = true;
        
        ObjectWrappers.MetadataPackageVersionWrapper mpvw = new ObjectWrappers.MetadataPackageVersionWrapper();
        mpvw.Id = 'TEST';
        mpvw.Name = 'TEST';
        mpvw.BuildNumber = 1;
        mpvw.IsDeprecated = true;
        mpvw.MajorVersion = 1;
        mpvw.MetadataPackageId = 'TEST';
        mpvw.MinorVersion = 1;
        mpvw.PatchVersion = 1;
        mpvw.ReleaseState = 'TEST';
        mpvw.SystemModstamp = System.now();
        
        ObjectWrappers.LMAVersionWrapper lvw = new ObjectWrappers.LMAVersionWrapper();
        lvw.createdDate = (Object) 'TEST';
        lvw.id = (Object) 'TEST';
        lvw.name = (Object) 'TEST';
        lvw.isBeta = (Object) 'TEST';
        lvw.lmaPackageId = (Object) 'TEST';
        lvw.lmaPackageName = (Object) 'TEST';
        lvw.releaseDate = (Object) 'TEST';
        lvw.packageVersionId = (Object) 'TEST';
        lvw.lmaVersionName = (Object) 'TEST';
        
        ObjectWrappers.LMALicenseWrapper llw= new ObjectWrappers.LMALicenseWrapper();
        llw.id = (Object) 'TEST';
        llw.lastModifiedDate = (Object) 'TEST';
        llw.name = (Object) 'TEST';
        llw.accountId = (Object) 'TEST';
        llw.accountName = (Object) 'TEST';
        llw.contactId = (Object) 'TEST';
        llw.contactName = (Object) 'TEST';
        llw.installDate = (Object) 'TEST';
        llw.leadId = (Object) 'TEST';
        llw.leadName = (Object) 'TEST';
        llw.licensedSeats = (Object) 'TEST';
        llw.licenseStatus = (Object) 'TEST';
        llw.licenseType = (Object) 'TEST';
        llw.leadSource = (Object) 'TEST';

        ObjectWrappers.LMAPackageWrapper lmapw= new ObjectWrappers.LMAPackageWrapper();
        lmapw.id = (Object) 'TEST';
        lmapw.packageSubsriberId = (Object) 'TEST';

        ObjectWrappers.LMALicenseHistoryWrapper llhw = new ObjectWrappers.LMALicenseHistoryWrapper();
        llhw.Id = (Object) 'TEST';
        llhw.Field = (Object) 'TEST';
        llhw.NewValue = (Object) 'TEST';
        llhw.OldValue = (Object) 'TEST';
        llhw.CreatedDate = (Object) 'TEST';

        ObjectWrappers.PackageWrapper1 pw1 = new ObjectWrappers.PackageWrapper1();
        pw1.id = 'TEST';
        pw1.name = 'TEST';
        pw1.namespacePrefix = 'TEST';
        pw1.packageCategory = 'TEST';
        pw1.systemModstamp = System.now();

        ObjectWrappers.Package1VersionWrapper pvw1 = new ObjectWrappers.Package1VersionWrapper();
        pvw1.id = 'TEST';
        pvw1.metadataPackageId = 'TEST';
        pvw1.name = 'TEST';
        pvw1.isDeprecated = true;
        pvw1.majorVersion = 1;
        pvw1.minorVersion = 1;
        pvw1.buildNumber = 1;
        pvw1.patchVersion = 1;
        pvw1.releaseState = 'TEST';
        pvw1.versionNumber = 'TEST';
        pvw1.systemModstamp = System.now();

        TEST.stopTest(); 
    }
    
	/**************************************************************************************
	* @Description  Test class for isLMA method
	**************************************************************************************/      
    @isTest public static void testisLMA(){
        TEST.startTest(); 
        Boolean isLMA = PackageVisualizerCtrl.isLMA();
        system.assertNotEquals(null, isLMA);
        TEST.stopTest(); 
    }
    
	/**************************************************************************************
	* @Description  Test class for getWelcomeMatAboutSteps method
	**************************************************************************************/    
    @isTest public static void testWelcomeMatController(){
    	TEST.startTest(); 
        List<About_Welcome_Mat_Step__mdt> steps = PackageVisualizerCtrl.getWelcomeMatAboutSteps();
        system.assertNotEquals(null, steps);
        TEST.stopTest(); 
    }  
    
	/**************************************************************************************
	* @Description  Test class for PackageVisualizerCtrl getResourcesMetadata method
	**************************************************************************************/    
    @isTest public static void testgetResourcesMetadata(){
    	TEST.startTest(); 
        List<Package_Visualizer_Resource__mdt> mdt = PackageVisualizerCtrl.getResourcesMetadata();
        system.assertNotEquals(null, mdt);
        TEST.stopTest(); 
    } 

    /**************************************************************************************
	* @Description  Test class for PackageVisualizerCtrl getAnnouncementsMetadata method
	**************************************************************************************/    
    @isTest public static void testgetAnnouncementsMetadata(){
    	TEST.startTest(); 
        List<Package_Visualizer_Announcement__mdt> mdt = PackageVisualizerCtrl.getAnnouncementsMetadata();
        system.assertNotEquals(null, mdt);
        TEST.stopTest(); 
    }    
    
	/**************************************************************************************
	* @Description  Test class for PackageVisualizerCtrl getAppAnalyticsRequests method
	**************************************************************************************/    
    @isTest public static void testgetAppAnalyticsRequests(){
    	TEST.startTest(); 
        List<AppAnalyticsQueryRequest> appRequest = PackageVisualizerCtrl.getAppAnalyticsRequests('0Ho000000000000AAA');
        system.assertNotEquals(null, appRequest);
        TEST.stopTest(); 
    }  
    
    @isTest public static void testgetAppAnalyticsRequestsNoPackage(){
    	TEST.startTest(); 
        List<AppAnalyticsQueryRequest> appRequest = PackageVisualizerCtrl.getAppAnalyticsRequests('');
        system.assertNotEquals(null, appRequest);
        TEST.stopTest(); 
    }

    /*
    @isTest public static void testgetUser(){
    	TEST.startTest(); 
        User user1 = PackageVisualizerCtrl.getUser('test@test.com');
        system.assertNotEquals(null, user1);
        TEST.stopTest(); 
    }

    @isTest public static void testgetUserName(){
    	TEST.startTest(); 
        User user1 = PackageVisualizerCtrl.getUser('0Ho000000000000AAA');        
        system.assertNotEquals(null, user1);
        TEST.stopTest(); 
    }
    */
	/**************************************************************************************
	* @Description  Test class for PackageVisualizerCtrl getAppAnalyticsRequests method
	**************************************************************************************/      
    @isTest public static void testInsertAppAnalyticsRequest(){
    	TEST.startTest(); 
        string data = PackageVisualizerCtrl.insertAppAnalyticsRequest('PackageUsageLog',  System.today(), System.today()-30, '0Ho000000000000AAA', '0Ho000000000000AAA', 'none','none');        
        system.assertNotEquals(null, data);
        TEST.stopTest(); 
    }

    @isTest public static void testInsertAppAnalyticsRequestWithFileTypes(){
    	TEST.startTest(); 
        string data = PackageVisualizerCtrl.insertAppAnalyticsRequest('PackageUsageLog',  System.today(), System.today()-30, '0Ho000000000000AAA', '0Ho000000000000AAA', 'csv','gzip');        
        system.assertNotEquals(null, data);
        TEST.stopTest(); 
    }
    
	/**************************************************************************************
	* @Description  Test class for PackageVisualizerCtrl getLMAVersion, getPackageVersionLicenses method
	**************************************************************************************/      
    @isTest public static void testLMATest(){
    	TEST.startTest(); 
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('Package2Id', '0Ho000000000000AAA', 'STRING');
        
        //ObjectWrappers.LMAVersionWrapper lvw = PackageVisualizerCtrl.getLMAVersion('0Ho000000000000AAA');
        //List<ObjectWrappers.LMALicenseWrapper> llw = PackageVisualizerCtrl.getPackageVersionLicenses(fltList, 'Name', 'Desc', '10', '10');
        //List<ObjectWrappers.LMALicenseHistoryWrapper> llhw = PackageVisualizerCtrl.getLmaTimeline('0Ho000000000000AAA');
        
        TEST.stopTest(); 
    }
    
	/**************************************************************************************
	* @Description  Test class for calculatePackageVersionCodeCoverage method
	**************************************************************************************/      
    @isTest public static void testCalculatePackageVersionCodeCoverage(){
    	TEST.startTest(); 
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
     	String codeCover = PackageVisualizerCtrl.calculatePackageVersionCodeCoverage('0Ho000000000000AAA');
        TEST.stopTest(); 
    }  

    /**************************************************************************************
	* @Description  Test class for calculatePackageVersionCodeCoverage method
	**************************************************************************************/      
    @isTest public static void testVerifySecurityReviewApproved(){
    	TEST.startTest(); 
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
     	Boolean secReviewCheck = PackageVisualizerCtrl.verifySecurityReviewApproved('0Ho000000000000AAA');
        TEST.stopTest(); 
    }
    
	/**************************************************************************************
	* @Description  Test class for getPrompt
	**************************************************************************************/      
    @isTest public static void testGetPrompt1(){
    	TEST.startTest(); 
        try{
     		PackageVisualizerCtrl.getPrompt('Test');
        }catch(Exception e){
            System.debug(e);
        }
        TEST.stopTest(); 
    }

    @isTest public static void testGetWalkthroughSteps(){
    	TEST.startTest(); 
        try{
     		PackageVisualizerCtrl.getWalkthroughSteps();
        }catch(Exception e){
            System.debug(e);
        }
        TEST.stopTest(); 
    }
    
    /**************************************************************************************
	* @Description  Test class for getPrompt
	**************************************************************************************/      
    @isTest public static void testGetOrgDetails(){
    	TEST.startTest(); 
        try{
     		PackageVisualizerCtrl.getOrgDetails();
        }catch(Exception e){
            System.debug(e);
        }
        TEST.stopTest(); 
    }
    
    
	/**************************************************************************************
	* @Description  Test class for calculatePackageVersionCodeCoverage method
	**************************************************************************************/      
    @isTest public static void testGetLatestPackageVersions(){
    	TEST.startTest(); 
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
     	List<String>  result = PackageVisualizerCtrl.getLatestPackageVersions('0Ho000000000000AAA', '10');
        TEST.stopTest(); 
    }  

  
    
	/**************************************************************************************
	* @Description  Test class for setPackage2Fields method
	**************************************************************************************/      
    @isTest public static void testSetPackage2Fields(){
    	TEST.startTest(); 
        Test.setMock(HttpCalloutMock.class, new ToolingAPICalloutMock());
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('Package2Id', '0Ho000000000000AAA', 'STRING');
     	String  result = PackageVisualizerCtrl.setPackage2Fields(fltList, 'Package2','0Ho000000000000AAA' );
        TEST.stopTest(); 
    }    
    
    
	/**************************************************************************************
	* @Description  Test class for PackageVisualizerCtrl getEligibleLowerPackageVersions method
	**************************************************************************************/      
    /*@isTest public static void testGetEligibleLowerPackageVersions(){
    	TEST.startTest(); 
        List<MetadataPackageVersion> data = PackageVisualizerCtrl.getEligibleLowerPackageVersions('1.0.0','2.0.0');
        system.assertNotEquals(null, data);
        TEST.stopTest(); 
    }*/     
    
    
	/**************************************************************************************
	* @Description  Test class for create filter list
	**************************************************************************************/     
    private static List<ObjectWrappers.FilterWrapper> createFilterList(string key, string value, string dataType){
        List<ObjectWrappers.FilterWrapper> fltList = new List<ObjectWrappers.FilterWrapper>();
        fltList.add(createFilterObject(key, value, dataType));
        return fltList;   
    }
    
	/**************************************************************************************
	* @Description  Test class for create filter
	**************************************************************************************/       
    private static ObjectWrappers.FilterWrapper createFilterObject(string key, string value, string dataType){
        ObjectWrappers.FilterWrapper flt = new ObjectWrappers.FilterWrapper();
        flt.fieldName = key;
        flt.value = value;
        flt.dataType = dataType;
		return flt;       
    }

    @isTest public static void testIsSignupRequest(){
        TEST.startTest(); 
        Boolean isSignUpReq = PackageVisualizerCtrl.isSignupRequest();
        system.assertNotEquals(null, isSignUpReq);
        TEST.stopTest(); 
    }

    @isTest public static void testIsSignupRequestDemoTrials(){
        TEST.startTest(); 
        Boolean isSignUpReq = DemoTrialsController.isSignupRequest();
        system.assertNotEquals(null, isSignUpReq);
        TEST.stopTest(); 
    }

    @isTest
    public static void testGetSignUpRequests() {
        // Positive test case
        Test.startTest();
        List<ObjectWrappers.FilterWrapper> filters = new List<ObjectWrappers.FilterWrapper>();
        // Populate filters as needed
        String sortedBy = 'CreatedDate';
        String sortDirection = 'DESC';
        String signUpLimit = '10';
        String signUpOffset = '0';
        List<ObjectWrappers.SignupRequestWrapper> result = PackageVisualizerCtrl.getSignUpRequests(filters, sortedBy, sortDirection, signUpLimit, signUpOffset);
        System.assertEquals(0, result.size()); // Assuming the result should be empty in this test case
        Test.stopTest();
    }

    @isTest
    public static void testSignupRequestWrapper() {
        // Create test data
        ObjectWrappers.SignupRequestWrapper sw = new ObjectWrappers.SignupRequestWrapper();
        sw.company = 'TestCompany';
        sw.country = 'TestCountry';
        sw.createdOrgId = 'TestOrgId';
        sw.createdOrgInstance = 'TestInstance';
        sw.errorCode = 'TestError';
        sw.firstName = 'TestFirstName';
        sw.lastName = 'TestLastName';
        sw.preferredLanguage = 'TestLanguage';
        sw.resolvedTemplateId = 'TestTemplateId';
        sw.shouldConnectToEnvHub = true;
        sw.signupEmail = 'test@example.com';
        sw.signupSource = 'TestSource';
        sw.status = 'TestStatus';
        sw.subdomain = 'test-subdomain';
        sw.isSignupEmailSuppressed = false;
        sw.templateId = 'TestTemplate';
        sw.trialDays = 30;
        sw.trialSourceOrgId = 'TestSourceOrgId';
        sw.username = 'testuser';
        sw.edition = 'TestEdition';
        sw.owner = 'test';
        sw.systemModstamp = Datetime.now();
        sw.createdDate = Datetime.now();
        
        // Create and set values for the PackageCreator instance
        ObjectWrappers.PackageCreator pc = new ObjectWrappers.PackageCreator();
        pc.name = 'TestCreator';
        // Set other properties for PackageCreator
        sw.createdBy = pc;

        // Assert properties
        System.assertEquals('TestCompany', sw.company);
        System.assertEquals('TestCountry', sw.country);
        System.assertEquals('TestOrgId', sw.createdOrgId);
        System.assertEquals('TestInstance', sw.createdOrgInstance);
        System.assertEquals('TestError', sw.errorCode);
        System.assertEquals('TestFirstName', sw.firstName);
        System.assertEquals('TestLastName', sw.lastName);
        System.assertEquals('TestLanguage', sw.preferredLanguage);
        System.assertEquals('TestTemplateId', sw.resolvedTemplateId);
        System.assertEquals(true, sw.shouldConnectToEnvHub);
        System.assertEquals('test@example.com', sw.signupEmail);
        System.assertEquals('TestSource', sw.signupSource);
        System.assertEquals('TestStatus', sw.status);
        System.assertEquals('test-subdomain', sw.subdomain);
        System.assertEquals(false, sw.isSignupEmailSuppressed);
        System.assertEquals('TestTemplate', sw.templateId);
        System.assertEquals(30, sw.trialDays);
        System.assertEquals('TestSourceOrgId', sw.trialSourceOrgId);
        System.assertEquals('testuser', sw.username);
        System.assertEquals('TestEdition', sw.edition);
    }

    @isTest public static void testisAccount(){
        TEST.startTest(); 
        Boolean isAccount = Package2Interface.isAccount();
        system.assertNotEquals(null, isAccount);
        TEST.stopTest(); 
    }

    @isTest public static void testisLead(){
        TEST.startTest(); 
        Boolean isLead = Package2Interface.isLead();
        system.assertNotEquals(null, isLead);
        TEST.stopTest(); 
    }
    
    @isTest public static void testisContact(){
        TEST.startTest(); 
        Boolean isContact = Package2Interface.isContact();
        system.assertNotEquals(null, isContact);
        TEST.stopTest(); 
    }
    
    @isTest public static void testisCase(){
        TEST.startTest(); 
        Boolean isCase = Package2Interface.isCase();
        system.assertNotEquals(null, isCase);
        TEST.stopTest(); 
    }
    
    @isTest public static void testisOpportunity(){
        TEST.startTest(); 
        Boolean isOpportunity = Package2Interface.isOpportunity();
        system.assertNotEquals(null, isOpportunity);
        TEST.stopTest(); 
    }
    
    @isTest public static void testisCampaign(){
        TEST.startTest(); 
        Boolean isCampaign = Package2Interface.isCampaign();
        system.assertNotEquals(null, isCampaign);
        TEST.stopTest(); 
    }

    @isTest public static void testisTask(){
        TEST.startTest(); 
        Boolean isTask = Package2Interface.isTask();
        system.assertNotEquals(null, isTask);
        TEST.stopTest(); 
    }

    @isTest public static void testisEvent(){
        TEST.startTest(); 
        Boolean isEvent = Package2Interface.isEvent();
        system.assertNotEquals(null, isEvent);
        TEST.stopTest(); 
    }

    @isTest public static void testisUser(){
        TEST.startTest(); 
        Boolean isUser = Package2Interface.isUser();
        system.assertNotEquals(null, isUser);
        TEST.stopTest(); 
    }

    @isTest public static void testisOrder(){
        TEST.startTest(); 
        Boolean isOrder = Package2Interface.isOrder();
        system.assertNotEquals(null, isOrder);
        TEST.stopTest(); 
    }

    @isTest public static void testisAsset(){
        TEST.startTest(); 
        Boolean isAsset = Package2Interface.isAsset();
        system.assertNotEquals(null, isAsset);
        TEST.stopTest(); 
    }

    @isTest public static void testisContract(){
        TEST.startTest(); 
        Boolean isContract = Package2Interface.isContract();
        system.assertNotEquals(null, isContract);
        TEST.stopTest(); 
    }

    @isTest public static void testisProduct2(){
        TEST.startTest(); 
        Boolean isProduct2 = Package2Interface.isProduct2();
        system.assertNotEquals(null, isProduct2);
        TEST.stopTest(); 
    }

    @isTest public static void testisPricebook2(){
        TEST.startTest(); 
        Boolean isPricebook2 = Package2Interface.isPricebook2();
        system.assertNotEquals(null, isPricebook2);
        TEST.stopTest(); 
    }

    @isTest public static void testisCampaignMember(){
        TEST.startTest(); 
        Boolean isCampaignMember = Package2Interface.isCampaignMember();
        system.assertNotEquals(null, isCampaignMember);
        TEST.stopTest(); 
    }

    @isTest public static void testisFma(){
        TEST.startTest(); 
        Boolean isFmaParameter = PackageVisualizerCtrl.isFmaParameter();
        system.assertNotEquals(null, isFmaParameter);
        TEST.stopTest(); 
    }

    @isTest public static void testisActiveScratchOrg(){
        TEST.startTest(); 
        Boolean isActiveScratchOrg = Package2Interface.isActiveScratchOrg();
        system.assertNotEquals(null, isActiveScratchOrg);
        TEST.stopTest(); 
    }

    @isTest public static void testisRecommendation(){
        TEST.startTest(); 
        Boolean isRecommendation = Package2Interface.isRecommendation();
        system.assertNotEquals(null, isRecommendation);
        TEST.stopTest(); 
    }

    @isTest public static void testisLicense(){
        TEST.startTest(); 
        Boolean isLicense = Package2Interface.isLicense();
        system.assertNotEquals(null, isLicense);
        TEST.stopTest(); 
    }

    @isTest public static void testisPackageVersion(){
        TEST.startTest(); 
        Boolean isPackageVersion = Package2Interface.isPackageVersion();
        system.assertNotEquals(null, isPackageVersion);
        TEST.stopTest(); 
    }

    @isTest public static void testisPackage(){
        TEST.startTest(); 
        Boolean isPackage = Package2Interface.isPackage();
        system.assertNotEquals(null, isPackage);
        TEST.stopTest(); 
    }

    @isTest public static void testisContentVersion(){
        TEST.startTest(); 
        Boolean isContentVersion = Package2Interface.isContentVersion();
        system.assertNotEquals(null, isContentVersion);
        TEST.stopTest(); 
    }

    @isTest
    public static void testCreateSignupTrial() {
        // Test case 1: Successful signup request
        Test.startTest();
        try{
            String result = PackageVisualizerCtrl.createSignupTrial('John', 'Doe', 'john.doe@example.com', 'john.doe@example.com', 'ACME', null, 'US', 'en_US', null, 'Enterprise', 30, false, true);
            System.assertNotEquals('Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)', result, 'Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)');
        } catch(Exception e){
            System.debug(e);
        }
        Test.stopTest();
    }

    @isTest
    public static void testCreateSignupTrialDemoTrials() {
        // Test case 1: Successful signup request
        Test.startTest();
        try{
            String result = DemoTrialsController.createSignupTrial('John', 'Doe', 'john.doe@example.com', 'john.doe@example.com', 'ACME', null, 'US', 'en_US', '0TT000000000000AAA', 30, false, true, 'Enterprise');
            System.assertNotEquals('Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)', result, 'Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)');
        } catch(Exception e){
            System.debug(e);
        }
        Test.stopTest();
    }

    @isTest
    public static void testCreateSignupTrialWithTrialforce() {
        // Test case 1: Successful signup request
        Test.startTest();
        try{
            String result = PackageVisualizerCtrl.createSignupTrial('John', 'Doe', 'john.doe@example.com', 'john.doe@example.com', 'ACME', 'testing123-231-231', 'US', 'en_US', '0TT000000000000AAA', null, 30, false, true);
            System.assertNotEquals('Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)', result, 'Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)');
        } catch(Exception e){
            System.debug(e);
        }
        Test.stopTest();
    }

    @isTest
    public static void testCreateSignupTrialWithTrialforceDemoTrials() {
        // Test case 1: Successful signup request
        Test.startTest();
        try{
            String result = DemoTrialsController.createSignupTrial('John', 'Doe', 'john.doe@example.com', 'john.doe@example.com', 'ACME', null, 'US', 'en_US', '0TT000000000000AAA', 30, false, true, 'Enterprise');
            System.assertNotEquals('Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)', result, 'Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)');
        } catch(Exception e){
            System.debug(e);
        }
        Test.stopTest();
    }

    @IsTest(SeeAllData=true)
    static void testGetContent() {
        Test.startTest();
        // Set up the test request
        RestRequest request = new RestRequest();
        request.requestURI = '/services/apexrest/ecommerce/getContent';
        request.httpMethod = 'GET';
        request.addParameter('contentId', 'testContentId');
        request.addParameter('page', '0');
        request.addParameter('pageSize', '1');
        request.addParameter('language', 'testLanguage');
        request.addParameter('filterby', 'testFilter');
        RestContext.request = request;
        // Call the method to test
        Map<String, ConnectApi.ManagedContentNodeValue> contentNodes = DemoTrialsController.getContent('testContentId', 0, 1, 'testLanguage', 'testFilter');
        Test.stopTest();
        // Assert the results
        System.assertEquals(0, contentNodes.size(), 'Content nodes size should be 1');
    }

    @isTest public static void testisEnvironmentHubMember(){
        TEST.startTest(); 
        Boolean isEnvironmentHubMember = Package2Interface.isEnvironmentHubMember();
        system.assertNotEquals(null, isEnvironmentHubMember);
        TEST.stopTest(); 
    }
}