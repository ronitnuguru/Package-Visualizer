@IsTest
private class HeadlessJourneyLauncherControllerTest {
    private class TrustedUrlCallout implements HttpCalloutMock {
        private Integer statusCode;

        TrustedUrlCallout(Integer statusCode) {
            this.statusCode = statusCode;
        }

        public HttpResponse respond(HttpRequest request) {
            Assert.areEqual('POST', request.getMethod());
            Assert.areEqual(URL.getOrgDomainUrl().toExternalForm() + '/services/data/v68.0/tooling/sobjects/CspTrustedSite', request.getEndpoint());
            Map<String, Object> fields = (Map<String, Object>) JSON.deserializeUntyped(request.getBody());
            Assert.areEqual(new Map<String, Object>{
                'DeveloperName' => 'HeadlessJourneyFrame',
                'EndpointUrl' => 'https://subscriber--pkgviz.scratch.my.salesforce.app',
                'Context' => 'LEX',
                'IsActive' => true,
                'IsApplicableToFrameSrc' => true,
                'IsApplicableToImgSrc' => false
            }, fields);
            HttpResponse response = new HttpResponse();
            response.setStatusCode(statusCode);
            return response;
        }
    }

    @IsTest
    static void createsFrameOnlyTrustedUrlInSameOrg() {
        Test.setMock(HttpCalloutMock.class, new TrustedUrlCallout(201));
        Test.startTest();
        HeadlessJourneyLauncherController.insertTrustedUrl('https://subscriber--pkgviz.scratch.my.salesforce.app');
        Assert.areEqual(1, Limits.getCallouts());
        Test.stopTest();
    }

    @IsTest
    static void reportsAnUnconfirmedApiWrite() {
        Test.setMock(HttpCalloutMock.class, new TrustedUrlCallout(403));
        try {
            HeadlessJourneyLauncherController.insertTrustedUrl('https://subscriber--pkgviz.scratch.my.salesforce.app');
            Assert.fail('An unsuccessful API response must be reported.');
        } catch (AuraHandledException expected) {
            Assert.areEqual(1, Limits.getCallouts());
        }
    }

    @IsTest
    static void rejectsCreationWithoutSetupPermissions() {
        Profile profile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User standardUser = new User(
            Alias = 'siteuser', Email = 'siteuser@example.com', EmailEncodingKey = 'UTF-8',
            LastName = 'Site User', LanguageLocaleKey = 'en_US', LocaleSidKey = 'en_US',
            ProfileId = profile.Id, TimeZoneSidKey = 'America/Los_Angeles',
            Username = 'journey.' + String.valueOf(Datetime.now().getTime()) + '@example.com'
        );
        insert standardUser;
        System.runAs(standardUser) {
            try {
                HeadlessJourneyLauncherController.createJourneyTrustedUrl();
                Assert.fail('Only admins with both setup permissions can create a Trusted URL.');
            } catch (AuraHandledException expected) {
                Assert.areEqual(0, Limits.getCallouts());
            }
        }
    }

    @IsTest
    static void acceptsSalesforceAppUrls() {
        String developmentUrl = 'https://dev--c.my.salesforce.app/app/c__HeadlessJourney';
        String subscriberUrl = 'https://subscriber--pkgviz.scratch.my.salesforce.app/app/pkgviz__HeadlessJourney';
        String subscriberDefaultRoute = 'https://subscriber--pkgviz.my.salesforce.app/app/c__HeadlessJourney';

        Assert.areEqual(developmentUrl, HeadlessJourneyLauncherController.validateStartUrl(developmentUrl, null));
        Assert.areEqual(subscriberUrl, HeadlessJourneyLauncherController.validateStartUrl(subscriberUrl, 'pkgviz'));
        Assert.areEqual(subscriberDefaultRoute, HeadlessJourneyLauncherController.validateStartUrl(subscriberDefaultRoute, 'pkgviz'));
    }

    @IsTest
    static void rejectsOtherOriginsAndApps() {
        for (String candidate : new List<String>{
            null,
            '/app/c__HeadlessJourney',
            'http://dev--c.my.salesforce.app/app/c__HeadlessJourney',
            'https://dev--c.my.salesforce.app.example.com/app/c__HeadlessJourney',
            'https://other.example@dev--c.my.salesforce.app/app/c__HeadlessJourney',
            'https://dev--c.my.salesforce.app/app/other__HeadlessJourney',
            'https://dev--c.my.salesforce.app/app/c__OtherApp'
        }) {
            Assert.isNull(HeadlessJourneyLauncherController.validateStartUrl(candidate, 'pkgviz'), 'Unexpected launch URL: ' + candidate);
        }
    }

    @IsTest
    static void resolvesOnlyTheAccessibleJourney() {
        String launchUrl = HeadlessJourneyLauncherController.getJourneyUrl();
        if (launchUrl != null) {
            Assert.isTrue(launchUrl.endsWith('__HeadlessJourney'), 'Only the Journey app should be returned.');
        }
    }
}
