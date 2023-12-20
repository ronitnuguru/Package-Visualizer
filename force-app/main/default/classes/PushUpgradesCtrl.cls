public with sharing class PushUpgradesCtrl {

    @AuraEnabled(cacheable=true)
    public static String createPackagePushRequest(String packageSubscriberVersionId, Datetime scheduledStartTime){
        String packagePushRequest = PushUpgradesInterface.createPushRequest(packageSubscriberVersionId, scheduledStartTime);
        return packagePushRequest;
    }

    @AuraEnabled(cacheable=true)
    public static List<ObjectWrappers.MetadataPackageVersionWrapper> getEligibleLowerPackageVersions(String packageVersionNumber, String subscriberPackageId){
        List<String> versionSplit = packageVersionNumber.split('\\.');
        List<String> patchBuildSplit = versionSplit[2].split('\\-');
        
        Integer majorVersion = Integer.valueOf(versionSplit[0]);
        Integer minorVersion = Integer.valueOf(versionSplit[1]);
        Integer patchVersion = Integer.valueOf(patchBuildSplit[0]);
        String releasedState = 'Released';

        String packageVersionQuery = 'Select Id FROM MetadataPackageVersion WHERE MetadataPackageId = :subscriberPackageId AND IsDeprecated = false AND ReleaseState = :releasedState AND (MajorVersion < :majorVersion OR (MajorVersion = :majorVersion AND MinorVersion < :minorVersion) OR (MajorVersion = :majorVersion AND MinorVersion = :minorVersion AND PatchVersion < :patchVersion)) ORDER by SystemModstamp DESC LIMIT 1000';
        List<ObjectWrappers.MetadataPackageVersionWrapper> packageVersionsList = new List<ObjectWrappers.MetadataPackageVersionWrapper>();
        if (Type.forName('MetadataPackageVersion')!= null) {
            SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE,Database.query(packageVersionQuery));
            for (sObject o: decision.getRecords()) {
                ObjectWrappers.MetadataPackageVersionWrapper pvw = (ObjectWrappers.MetadataPackageVersionWrapper)JSON.deserialize(JSON.serialize(o), ObjectWrappers.MetadataPackageVersionWrapper.class); 
                packageVersionsList.add(pvw);
            }
        }
        return packageVersionsList;
    }

    @AuraEnabled(cacheable=true)
    public static List<ObjectWrappers.MetadataPackageVersionWrapper> getEligibleHigherPackageVersions(String packageVersionNumber, String subscriberPackageId, String sortedBy, String sortDirection){
        List<String> versionSplit = packageVersionNumber.split('\\.');
        List<String> patchBuildSplit = versionSplit[2].split('\\-');
        
        Integer majorVersion = Integer.valueOf(versionSplit[0]);
        Integer minorVersion = Integer.valueOf(versionSplit[1]);
        Integer patchVersion = Integer.valueOf(patchBuildSplit[0]);
        String releasedState = 'Released';

        String packageVersionQuery = 'SELECT Id, Name, BuildNumber, MajorVersion, MinorVersion, PatchVersion, SystemModstamp FROM MetadataPackageVersion WHERE MetadataPackageId = :subscriberPackageId AND IsDeprecated = false AND ReleaseState = :releasedState AND (MajorVersion > :majorVersion OR (MajorVersion = :majorVersion AND MinorVersion > :minorVersion) OR (MajorVersion = :majorVersion AND MinorVersion = :minorVersion AND PatchVersion > :patchVersion)) ';
        packageVersionQuery =  packageVersionQuery + ' ORDER BY ' + String.escapeSingleQuotes(sortedBy) + ' ' + String.escapeSingleQuotes(sortDirection) + ' LIMIT 50';
        List<ObjectWrappers.MetadataPackageVersionWrapper> packageVersionsList = new List<ObjectWrappers.MetadataPackageVersionWrapper>();
        if (Type.forName('MetadataPackageVersion') != null) {
            SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE,Database.query(packageVersionQuery));
            for (sObject o : decision.getRecords()) {
                ObjectWrappers.MetadataPackageVersionWrapper pvw = (ObjectWrappers.MetadataPackageVersionWrapper)JSON.deserialize(JSON.serialize(o), ObjectWrappers.MetadataPackageVersionWrapper.class); 
                packageVersionsList.add(pvw);
            }
        }
        return packageVersionsList;
    }

    @AuraEnabled(continuation=true)
    public static List<ObjectWrappers.PackagePushRequestWrapper> getPackageVersionPushRequests(list<ObjectWrappers.FilterWrapper> filterWrapper, String sortedBy, String sortDirection, String pushRequestLimit, String pushRequestOffset){
        List<ObjectWrappers.PackagePushRequestWrapper> pushRequests =  PushUpgradesInterface.getPushRequests(filterWrapper, sortedBy, sortDirection, pushRequestLimit, pushRequestOffset);
        return pushRequests;
    }

    @AuraEnabled(continuation=true)
    public static List<ObjectWrappers.PackagePushJobWrapper> getPackageVersionPushJobs(list<ObjectWrappers.FilterWrapper> filterWrapper, String sortedBy, String sortDirection, String pushJobsLimit, String pushJobsOffset){
        List<ObjectWrappers.PackagePushJobWrapper> pushJobs = PushUpgradesInterface.getPushJobs(filterWrapper, sortedBy, sortDirection, pushJobsLimit, pushJobsOffset);
        return pushJobs;
    }

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getPackagePushJobChartData(List<ObjectWrappers.FilterWrapper> filterWrapper, String groupByField){
        List <AggregateResult> jobsChartData = PushUpgradesInterface.getPushJobsChartData(filterWrapper, groupByField);
        return jobsChartData;
    }

    @AuraEnabled(cacheable=true)
    public static ObjectWrappers.PackageSubscriberWrapper getPushJobPackageSubscriber(String orgId){
        String queryString = 'SELECT Id, MetadataPackageId, MetadataPackageVersionId, InstalledStatus, OrgKey, OrgName, OrgType, OrgStatus, InstanceName, ParentOrg FROM PackageSubscriber WHERE OrgKey = :orgId';
        ObjectWrappers.PackageSubscriberWrapper subscriber = new ObjectWrappers.PackageSubscriberWrapper();
        if(Type.forName('PackageSubscriber') != null){
        	SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE,Database.query(queryString));
        	for(sObject o : decision.getRecords()) {
       			subscriber = (ObjectWrappers.PackageSubscriberWrapper)JSON.deserialize(JSON.serialize(o), ObjectWrappers.PackageSubscriberWrapper.class); 
       		}
        }
        return subscriber;
    }

    @AuraEnabled(cacheable=true)
    public static String createPackagePushJobs(String packagePushRequestId, List<String> subscriberList){
        String packagePushJobRequests = PushUpgradesInterface.createPushJobs(packagePushRequestId, subscriberList);
        return packagePushJobRequests;
    }

    @AuraEnabled(cacheable=true)
    public static String updatePackagePushRequest(String packagePushRequestId, String status){
        String packagePushRequest = PushUpgradesInterface.updatePushRequest(packagePushRequestId, status);
        return packagePushRequest;
    }
}