public with sharing class PushUpgradesInterface {
   
    private static string getBaseURL() {
        String baseURL = URL.getSalesforceBaseUrl().toExternalForm() + '/services/data/v57.0/';
        return baseURL;
    }

    public static string createPushRequest(String packageSubscriberVersionId, Datetime scheduledStartTime){
        Datetime now = datetime.now();

        if(scheduledStartTime == null || scheduledStartTime < now){
            scheduledStartTime = now;
        }

        ObjectWrappers.PackagePushRequestWrapper ppr = new ObjectWrappers.PackagePushRequestWrapper();
        ppr.PackageVersionId = packageSubscriberVersionId;
        ppr.ScheduledStartTime = scheduledStartTime;
        String httpBody = JSON.serialize(ppr);

        String packagePushID;
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getBaseURL() + 'sobjects/PackagePushRequest');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + Package2Interface.getSessionId());
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setHeader('Accept', 'application/json');
        req.setBody(httpBody);
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 201) {
            ObjectWrappers.PackagePushResult result = (ObjectWrappers.PackagePushResult)JSON.deserialize(res.getBody(), ObjectWrappers.PackagePushResult.class);
            packagePushID = result.id;
        }
        else if(res.getStatusCode() == 400){
            if(res.getBody().contains('Specify a package that has passed the AppExchange security review.')){
                throw new AuraHandledException('Specify a package that has passed the AppExchange security review.');
            } else {
                throw new AuraHandledException(res.getBody());
            }
        }
        else {
            throw new AuraHandledException(res.getBody());
        }
        return packagePushID;
    }

    public static List<ObjectWrappers.PackagePushRequestWrapper> getPushRequests(List<ObjectWrappers.FilterWrapper> filterWrapperList, String sortedBy, String sortDirection, String pushRequestLimit, String pushRequestOffset){
        String queryString = 'SELECT Id, PackageVersionId, ScheduledStartTime, Status, StartTime, EndTime, DurationSeconds, SystemModstamp FROM PackagePushRequest ';
        String whereClause = '';
        if(!filterWrapperList.isEmpty()){
            whereClause = Package2Interface.getWhereClause(filterWrapperList);
            if(!String.isBlank(whereClause)){
                queryString = queryString + ' WHERE ' + whereClause;
            }
        }

        queryString = queryString + 'ORDER BY ' + String.escapeSingleQuotes(sortedBy) + ' ' + String.escapeSingleQuotes(sortDirection);
        queryString = queryString + ' LIMIT ' + String.escapeSingleQuotes(pushRequestLimit) + ' OFFSET ' + String.escapeSingleQuotes(pushRequestOffset);
        List<ObjectWrappers.PackagePushRequestWrapper> packageRequestList = new List<ObjectWrappers.PackagePushRequestWrapper>();
        if (Type.forName('PackagePushRequest')!= null) {
            SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE, Database.query(queryString));
            for (sObject o: decision.getRecords()) {
                ObjectWrappers.PackagePushRequestWrapper ppr = (ObjectWrappers.PackagePushRequestWrapper)JSON.deserialize(JSON.serialize(o), ObjectWrappers.PackagePushRequestWrapper.class); 
                packageRequestList.add(ppr);
            }
        }
        return packageRequestList;
    }

    public static List<ObjectWrappers.PackagePushJobWrapper> getPushJobs(list<ObjectWrappers.FilterWrapper> filterWrapperList, String sortedBy, String sortDirection, String pushJobsLimit, String pushJobsOffset){
        String queryString = 'SELECT (SELECT ErrorMessage, ErrorTitle, Id FROM PackagePushErrors), Id, PackagePushRequestId, Status, SubscriberOrganizationKey, SystemModstamp, DurationSeconds, EndTime, StartTime FROM PackagePushJob ';
        String whereClause = '';
        if(!filterWrapperList.isEmpty()){
            whereClause = Package2Interface.getWhereClause(filterWrapperList);
            if(!String.isBlank(whereClause)){
                queryString = queryString + ' WHERE ' + whereClause;
            }
        }   
        queryString = queryString + ' ORDER BY ' + String.escapeSingleQuotes(sortedBy) + ' ' + String.escapeSingleQuotes(sortDirection);
        queryString = queryString + ' LIMIT ' + String.escapeSingleQuotes(pushJobsLimit) + ' OFFSET ' + String.escapeSingleQuotes(pushJobsOffset);
        List<ObjectWrappers.PackagePushJobWrapper> pushJobsList = new List<ObjectWrappers.PackagePushJobWrapper>();
        if (Type.forName('PackagePushJob') != null || Type.forName('PackagePushErrors') != null)  {
            SObjectAccessDecision  decision = Security.stripInaccessible(AccessType.READABLE, Database.query(queryString));
            for (sObject o : decision.getRecords()) {
                ObjectWrappers.PackagePushJobWrapper ppj = (ObjectWrappers.PackagePushJobWrapper)JSON.deserialize(JSON.serialize(o), ObjectWrappers.PackagePushJobWrapper.class); 
                pushJobsList.add(ppj);
            }
        }
        return pushJobsList;
    }

    public static String createPushJobs(String packagePushRequestId, List<String> subscriberList){
       
       Integer subLimit = 200;
       Integer subOffset = 0;

        if(subscriberList.size() <= subLimit){
            String packagePushJobID =  pushUpgradeCallout(packagePushRequestId, subscriberList, subscriberList.size(), subOffset);
            updatePushRequest(packagePushRequestId, 'Pending');
            return packagePushJobID;
        }
        else {
            String packagePushJobID = pushUpgradeCallout(packagePushRequestId, subscriberList, subLimit, subOffset);
            asynchronousPushUpgrade(packagePushRequestId, subscriberList, subLimit, subOffset + subLimit);
            return packagePushJobID;
        }
    }

    @future(callout=true)
    private static void asynchronousPushUpgrade(String packagePushRequestId, List<String> subscriberList, Integer subLimit, Integer subOffset){
        while(subscriberList.size() > subOffset){
            if(subscriberList.size() < subLimit + subOffset){
                pushUpgradeCallout(packagePushRequestId, subscriberList, subscriberList.size(), subOffset);
                break;
            }
            pushUpgradeCallout(packagePushRequestId, subscriberList, subLimit + subOffset, subOffset);
            subOffset = subOffset + subLimit;
        }
        updatePushRequest(packagePushRequestId, 'Pending');
    }

    private static String pushUpgradeCallout(String packagePushRequestId, List<String> subscriberList, Integer subListSize, Integer subOffset){
        List<ObjectWrappers.PackagePushJobWrapper> pushJobs = new List<ObjectWrappers.PackagePushJobWrapper>();
        ObjectWrappers.ObjectAttributes objectType = new ObjectWrappers.ObjectAttributes();
        objectType.type = 'PackagePushJob';
        for(Integer i = subOffset; i < subListSize; i++){
            ObjectWrappers.PackagePushJobWrapper pushJob = new ObjectWrappers.PackagePushJobWrapper();
            pushJob.PackagePushRequestId = packagePushRequestId;
            pushJob.SubscriberOrganizationKey = subscriberList[i];
            pushJob.attributes = objectType;
            pushJobs.add(pushJob);
        }

        String packagePushJobID;
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getBaseURL() + 'composite/sobjects');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + Package2Interface.getSessionId());
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setHeader('Accept', 'application/json');
        String httpBody = JSON.serialize(pushJobs);
        req.setBody(('{"allOrNone" : false, "records" : ' + httpBody + ' }'));
        HttpResponse res = http.send(req);
        if (res.getStatusCode() == 200) {
            packagePushJobID = 'success';
        }
        else {
            throw new AuraHandledException(res.getBody());
        }
        return packagePushJobID;
    }

    public static String updatePushRequest(String packagePushRequestId, String status){
        String packagePushID;
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getBaseURL() + 'sobjects/PackagePushRequest/'+String.escapeSingleQuotes(packagePushRequestId));
        req.setMethod('PATCH');
        req.setHeader('Authorization', 'Bearer ' + Package2Interface.getSessionId());
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setHeader('Accept', 'application/json');
        req.setBody('{"Status" : \"' + String.escapeSingleQuotes(status) + '\"}');
        HttpResponse res = http.send(req);
        if (res.getStatusCode() == 204) {
            packagePushID = 'success';
        }
        else {
            throw new AuraHandledException(res.getBody());
        }
        return packagePushID;
    }

    public static List<AggregateResult> getPushJobsChartData(List<ObjectWrappers.FilterWrapper> filterWrapperList, String groupByField){
        String queryString = 'SELECT Count(Id), '+ String.escapeSingleQuotes(groupByField) +' FROM PackagePushJob ';
        String whereClause = '';
        if(!filterWrapperList.isEmpty()){
            whereClause = Package2Interface.getWhereClause(filterWrapperList);
            if(!String.isBlank(whereClause)){
                queryString = queryString + ' WHERE '+ whereClause;
            }
        }
        queryString = queryString + ' GROUP BY '+ String.escapeSingleQuotes(groupByField);
        queryString = queryString + ' ORDER BY Count(Id) DESC LIMIT 6';
 		List<AggregateResult> jobsChartData = new List<AggregateResult>();
        if (Type.forName('PackagePushJob') != null) {
            jobsChartData = Database.query(queryString);
        }
        return jobsChartData;
    }
}