public without sharing class DemoTrialsController {
    
    @AuraEnabled(cacheable=true)
    public static Map<String, ConnectApi.ManagedContentNodeValue> getContent(String contentId, Integer page, Integer pageSize, String language, String filterby) {
        try {String networkId = Network.getNetworkId();ConnectApi.ManagedContentVersionCollection contentCollection = ConnectApi.ManagedContent.getManagedContentByContentKeys(networkId, new List<String>{ contentId }, 0, 1, language, filterby, false);return contentCollection.items[0].contentNodes;
        } catch (ConnectApi.ConnectApiException e) {Map<String, ConnectApi.ManagedContentNodeValue> mcnvMap = new Map<String, ConnectApi.ManagedContentNodeValue>();return mcnvMap;}
    }

    @AuraEnabled(cacheable=false)
    public static String createSignupTrial(String firstName, String lastName, String email, String userName, String company, String myDomain, String country, String preferredLanguage, String templateId, Integer trialDays, Boolean isSignupEmailSuppressed, Boolean shouldConnectToEnvHub, String signupSource){
        if(isSignupRequest() == true){
            return insertSignup(firstName, lastName, email, userName, company, myDomain, country, preferredLanguage, templateId, trialDays, isSignupEmailSuppressed, shouldConnectToEnvHub, signupSource); } else {throw new AuraHandledException('Unable to create org. Log a support case in the Salesforce Partner Community to enable the SignupRequest API in your Partner Business Org (PBO)');}
    }

    private static string insertSignup(String firstName, String lastName, String email, String userName, String company, String myDomain, String country, String preferredLanguage, String templateId, Integer trialDays, Boolean isSignupEmailSuppressed, Boolean shouldConnectToEnvHub, String signupSource){
        SObjectType sObjectType = Schema.getGlobalDescribe().get('SignupRequest');Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();Map<String,Schema.SObjectField> fieldsMap = describeResult.fields.getMap();SObject signupRequest = sObjectType.newSObject();
        try {
            signupRequest.put('FirstName', String.escapeSingleQuotes(firstName)); signupRequest.put('LastName', String.escapeSingleQuotes(lastName)); signupRequest.put('SignupEmail', String.escapeSingleQuotes(email)); signupRequest.put('Username', String.escapeSingleQuotes(userName)); signupRequest.put('Company', String.escapeSingleQuotes(company));signupRequest.put('Country', String.escapeSingleQuotes(country));signupRequest.put('IsSignupEmailSuppressed', Boolean.valueOf(isSignupEmailSuppressed));signupRequest.put('ShouldConnectToEnvHub', Boolean.valueOf(shouldConnectToEnvHub));
            if( myDomain != null){signupRequest.put('Subdomain', String.escapeSingleQuotes(myDomain));} if(signupSource != null){signupRequest.put('SignupSource', String.escapeSingleQuotes(signupSource));} if(trialDays != null){signupRequest.put('TrialDays', Integer.valueOf(trialDays));} if(preferredLanguage != null){signupRequest.put('PreferredLanguage', String.escapeSingleQuotes(preferredLanguage));}if(String.isNotBlank(templateId)){signupRequest.put('TemplateId', String.escapeSingleQuotes(templateId));} insert signupRequest; return String.valueOf(signupRequest);
        } catch (Exception e) {throw new AuraHandledException(e.getMessage());}
    }

    @AuraEnabled(cacheable=true)
    public static boolean isSignupRequest() { return (Type.forName('SignupRequest') != null); }
}