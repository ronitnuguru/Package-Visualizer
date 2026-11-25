public with sharing class HeadlessJourneyLauncherController {
    private static final String APP_NAME = 'HeadlessJourney';
    private static final String TRUSTED_URL_NAME = 'HeadlessJourneyFrame';
    private static final Pattern SALESFORCE_APP_ORIGIN = Pattern.compile(
        'https://[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.salesforce\\.app'
    );

    @AuraEnabled(cacheable=true)
    public static String getJourneyUrl() {
        String className = String.valueOf(HeadlessJourneyLauncherController.class);
        Integer separator = className.indexOf('.');
        String packageNamespace = separator < 0 ? null : className.substring(0, separator);
        String qualifiedName = packageNamespace == null ? APP_NAME : packageNamespace + '__' + APP_NAME;
        Set<String> appNames = new Set<String>{ APP_NAME, qualifiedName };
        List<AppMenuItem> items = [
            SELECT StartUrl
            FROM AppMenuItem
            WHERE Name IN :appNames
                AND NamespacePrefix = :packageNamespace
                AND Type = 'TabSet'
                AND IsAccessible = true
                AND StartUrl != null
            WITH USER_MODE
            LIMIT 1
        ];
        return items.isEmpty() ? null : validateStartUrl(items[0].StartUrl, packageNamespace);
    }

    @AuraEnabled
    public static void createJourneyTrustedUrl() {
        UserPermissionAccess permissions = [
            SELECT PermissionsCustomizeApplication, PermissionsModifyAllData
            FROM UserPermissionAccess
            WITH USER_MODE
            LIMIT 1
        ];
        if (!permissions.PermissionsCustomizeApplication || !permissions.PermissionsModifyAllData) {
            throw new AuraHandledException('Creating a Trusted URL requires Customize Application and Modify All Data.');
        }

        String journeyUrl = getJourneyUrl();
        if (journeyUrl == null) {
            throw new AuraHandledException('The Headless Toolkit Journey URL could not be resolved for this org.');
        }
        String origin = journeyUrl.substringBefore('/app/');
        List<CspTrustedSite> existing = [
            SELECT EndpointUrl, Context, IsActive, IsApplicableToFrameSrc
            FROM CspTrustedSite
            WHERE EndpointUrl = :origin OR DeveloperName = :TRUSTED_URL_NAME
            WITH USER_MODE
        ];
        for (CspTrustedSite site : existing) {
            if (site.EndpointUrl == origin && site.IsActive && site.IsApplicableToFrameSrc &&
                (site.Context == 'LEX' || site.Context == 'All')) {
                return;
            }
        }
        if (!existing.isEmpty()) {
            throw new AuraHandledException('An entry for this URL or API name already exists. Review it in Trusted URLs.');
        }

        insertTrustedUrl(origin);
    }

    @TestVisible
    private static void insertTrustedUrl(String origin) {
        String failureMessage = 'The Trusted URL could not be confirmed. Check Trusted URLs in Setup before retrying.';
        try {
            // Use the current admin's same-org API session. Apex DML cannot insert CspTrustedSite.
            String sessionId = Package2Interface.getSessionId();
            if (String.isNotBlank(sessionId)) {
                HttpRequest request = new HttpRequest();
                request.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + '/services/data/v68.0/tooling/sobjects/CspTrustedSite');
                request.setMethod('POST');
                request.setTimeout(10000);
                request.setHeader('Authorization', 'Bearer ' + sessionId);
                request.setHeader('Content-Type', 'application/json');
                request.setBody(JSON.serialize(new Map<String, Object>{
                    'DeveloperName' => TRUSTED_URL_NAME,
                    'EndpointUrl' => origin,
                    'Context' => 'LEX',
                    'IsActive' => true,
                    'IsApplicableToFrameSrc' => true,
                    'IsApplicableToImgSrc' => false
                }));
                if (new Http().send(request).getStatusCode() == 201) return;
            }
        } catch (Exception e) {
            // Leave API and session details on the server. The admin can check Setup and retry safely.
            throw new AuraHandledException(failureMessage);
        }
        throw new AuraHandledException(failureMessage);
    }

    @TestVisible
    private static String validateStartUrl(String startUrl, String packageNamespace) {
        if (String.isBlank(startUrl)) return null;
        Integer pathStart = startUrl.indexOf('/app/');
        if (pathStart < 0 || !SALESFORCE_APP_ORIGIN.matcher(startUrl.substring(0, pathStart)).matches()) {
            return null;
        }

        String path = startUrl.substring(pathStart);
        String namespacedPath = '/app/' + packageNamespace + '__' + APP_NAME;
        if (path == '/app/c__' + APP_NAME || (packageNamespace != null && path == namespacedPath)) {
            return startUrl;
        }
        return null;
    }
}
