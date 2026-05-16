/*******************************************************************************************
 * @Name         PushUpgradesCalloutMock
 * @Date         03/08/2021
 * @Description  Used for mocking PushUpgrades calls from test classes.
 *******************************************************************************************/
@isTest
public with sharing class PushUpgradesCalloutMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        System.debug('# End Point:' + req.getEndpoint());
        if (req.getEndpoint().contains('sobjects/PackagePushRequest/0Ho000000000000AAA')) {
            res.setBody('{success}');
            res.setStatusCode(204);
        } else if (req.getEndpoint().contains('sobjects/PackagePushRequest')) {
            res.setBody('{Specify a package that has passed the AppExchange security review.}');
            res.setStatusCode(400);
        } else if (req.getEndpoint().contains('composite/sobjects')) {
            // composite/sobjects returns a JSON array of per-record results.
            // PushUpgradesInterface.countSuccesses parses this body to detect
            // partial / total failures, so the response must be valid JSON
            // with at least one success:true element to model the happy path.
            res.setBody('[{"id":"0DX000000000001AAA","success":true,"errors":[]}]');
            res.setStatusCode(200);
        }
        return res;
    }
}