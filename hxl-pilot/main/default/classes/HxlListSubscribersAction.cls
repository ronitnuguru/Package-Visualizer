/**
 * Lists PackageSubscriber orgs filtered by package or version ID for HXL navigation.
 * Mirrors HxlListPackagesAction pattern for consistent invocable method contracts.
 */
global with sharing class HxlListSubscribersAction {
  /**
   * Lists subscribers for a Slackbot HXL page.
   *
   * @param requests One filter + optional cursor per requested page
   * @return A response for each requested page
   */
  @InvocableMethod(
    label='List Package Subscribers'
    description='Lists PackageSubscriber orgs filtered by 033 package ID or 04t version ID, ten per page. Pass only the continuation cursor returned by this action to get the next page.'
    category='Package Visualizer'
    callout=true
  )
  global static List<Response> listSubscribers(List<Request> requests) {
    List<String> filters = new List<String>();
    List<String> cursors = new List<String>();
    if (requests != null) {
      for (Request request : requests) {
        filters.add(request?.packageFilter);
        cursors.add(request?.cursor);
      }
    }
    List<Response> responses = new List<Response>();
    for (
      HxlSubscriberListResult result : HxlSubscriberReadService.listSubscribers(
        filters,
        cursors
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

  /** Input parameters for the list action. */
  global class Request {
    @InvocableVariable(
      label='Package Filter'
      description='033 Subscriber Package ID or 04t Subscriber Package Version ID'
      required=true
    )
    global String packageFilter;

    @InvocableVariable(
      label='Continuation Cursor'
      description='Leave blank for the first page. Otherwise pass the exact nextCursor returned by the previous list result.'
    )
    global String cursor;
  }

  /** Typed result and standardized outcome fields for the list action. */
  global class Response {
    @InvocableVariable(
      label='Success'
      description='Whether the subscriber page was retrieved successfully.'
    )
    global Boolean isSuccess;

    @InvocableVariable(
      label='Error Message'
      description='Safe message when the page could not be retrieved.'
    )
    global String errorMessage;

    @InvocableVariable(
      label='Error Type'
      description='Controlled subscriber-read state when the page could not be retrieved.'
    )
    global String errorType;

    @InvocableVariable(label='Subscriber List')
    global HxlSubscriberListResult result;
  }
}
