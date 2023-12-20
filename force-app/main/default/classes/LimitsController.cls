public with sharing class LimitsController {

    @AuraEnabled(cacheable=true)
    public static String getLimits(){

        try {
            HTTPRequest req = new HTTPRequest();
            req.setEndpoint(Package2Interface.getBaseURL('limits'));
            req.setMethod('GET');
            req.setHeader('Authorization', 'Bearer ' + Package2Interface.getSessionId());
            req.setHeader('Content-Type', 'application/json');
            Http h = new Http();
            HttpResponse res = h.send(req);
            if (res.getStatusCode() == 200) {
                String result = res.getBody();
                return result;
            } else if (res.getStatusCode() == 401){
                String result = res.getBody();
                return 'Error';
            }
             else {
                return 'Error';
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}