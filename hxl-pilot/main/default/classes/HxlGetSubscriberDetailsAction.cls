/**
 * Reads one PackageSubscriber org by OrgKey for conversational drill-down.
 * Mirrors HxlGetPackageDetailsAction pattern for consistent navigation contracts.
 */
global with sharing class HxlGetSubscriberDetailsAction {
  /**
   * Retrieves subscriber details for a Slackbot HXL selection.
   *
   * @param requests One orgKey per request
   * @return A response for each requested subscriber
   */
  @InvocableMethod(
    label='Get Package Subscriber Details'
    description='Returns subscriber organization information for a PackageSubscriber OrgKey. Does not return installation history or custom objects.'
    category='Package Visualizer'
    callout=true
  )
  global static List<Response> getSubscriberDetails(List<Request> requests) {
    List<String> orgKeys = new List<String>();
    if (requests != null) {
      for (Request request : requests) {
        orgKeys.add(request?.orgKey);
      }
    }
    List<Response> responses = new List<Response>();
    for (
      HxlSubscriberDetailResult result : HxlSubscriberReadService.getSubscriberDetails(
        orgKeys
      )
    ) {
      Response response = new Response();
      response.result = result;
      response.isSuccess = HxlSubscriberReadService.isSuccessfulState(
        result.state
      );
      response.errorType = response.isSuccess ? null : result.state;
      response.errorMessage = response.isSuccess ? null : result.message;
      responses.add(response);
    }
    return responses;
  }

  /** Input parameters for the detail action. */
  global class Request {
    @InvocableVariable(
      label='Organization Key'
      description='PackageSubscriber OrgKey field value'
      required=true
    )
    global String orgKey;
  }

  /** Typed result and standardized outcome fields for the detail action. */
  global class Response {
    @InvocableVariable(
      label='Success'
      description='Whether the subscriber details were retrieved successfully.'
    )
    global Boolean isSuccess;

    @InvocableVariable(
      label='Error Message'
      description='Safe message when the subscriber details could not be retrieved.'
    )
    global String errorMessage;

    @InvocableVariable(
      label='Error Type'
      description='Controlled subscriber-read state when the details could not be retrieved.'
    )
    global String errorType;

    @InvocableVariable(label='Subscriber Details')
    global HxlSubscriberDetailResult result;
  }
}
