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
    // NOTE: these two branches MUST precede the 'FROM+Package2' branch below —
    // 'FROM+Package2VersionCreateRequest' contains 'FROM+Package2' as a prefix, and
    // 'FROM+Package2VersionCreateRequestError' contains 'FROM+Package2VersionCreateRequest',
    // so the more specific (Error) endpoint must be matched first.
    if (req.getEndpoint().contains('FROM+Package2VersionCreateRequestError')) {
      //Package2VersionCreateRequestError Success — one error row tied to the
      //failed create request 08c000000000000AAA below.
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"Package2VersionCreateRequestError","records":[{"attributes":{"type":"Package2VersionCreateRequestError","url":"/services/data/v67.0/tooling/sobjects/Package2VersionCreateRequestError/08d000000000000AAA"},"Id":"08d000000000000AAA","Message":"Verification failed: Apex code coverage is below 75%.","ParentRequestId":"08c000000000000AAA"}]}'
      );
      res.setStatusCode(200);
    } else if (
      req.getEndpoint().contains('FROM+Package2VersionCreateRequest')
    ) {
      //Package2VersionCreateRequest Success — exercises the
      //getPackage2VersionCreateRequests record-processing loop.
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"Package2VersionCreateRequest","records":[{"attributes":{"type":"Package2VersionCreateRequest","url":"/services/data/v67.0/tooling/sobjects/Package2VersionCreateRequest/08c000000000000AAA"},"Id":"08c000000000000AAA","Status":"Success","Package2Id":"0Ho000000000000AAA","Package2VersionId":"05i000000000000AAA","Branch":"main","Tag":"v1.0","AsyncValidation":false,"CalculateCodeCoverage":true,"CalcTransitiveDependencies":false,"SkipValidation":false,"IsDevUsePkgZipRequested":false,"IsPasswordProtected":false,"IsConversionRequest":false,"Language":"en_US","CreatedBy":{"Name":"Test User"},"CreatedDate":"2024-01-01T00:00:00.000+0000","SystemModstamp":"2024-01-01T00:00:00.000+0000"}]}'
      );
      res.setStatusCode(200);
    } else if (req.getEndpoint().contains('from+Package2Version')) {
      //Package2Version Success
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"Package2Version","records":[{"attributes":{"type":"Package2Version","url":"/services/data/v57.0/tooling/sobjects/Package2Version/05i000000000000AAA"},"Id":"05i000000000000AAA","Branch":null,"Description":null,"IsDeprecated":false,"IsPasswordProtected":false,"IsReleased":false,"MajorVersion":0,"MinorVersion":1,"PatchVersion":0,"BuildNumber":2,"Tag":null,"Name":"ver 0.1","Package2Id":"0Ho000000000000AAA","SubscriberPackageVersionId":"04t000000000000AAA","AncestorId":null,"ValidationSkipped":false}]}'
      );
      res.setStatusCode(200);
    } else if (req.getEndpoint().contains('FROM+Package2')) {
      //Package2 Success
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"Package2","records":[{"attributes":{"type":"Package2","url":"/services/data/v57.0/tooling/sobjects/Package2/0Ho000000000000AAA"},"Id":"0Ho000000000000AAA","ContainerOptions":"Unlocked","Description":"Dummy App","IsDeprecated":false,"Name":"DummyApp","NamespacePrefix":null,"SubscriberPackageId":"033000000000000AAA"}]}'
      );
      res.setStatusCode(200);
    } else if (
      req.getEndpoint().contains('FROM+SubscriberPackageVersion') ||
      req.getEndpoint().contains('Dependencies+FROM+SubscriberPackageVersion')
    ) {
      //SubscriberPackageVersion with Dependencies Success
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"SubscriberPackageVersion","records":[{"attributes":{"type":"SubscriberPackageVersion","url":"/services/data/v61.0/tooling/sobjects/SubscriberPackageVersion/04t000000000000AAA"},"Dependencies":{"ids":[{"subscriberPackageVersionId":"04t000000000001BBB"},{"subscriberPackageVersionId":"04t000000000002CCC"}]}}]}'
      );
      res.setStatusCode(200);
    } else if (req.getEndpoint().contains('FROM+InstalledSubscriberPackage')) {
      //InstalledSubscriberPackage Success — exercises getInstalledPackages /
      //verifyUnlockedPackageInstalled record-processing loops
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"InstalledSubscriberPackage","records":[{"attributes":{"type":"InstalledSubscriberPackage","url":"/services/data/v61.0/tooling/sobjects/InstalledSubscriberPackage/0A3000000000000AAA"},"Id":"0A3000000000000AAA","SubscriberPackageId":"033000000000000AAA","SubscriberPackageVersionId":"04t000000000000AAA"}]}'
      );
      res.setStatusCode(200);
    } else if (req.getEndpoint().contains('FROM+MetadataPackage')) {
      //MetadataPackage (1GP) Success — exercises getPackage1 record-processing loop
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"MetadataPackage","records":[{"attributes":{"type":"MetadataPackage","url":"/services/data/v61.0/tooling/sobjects/MetadataPackage/03300000000000AAA"},"Id":"03300000000000AAA","Name":"Dummy 1GP","NamespacePrefix":"dummyns","PackageCategory":"Package","SystemModstamp":"2024-01-01T00:00:00.000+0000"}]}'
      );
      res.setStatusCode(200);
    } else if (req.getEndpoint().contains('FROM+ApexClass')) {
      //ApexClass Success — the universal Tooling object the wizard's
      //"Test & Confirm" (testNamedCredentialCallout) queries to prove the secure
      //connection in any org, Dev Hub or not.
      res.setBody(
        '{"size":1,"totalSize":1,"done":true,"queryLocator":null,"entityTypeName":"ApexClass","records":[{"attributes":{"type":"ApexClass","url":"/services/data/v61.0/tooling/sobjects/ApexClass/01p000000000000AAA"},"Id":"01p000000000000AAA"}]}'
      );
      res.setStatusCode(200);
    } else if (req.getEndpoint().contains('FROM+ExternalServiceRegistration')) {
      //ExternalServiceRegistration (MCP servers) Success — two records exercise
      //the getMcpServers parse loop: one valid DeepWiki schema and one whose
      //Schema is malformed JSON, proving a bad schema sets schemaParseFailed
      //without breaking the whole list. The embedded Schema string is the
      //JSON-escaped schema document (each " in the doc is written as \" in the
      //response body, i.e. \\" inside this Apex literal).
      res.setBody(
        '{"size":2,"totalSize":2,"done":true,"queryLocator":null,"entityTypeName":"ExternalServiceRegistration","records":[' +
          '{"attributes":{"type":"ExternalServiceRegistration","url":"/services/data/v61.0/tooling/sobjects/ExternalServiceRegistration/0Xq000000000001AAA"},"Id":"0Xq000000000001AAA","MasterLabel":"DeepWikiAgentExchange","DeveloperName":"DeepWikiAgentExchange","Description":"DeepWiki MCP server","NamedCredential":"DeepWikiAgentExchange","Status":"Complete","Schema":"{\\"serverDescriptor\\":{\\"protocolVersion\\":\\"2025-11-25\\",\\"serverInfo\\":{\\"name\\":\\"DeepWiki\\",\\"version\\":\\"2.14.3\\"},\\"instructions\\":\\"Ask DeepWiki\\"},\\"tools\\":[{\\"name\\":\\"ask_question\\",\\"description\\":\\"Ask a question about a repo\\",\\"inputSchema\\":{\\"properties\\":{\\"repoName\\":{\\"type\\":\\"string\\"},\\"question\\":{\\"type\\":\\"string\\"}},\\"required\\":[\\"repoName\\",\\"question\\"],\\"type\\":\\"object\\"},\\"outputSchema\\":{\\"properties\\":{\\"result\\":{\\"type\\":\\"string\\"}},\\"required\\":[\\"result\\"],\\"type\\":\\"object\\",\\"x-fastmcp-wrap-result\\":true}}],\\"resources\\":[]}"},' +
          '{"attributes":{"type":"ExternalServiceRegistration","url":"/services/data/v61.0/tooling/sobjects/ExternalServiceRegistration/0Xq000000000002BBB"},"Id":"0Xq000000000002BBB","MasterLabel":"BrokenServer","DeveloperName":"BrokenServer","Description":"Malformed schema server","NamedCredential":"BrokenServer","Status":"Complete","Schema":"{not valid"}' +
          ']}'
      );
      res.setStatusCode(200);
    } else if (req.getEndpoint().contains('FROM+GenAiFunctionDefinition')) {
      //GenAiFunctionDefinition (accepted MCP tools) Success — three mcpTool
      //functions whose MasterLabel suffix "<tool> - DeepWikiAgentExchange"
      //correlates them to the DeepWikiAgentExchange ESR above. None end with
      //" - BrokenServer", so BrokenServer stays tool-less. Only ask_question
      //is declared in the ESR Schema, so the other two get empty I/O but are
      //still wired.
      res.setBody(
        '{"size":3,"totalSize":3,"done":true,"queryLocator":null,"entityTypeName":"GenAiFunctionDefinition","records":[' +
          '{"attributes":{"type":"GenAiFunctionDefinition","url":"/services/data/v61.0/tooling/sobjects/GenAiFunctionDefinition/a03e6bc51a04135009c34ba31664837d4"},"DeveloperName":"a03e6bc51a04135009c34ba31664837d4","MasterLabel":"ask_question - DeepWikiAgentExchange","Description":"Ask any question about a GitHub repository.","InvocationTargetType":"mcpTool"},' +
          '{"attributes":{"type":"GenAiFunctionDefinition","url":"/services/data/v61.0/tooling/sobjects/GenAiFunctionDefinition/a7c219cf2c38f39fab681fad2522dfe8a"},"DeveloperName":"a7c219cf2c38f39fab681fad2522dfe8a","MasterLabel":"read_wiki_contents - DeepWikiAgentExchange","Description":"View documentation about a GitHub repository.","InvocationTargetType":"mcpTool"},' +
          '{"attributes":{"type":"GenAiFunctionDefinition","url":"/services/data/v61.0/tooling/sobjects/GenAiFunctionDefinition/aa031583691bb3a808b7f47a10d5bffca"},"DeveloperName":"aa031583691bb3a808b7f47a10d5bffca","MasterLabel":"read_wiki_structure - DeepWikiAgentExchange","Description":"Get a list of documentation topics.","InvocationTargetType":"mcpTool"}' +
          ']}'
      );
      res.setStatusCode(200);
    } else {
      //Failure
      res.setStatusCode(401);
      res.setStatus('Authorization Failed');
    }
    return res;
  }

  public HTTPResponse cmsRespond(HTTPRequest req) {
    HttpResponse res = new HttpResponse();
    res.setStatusCode(500);
    res.setBody('{"message":"Mock exception"}');
    return res;
  }
}
