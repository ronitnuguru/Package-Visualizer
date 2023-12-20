/*******************************************************************************************
* @Name         PushUpgradesInterfaceTest 
* @Date         03/08/2020
* @Description  All the test classes for 2GP Visualizer application Push Upgrade related code.  
*******************************************************************************************/
@isTest
private class PushUpgradesInterfaceTest {  
    
	/**************************************************************************************
	* @Description  Test class for getEligibleLowerPackageVersions
	**************************************************************************************/    
    @isTest public static void testGetEligibleLowerPackageVersions() {
        Test.startTest();
        List<ObjectWrappers.MetadataPackageVersionWrapper> data = PushUpgradesCtrl.getEligibleLowerPackageVersions('1.0.0', '10.0.0');
        Test.stopTest();
    } 
    
    
	/**************************************************************************************
	* @Description  Test class for getEligibleHigherPackageVersions
	**************************************************************************************/    
    @isTest public static void testGetEligibleHigherPackageVersions() {
        Test.startTest();
        List<ObjectWrappers.MetadataPackageVersionWrapper> data = PushUpgradesCtrl.getEligibleHigherPackageVersions('1.0.0', '10.0.0', 'id', 'desc');
        List<ObjectWrappers.MetadataPackageVersionWrapper> data2 = PushUpgradesCtrl.getEligibleHigherPackageVersions('1.0.0', '10.0.0', 'id', 'asc');
        Test.stopTest();
    }

	/**************************************************************************************
	* @Description  Test class for getPackageVersionPushRequests
	**************************************************************************************/    
    @isTest public static void testGetPackageVersionPushRequests() {
        Test.startTest(); 
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('PackageVersionId', '0Ho000000000000AAA', 'STRING');
        List<ObjectWrappers.PackagePushRequestWrapper> data = PushUpgradesCtrl.getPackageVersionPushRequests(fltList,'Status', 'Desc', '10', '10');
        Test.stopTest();
    }  
    
	/**************************************************************************************
	* @Description  Test class for getPackageVersionPushJobs
	**************************************************************************************/    
    @isTest public static void testGetPackageVersionPushJobs() {
        Test.startTest(); 
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('PackagePushRequestId', '0Ho000000000000AAA', 'STRING');
        List<ObjectWrappers.PackagePushJobWrapper> data = PushUpgradesCtrl.getPackageVersionPushJobs(fltList,'Status', 'Desc', '10', '10');
        Test.stopTest();
    }  

	/**************************************************************************************
	* @Description  Test class for createPackagePushRequest
	**************************************************************************************/    
    @isTest public static void testCreatePackagePushRequest() {
        Test.startTest(); 
        Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
        try{
        	string data = PushUpgradesCtrl.createPackagePushRequest('0Ho000000000000AAA', System.now());
        }catch(Exception e){
            System.debug(e);
        }
        Test.stopTest();
    }

    /**************************************************************************************
	* @Description  Test class for updatePackagePushRequest
	**************************************************************************************/    
    @isTest public static void testUpdatePackagePushRequest() {
        Test.startTest(); 
        Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
        try{
        	string data = PushUpgradesCtrl.updatePackagePushRequest('0Ho000000000000AAA', 'Canceled');
        }catch(Exception e){
            System.debug(e);
        }
        Test.stopTest();
    } 
    
	/**************************************************************************************
	* @Description  Test class for getPushJobPackageSubscriber
	**************************************************************************************/    
    @isTest public static void testGetPushJobPackageSubscribers() {
        Test.startTest(); 
        ObjectWrappers.PackageSubscriberWrapper data = PushUpgradesCtrl.getPushJobPackageSubscriber('0Ho000000000000AAA');
        Test.stopTest();
    }   
    
	/**************************************************************************************
	* @Description  Test class for createPackagePushJobs
	**************************************************************************************/    
    @isTest public static void testCreatePackagePushJobs() {
        try{
        Test.startTest(); 
        Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
        List<String> slist = new list<String>();
        slist.add('0Ho000000000000AAA');
        String data = PushUpgradesCtrl.createPackagePushJobs('0Ho000000000000AAA',slist);
        Test.stopTest();
        }catch(exception e){
            System.debug('# E:'+e);
        }
    }  

	/**************************************************************************************
	* @Description  Test class for getPackagePushJobChartData
	**************************************************************************************/    
    @isTest public static void testGetPackagePushJobChartData() {
        Test.startTest(); 
        List <ObjectWrappers.FilterWrapper> fltList = createFilterList('Status', 'Pending', 'STRING');
        List<AggregateResult> result = PushUpgradesCtrl.getPackagePushJobChartData(fltList, 'Status');
        Test.stopTest();
        
    }     
    
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
}