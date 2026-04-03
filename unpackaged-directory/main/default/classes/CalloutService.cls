/*******************************************************************************************
* @Name         CalloutService
* @Description  Dual-path callout service that supports both Named Credential (modern) and
*               Visualforce session (legacy) authentication for same-org API calls.
*               The active path is controlled by the Package_Visualizer_Setting__mdt
*               record 'Use_Named_Credentials'. When enabled, callouts use the
*               PkgViz_DevHub_API Named Credential which auto-injects OAuth tokens.
*               When disabled, falls back to the existing SessionCreator.page pattern.
*******************************************************************************************/
@NamespaceAccessible
public with sharing class CalloutService {

    private static final String NAMED_CREDENTIAL = 'PkgViz_DevHub_API';
    @NamespaceAccessible
    public static final String API_VERSION = 'v65.0';

    @TestVisible
    private static Boolean useNamedCredentialOverride;

    /**************************************************************************************
    * @Description  Determines whether Named Credentials are enabled for callouts.
    *               Reads from Package_Visualizer_Setting__mdt; result is cached per-transaction.
    **************************************************************************************/
    @NamespaceAccessible
    public static Boolean useNamedCredential() {
        if (useNamedCredentialOverride != null) {
            return useNamedCredentialOverride;
        }
        Package_Visualizer_Setting__mdt setting = Package_Visualizer_Setting__mdt.getInstance(
            'Use_Named_Credentials'
        );
        return setting != null && setting.Enabled__c;
    }

    /**************************************************************************************
    * @Description  Returns the base endpoint for Tooling API calls.
    *               Named Credential path: callout:PkgViz_DevHub_API/services/data/v65.0/tooling/
    *               Legacy path: delegates to Package2Interface.getBaseURL('tooling')
    **************************************************************************************/
    @NamespaceAccessible
    public static String getToolingEndpoint(String path) {
        if (useNamedCredential()) {
            return 'callout:' + NAMED_CREDENTIAL + '/services/data/' + API_VERSION + '/tooling/' + path;
        }
        return Package2Interface.getBaseURL('tooling') + path;
    }

    /**************************************************************************************
    * @Description  Returns the base endpoint for REST API calls (push upgrades, composite).
    *               Named Credential path: callout:PkgViz_DevHub_API/services/data/v65.0/{path}
    *               Legacy path: uses org base URL with the configured API version
    **************************************************************************************/
    @NamespaceAccessible
    public static String getRestEndpoint(String path) {
        if (useNamedCredential()) {
            return 'callout:' + NAMED_CREDENTIAL + '/services/data/' + API_VERSION + '/' + path;
        }
        return URL.getOrgDomainUrl().toExternalForm() + '/services/data/' + API_VERSION + '/' + path;
    }

    /**************************************************************************************
    * @Description  Returns the endpoint for the Limits API.
    *               Named Credential path: callout:PkgViz_DevHub_API/services/data/v65.0/limits/
    *               Legacy path: delegates to Package2Interface.getBaseURL('limits')
    **************************************************************************************/
    @NamespaceAccessible
    public static String getLimitsEndpoint() {
        if (useNamedCredential()) {
            return 'callout:' + NAMED_CREDENTIAL + '/services/data/' + API_VERSION + '/limits/';
        }
        return Package2Interface.getBaseURL('limits');
    }

    /**************************************************************************************
    * @Description  Applies authentication to the HttpRequest. When Named Credentials are
    *               active, no action is needed (the platform injects the Authorization header).
    *               When using the legacy path, sets the Bearer token from the VF session.
    **************************************************************************************/
    @NamespaceAccessible
    public static void applyAuth(HttpRequest req) {
        if (!useNamedCredential()) {
            req.setHeader('Authorization', 'Bearer ' + Package2Interface.getSessionId());
        }
    }

    /**************************************************************************************
    * @Description  Builds a fully configured HttpRequest for a Tooling API query.
    *               Handles endpoint resolution and authentication for both paths.
    **************************************************************************************/
    @NamespaceAccessible
    public static HttpRequest buildToolingQueryRequest(String queryString) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getToolingEndpoint('query?q=' + EncodingUtil.urlEncode(queryString, 'UTF-8')));
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');
        applyAuth(req);
        return req;
    }

    /**************************************************************************************
    * @Description  Builds a fully configured HttpRequest for a Tooling API PATCH operation.
    **************************************************************************************/
    @NamespaceAccessible
    public static HttpRequest buildToolingPatchRequest(String objectName, String objectId, String body) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getToolingEndpoint(
            'sobjects/' + String.escapeSingleQuotes(objectName) + '/' + String.escapeSingleQuotes(objectId) + '/'
        ));
        req.setMethod('PATCH');
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setHeader('Accept', 'application/json');
        req.setBody(body);
        applyAuth(req);
        return req;
    }

    /**************************************************************************************
    * @Description  Builds a fully configured HttpRequest for a REST API POST operation.
    **************************************************************************************/
    @NamespaceAccessible
    public static HttpRequest buildRestPostRequest(String path, String body) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getRestEndpoint(path));
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setHeader('Accept', 'application/json');
        req.setBody(body);
        applyAuth(req);
        return req;
    }

    /**************************************************************************************
    * @Description  Builds a fully configured HttpRequest for a REST API PATCH operation.
    **************************************************************************************/
    @NamespaceAccessible
    public static HttpRequest buildRestPatchRequest(String path, String body) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getRestEndpoint(path));
        req.setMethod('PATCH');
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setHeader('Accept', 'application/json');
        req.setBody(body);
        applyAuth(req);
        return req;
    }

    /**************************************************************************************
    * @Description  Builds a fully configured HttpRequest for the Limits API.
    **************************************************************************************/
    @NamespaceAccessible
    public static HttpRequest buildLimitsRequest() {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getLimitsEndpoint());
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');
        applyAuth(req);
        return req;
    }
}
