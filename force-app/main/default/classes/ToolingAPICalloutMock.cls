/*******************************************************************************************
* @Name         ToolingAPICalloutMock 
* @Date         11/10/2020
* @Description  Used for mocking tooling API calls from test classes.  
*******************************************************************************************/

@isTest
public with sharing class ToolingAPICalloutMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            if (req.getEndpoint().contains('from+Package2Version')) {
            //Package2Version Success
                res.setBody('{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"Package2Version","records":[{"attributes":{"type":"Package2Version","url":"/services/data/v57.0/tooling/sobjects/Package2Version/05i000000000000AAA"},"Id":"05i000000000000AAA","Branch":null,"Description":null,"IsDeprecated":false,"IsPasswordProtected":false,"IsReleased":false,"MajorVersion":0,"MinorVersion":1,"PatchVersion":0,"BuildNumber":2,"Tag":null,"Name":"ver 0.1","Package2Id":"0Ho000000000000AAA","SubscriberPackageVersionId":"04t000000000000AAA","AncestorId":null,"ValidationSkipped":false}]}');
                res.setStatusCode(200);
            }
            else if (req.getEndpoint().contains('FROM+Package2')) {
            //Package2 Success
                res.setBody('{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"Package2","records":[{"attributes":{"type":"Package2","url":"/services/data/v57.0/tooling/sobjects/Package2/0Ho000000000000AAA"},"Id":"0Ho000000000000AAA","ContainerOptions":"Unlocked","Description":"Dummy App","IsDeprecated":false,"Name":"DummyApp","NamespacePrefix":null,"SubscriberPackageId":"033000000000000AAA"}]}');
                res.setStatusCode(200);
            }
            else {
                //Failure
                res.setStatusCode(401);
                res.setStatus('Authorization Failed');
            }
            return res;
        }

}