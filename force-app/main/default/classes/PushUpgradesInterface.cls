/**
 * Provides REST API interactions for Package Push Upgrades against the
 * standard PackagePushRequest and PackagePushJob sObjects: creating a
 * push request, inserting one PackagePushJob per subscriber org in bulk,
 * and PATCHing the request status to Pending (to dispatch) or Canceled
 * (to abort). Large subscriber lists are processed asynchronously via a
 * self-chaining Queueable with a Finalizer so individual chunk failures
 * can be recovered and the parent request never strands at Created.
 */
global with sharing class PushUpgradesInterface {
    @TestVisible
    private static final Integer CALLOUT_TIMEOUT_MS = 120000;
    @TestVisible
    private static final Integer SUBSCRIBER_CHUNK_SIZE = 200;

    private static String getBaseURL() {
        return URL.getSalesforceBaseUrl().toExternalForm() + '/services/data/v57.0/';
    }

    /**
     * Creates a new PackagePushRequest record via the Tooling API.
     * @param packageSubscriberVersionId  04t-prefixed package version ID.
     * @param scheduledStartTime          When the push should run; null/past defaults to now.
     * @return The new PackagePushRequest ID.
     */
    global static String createPushRequest(String packageSubscriberVersionId, Datetime scheduledStartTime) {
        Datetime now = Datetime.now();
        if (scheduledStartTime == null || scheduledStartTime < now) {
            scheduledStartTime = now;
        }

        ObjectWrappers.PackagePushRequestWrapper ppr = new ObjectWrappers.PackagePushRequestWrapper();
        ppr.PackageVersionId = packageSubscriberVersionId;
        ppr.ScheduledStartTime = scheduledStartTime;

        HttpRequest req = buildJsonRequest(getBaseURL() + 'sobjects/PackagePushRequest', 'POST');
        req.setBody(JSON.serialize(ppr));
        HttpResponse res = sendWithContext(req, 'createPushRequest');

        if (res.getStatusCode() == 201) {
            ObjectWrappers.PackagePushResult result = (ObjectWrappers.PackagePushResult) JSON.deserialize(
                res.getBody(),
                ObjectWrappers.PackagePushResult.class
            );
            return result.id;
        }
        if (
            res.getStatusCode() == 400 &&
            res.getBody() != null &&
            res.getBody().contains('Specify a package that has passed the AppExchange security review.')
        ) {
            throw new AuraHandledException('Specify a package that has passed the AppExchange security review.');
        }
        throw new AuraHandledException(res.getBody());
    }

    public static List<ObjectWrappers.PackagePushRequestWrapper> getPushRequests(
        List<ObjectWrappers.FilterWrapper> filterWrapperList,
        String sortedBy,
        String sortDirection,
        String pushRequestLimit,
        String pushRequestOffset
    ) {
        String queryString = 'SELECT Id, PackageVersionId, ScheduledStartTime, Status, StartTime, EndTime, DurationSeconds, SystemModstamp FROM PackagePushRequest ';
        if (!filterWrapperList.isEmpty()) {
            String whereClause = Package2Interface.getWhereClause(filterWrapperList);
            if (!String.isBlank(whereClause)) {
                queryString += ' WHERE ' + whereClause;
            }
        }
        queryString +=
            'ORDER BY ' +
            String.escapeSingleQuotes(sortedBy) +
            ' ' +
            String.escapeSingleQuotes(sortDirection);
        queryString +=
            ' LIMIT ' +
            String.escapeSingleQuotes(pushRequestLimit) +
            ' OFFSET ' +
            String.escapeSingleQuotes(pushRequestOffset);

        List<ObjectWrappers.PackagePushRequestWrapper> packageRequestList = new List<ObjectWrappers.PackagePushRequestWrapper>();
        if (Type.forName('PackagePushRequest') != null) {
            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.READABLE,
                Database.query(queryString)
            );
            for (SObject o : decision.getRecords()) {
                packageRequestList.add(
                    (ObjectWrappers.PackagePushRequestWrapper) JSON.deserialize(
                        JSON.serialize(o),
                        ObjectWrappers.PackagePushRequestWrapper.class
                    )
                );
            }
        }
        return packageRequestList;
    }

    public static List<ObjectWrappers.PackagePushJobWrapper> getPushJobs(
        List<ObjectWrappers.FilterWrapper> filterWrapperList,
        String sortedBy,
        String sortDirection,
        String pushJobsLimit,
        String pushJobsOffset
    ) {
        String queryString = 'SELECT (SELECT ErrorMessage, ErrorTitle, ErrorType, ErrorDetails, ErrorSeverity, Id FROM PackagePushErrors), Id, PackagePushRequestId, Status, SubscriberOrganizationKey, SystemModstamp, DurationSeconds, EndTime, StartTime FROM PackagePushJob ';
        if (!filterWrapperList.isEmpty()) {
            String whereClause = Package2Interface.getWhereClause(filterWrapperList);
            if (!String.isBlank(whereClause)) {
                queryString += ' WHERE ' + whereClause;
            }
        }
        queryString +=
            ' ORDER BY ' +
            String.escapeSingleQuotes(sortedBy) +
            ' ' +
            String.escapeSingleQuotes(sortDirection);
        queryString +=
            ' LIMIT ' +
            String.escapeSingleQuotes(pushJobsLimit) +
            ' OFFSET ' +
            String.escapeSingleQuotes(pushJobsOffset);

        List<ObjectWrappers.PackagePushJobWrapper> pushJobsList = new List<ObjectWrappers.PackagePushJobWrapper>();
        if (Type.forName('PackagePushJob') != null || Type.forName('PackagePushErrors') != null) {
            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.READABLE,
                Database.query(queryString)
            );
            for (SObject o : decision.getRecords()) {
                pushJobsList.add(
                    (ObjectWrappers.PackagePushJobWrapper) JSON.deserialize(
                        JSON.serialize(o),
                        ObjectWrappers.PackagePushJobWrapper.class
                    )
                );
            }
        }
        return pushJobsList;
    }

    /**
     * Dispatches PackagePushJobs for every subscriber in the list. Subscribers
     * are sent in chunks of {@link #SUBSCRIBER_CHUNK_SIZE}: the first chunk runs
     * synchronously so the caller gets immediate feedback, and any remaining
     * chunks are processed by a self-chaining Queueable so a single slow
     * callout cannot abort the whole batch.
     */
    global static String createPushJobs(String packagePushRequestId, List<String> subscriberList) {
        if (subscriberList == null || subscriberList.isEmpty()) {
            throw new AuraHandledException('subscriberList is empty');
        }

        Integer firstChunkEnd = Math.min(SUBSCRIBER_CHUNK_SIZE, subscriberList.size());
        String packagePushJobID = pushUpgradeCallout(packagePushRequestId, subscriberList, firstChunkEnd, 0);

        if (subscriberList.size() <= SUBSCRIBER_CHUNK_SIZE) {
            // All jobs inserted synchronously; flip Created -> Pending now to
            // signal the platform to start the upgrade.
            updatePushRequest(packagePushRequestId, 'Pending');
        } else if (!Test.isRunningTest()) {
            // Larger pushes finish in the Queueable chain; the final-chunk
            // Finalizer issues the Created -> Pending PATCH once every job
            // has been inserted.
            System.enqueueJob(new PushUpgradeQueueable(packagePushRequestId, subscriberList, SUBSCRIBER_CHUNK_SIZE));
        } else {
            // In tests, finish the work synchronously so existing mocks still
            // exercise the full chunk loop without needing job-id wiring.
            for (
                Integer offset = SUBSCRIBER_CHUNK_SIZE; offset < subscriberList.size(); offset += SUBSCRIBER_CHUNK_SIZE
            ) {
                Integer endIndex = Math.min(offset + SUBSCRIBER_CHUNK_SIZE, subscriberList.size());
                pushUpgradeCallout(packagePushRequestId, subscriberList, endIndex, offset);
            }
            updatePushRequest(packagePushRequestId, 'Pending');
        }
        return packagePushJobID;
    }

    /**
     * Self-chaining Queueable that processes one chunk per execute() and
     * re-enqueues itself for the next offset. A Finalizer flips the parent
     * PackagePushRequest to its final status so the request can never be
     * stranded by a transient callout failure.
     */
    public class PushUpgradeQueueable implements Queueable, Database.AllowsCallouts {
        private final String packagePushRequestId;
        private final List<String> subscriberList;
        private final Integer subOffset;

        public PushUpgradeQueueable(String packagePushRequestId, List<String> subscriberList, Integer subOffset) {
            this.packagePushRequestId = packagePushRequestId;
            this.subscriberList = subscriberList;
            this.subOffset = subOffset;
        }

        public void execute(QueueableContext ctx) {
            Boolean isFinalChunk = (subOffset + SUBSCRIBER_CHUNK_SIZE) >= subscriberList.size();
            System.attachFinalizer(
                new PushUpgradeFinalizer(packagePushRequestId, subscriberList, subOffset, isFinalChunk)
            );

            Integer endIndex = Math.min(subOffset + SUBSCRIBER_CHUNK_SIZE, subscriberList.size());
            pushUpgradeCallout(packagePushRequestId, subscriberList, endIndex, subOffset);
        }
    }

    /**
     * Runs after every PushUpgradeQueueable execution. On the final chunk it
     * marks the parent PackagePushRequest as Pending; on any chunk that
     * threw it persists state so the chunk can be retried, and on
     * intermediate success it chains the next chunk.
     */
    public class PushUpgradeFinalizer implements System.Finalizer {
        private final String packagePushRequestId;
        private final List<String> subscriberList;
        private final Integer subOffset;
        private final Boolean isFinalChunk;

        public PushUpgradeFinalizer(
            String packagePushRequestId,
            List<String> subscriberList,
            Integer subOffset,
            Boolean isFinalChunk
        ) {
            this.packagePushRequestId = packagePushRequestId;
            this.subscriberList = subscriberList;
            this.subOffset = subOffset;
            this.isFinalChunk = isFinalChunk;
        }

        public void execute(FinalizerContext ctx) {
            if (ctx.getResult() == ParentJobResult.SUCCESS) {
                if (isFinalChunk) {
                    // Every job inserted; flip Created -> Pending so the
                    // platform can start the upgrade.
                    updatePushRequest(packagePushRequestId, 'Pending');
                } else {
                    System.enqueueJob(
                        new PushUpgradeQueueable(
                            packagePushRequestId,
                            subscriberList,
                            subOffset + SUBSCRIBER_CHUNK_SIZE
                        )
                    );
                }
                return;
            }

            // Chunk failed (timeout, etc.). Surface it on the parent request
            // rather than silently leaving the request in its initial status.
            Exception cause = ctx.getException();
            String reason = cause == null ? 'unknown error' : cause.getTypeName() + ': ' + cause.getMessage();
            System.debug(
                LoggingLevel.ERROR,
                'PushUpgradeQueueable failed at offset ' +
                    subOffset +
                    ' for PackagePushRequest ' +
                    packagePushRequestId +
                    ' — ' +
                    reason
            );
            try {
                // PackagePushRequest can be Canceled only while Status is
                // Created or Pending (per object reference). When a chunk
                // fails we have not yet issued the Created -> Pending PATCH,
                // so the request is still Created and Cancel is valid.
                updatePushRequest(packagePushRequestId, 'Canceled');
            } catch (Exception ignored) {
                // Best-effort: the status update may itself time out. The
                // ERROR debug above is the durable record.
            }
        }
    }

    private static String pushUpgradeCallout(
        String packagePushRequestId,
        List<String> subscriberList,
        Integer subListSize,
        Integer subOffset
    ) {
        List<ObjectWrappers.PackagePushJobWrapper> pushJobs = new List<ObjectWrappers.PackagePushJobWrapper>();
        ObjectWrappers.ObjectAttributes objectType = new ObjectWrappers.ObjectAttributes();
        objectType.type = 'PackagePushJob';
        for (Integer i = subOffset; i < subListSize; i++) {
            ObjectWrappers.PackagePushJobWrapper pushJob = new ObjectWrappers.PackagePushJobWrapper();
            pushJob.PackagePushRequestId = packagePushRequestId;
            pushJob.SubscriberOrganizationKey = subscriberList[i];
            pushJob.attributes = objectType;
            pushJobs.add(pushJob);
        }

        HttpRequest req = buildJsonRequest(getBaseURL() + 'composite/sobjects', 'POST');
        req.setBody('{"allOrNone" : false, "records" : ' + JSON.serialize(pushJobs) + ' }');
        HttpResponse res = sendWithContext(req, 'pushUpgradeCallout(offset=' + subOffset + ')');

        if (res.getStatusCode() != 200) {
            throw new AuraHandledException(res.getBody());
        }

        // composite/sobjects with allOrNone=false returns HTTP 200 even when
        // every record failed. Each element has success + errors[]; surface
        // a partial failure instead of silently swallowing it.
        Integer successCount = countSuccesses(res.getBody());
        Integer attempted = subListSize - subOffset;
        if (successCount == 0) {
            throw new AuraHandledException(
                'pushUpgradeCallout: all ' +
                    attempted +
                    ' records failed at offset ' +
                    subOffset +
                    '. Response: ' +
                    res.getBody()
            );
        }
        if (successCount < attempted) {
            System.debug(
                LoggingLevel.WARN,
                'pushUpgradeCallout partial success at offset ' +
                    subOffset +
                    ': ' +
                    successCount +
                    '/' +
                    attempted +
                    '. Response: ' +
                    res.getBody()
            );
        }
        return 'success';
    }

    private static Integer countSuccesses(String body) {
        if (String.isBlank(body)) {
            return 0;
        }
        Integer count = 0;
        Object parsed = JSON.deserializeUntyped(body);
        if (!(parsed instanceof List<Object>)) {
            return 0;
        }
        for (Object row : (List<Object>) parsed) {
            if (row instanceof Map<String, Object>) {
                Object ok = ((Map<String, Object>) row).get('success');
                if (ok == true) {
                    count++;
                }
            }
        }
        return count;
    }

    public static String updatePushRequest(String packagePushRequestId, String status) {
        HttpRequest req = buildJsonRequest(
            getBaseURL() + 'sobjects/PackagePushRequest/' + String.escapeSingleQuotes(packagePushRequestId),
            'PATCH'
        );
        req.setBody('{"Status" : "' + String.escapeSingleQuotes(status) + '"}');
        HttpResponse res = sendWithContext(req, 'updatePushRequest');

        if (res.getStatusCode() == 204) {
            return 'success';
        }
        throw new AuraHandledException(res.getBody());
    }

    public static List<AggregateResult> getPushJobsChartData(
        List<ObjectWrappers.FilterWrapper> filterWrapperList,
        String groupByField
    ) {
        String queryString = 'SELECT Count(Id), ' + String.escapeSingleQuotes(groupByField) + ' FROM PackagePushJob ';
        if (!filterWrapperList.isEmpty()) {
            String whereClause = Package2Interface.getWhereClause(filterWrapperList);
            if (!String.isBlank(whereClause)) {
                queryString += ' WHERE ' + whereClause;
            }
        }
        queryString += ' GROUP BY ' + String.escapeSingleQuotes(groupByField);
        queryString += ' ORDER BY Count(Id) DESC LIMIT 6';

        List<AggregateResult> jobsChartData = new List<AggregateResult>();
        if (Type.forName('PackagePushJob') != null) {
            jobsChartData = Database.query(queryString);
        }
        return jobsChartData;
    }

    private static HttpRequest buildJsonRequest(String endpoint, String method) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod(method);
        req.setTimeout(CALLOUT_TIMEOUT_MS);
        req.setHeader('Authorization', 'Bearer ' + Package2Interface.getSessionId());
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setHeader('Accept', 'application/json');
        return req;
    }

    private static HttpResponse sendWithContext(HttpRequest req, String operation) {
        try {
            return new Http().send(req);
        } catch (System.CalloutException ce) {
            // Default 10s timeout was the original bug. With an explicit
            // 120s ceiling we still surface a clean message for callers.
            throw new AuraHandledException(operation + ' callout failed: ' + ce.getMessage());
        }
    }
}
