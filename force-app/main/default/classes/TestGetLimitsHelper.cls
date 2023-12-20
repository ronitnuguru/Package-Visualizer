@isTest
private class TestGetLimitsHelper {

    @isTest
    static void testGetLimitsSuccess() {
        // Create a mock HTTP response for a successful call
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(200);
        mockResponse.setBody('{"limit": 100}');

        // Set up a mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(mockResponse));

        // Call the getLimits method and assert the result
        String result = LimitsController.getLimits();
        System.assertEquals('{"limit": 100}', result);
    }

    @isTest
    static void testGetLimitsUnauthorized() {
        // Create a mock HTTP response for an unauthorized call
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(401);
        mockResponse.setBody('Unauthorized');

        // Set up a mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(mockResponse));

        // Call the getLimits method and assert the result
        String result = LimitsController.getLimits();
        System.assertEquals('Error', result);
    }

    @isTest
    static void testGetLimitsError() {
        // Create a mock HTTP response for an error
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(500);
        mockResponse.setBody('Server Error');

        // Set up a mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(mockResponse));

        // Call the getLimits method and assert the result
        String result = LimitsController.getLimits();
        System.assertEquals('Error', result);
    }

    // Mock HTTP callout class
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        private HttpResponse response;

        MockHttpResponseGenerator(HttpResponse response) {
            this.response = response;
        }

        public HttpResponse respond(HttpRequest request) {
            return response;
        }
    }
}