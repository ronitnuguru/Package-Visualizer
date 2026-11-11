/** Collection transport and strict result parsing for prepared push upgrades. */
public with sharing class PushUpgradeSubmissionService {
  private static final Integer CHUNK_SIZE = 200;
  private static final Integer CALLOUT_TIMEOUT_MS = 120000;

  /**
   * Stages jobs only while the parent is Created; never dispatches it.
   * @param requestId PackagePushRequest ID.
   * @param orgKeys Distinct subscriber organization IDs, at most 200.
   * @return JSON array of per-org submission results.
   */
  public static String stage(String requestId, List<String> orgKeys) {
    if (!isId(requestId, '0DV')) {
      throw stagingError('A valid PackagePushRequest ID is required.');
    }
    List<String> normalizedKeys = validateKeys(orgKeys);
    verifyCreated(requestId);
    HttpResponse response = submitCollection(
      requestId,
      normalizedKeys,
      0,
      normalizedKeys.size()
    );
    if (response.getStatusCode() != 200) {
      throw stagingError(
        'Job submission failed (HTTP ' +
          response.getStatusCode() +
          '). Reconcile the request before retrying.'
      );
    }
    return JSON.serialize(parseResults(response.getBody(), normalizedKeys));
  }

  /**
   * Shared collection transport for the UI and headless submission paths.
   * @param requestId Parent request ID.
   * @param orgKeys Subscriber IDs in original collection order.
   * @param startIndex Inclusive collection offset.
   * @param endIndex Exclusive collection offset.
   * @return Unmodified collection HTTP response.
   */
  public static HttpResponse submitCollection(
    String requestId,
    List<String> orgKeys,
    Integer startIndex,
    Integer endIndex
  ) {
    List<ObjectWrappers.PackagePushJobWrapper> jobs = new List<ObjectWrappers.PackagePushJobWrapper>();
    ObjectWrappers.ObjectAttributes attributes = new ObjectWrappers.ObjectAttributes();
    attributes.type = 'PackagePushJob';
    for (Integer i = startIndex; i < endIndex; i++) {
      ObjectWrappers.PackagePushJobWrapper job = new ObjectWrappers.PackagePushJobWrapper();
      job.PackagePushRequestId = requestId;
      job.SubscriberOrganizationKey = orgKeys[i];
      job.attributes = attributes;
      jobs.add(job);
    }
    return send(
      'composite/sobjects',
      'POST',
      JSON.serialize(
        new Map<String, Object>{ 'allOrNone' => false, 'records' => jobs }
      )
    );
  }

  private static List<String> validateKeys(List<String> keys) {
    if (keys == null || keys.isEmpty() || keys.size() > CHUNK_SIZE) {
      throw stagingError('Provide one to 200 subscriber org IDs per chunk.');
    }
    Set<String> seen = new Set<String>();
    List<String> normalized = new List<String>();
    for (String rawKey : keys) {
      String key = rawKey == null ? null : rawKey.trim();
      if (!isId(key, '00D') || seen.contains(key.left(15))) {
        throw stagingError('Subscriber org IDs must be valid and distinct.');
      }
      seen.add(key.left(15));
      normalized.add(key);
    }
    return normalized;
  }

  private static Boolean isId(String value, String prefix) {
    return value != null &&
      Pattern.matches(
        '^' + prefix + '[a-zA-Z0-9]{12}([a-zA-Z0-9]{3})?$',
        value
      );
  }

  private static void verifyCreated(String requestId) {
    HttpResponse response = send(
      'sobjects/PackagePushRequest/' + requestId + '?fields=Id,Status',
      'GET',
      null
    );
    if (response.getStatusCode() != 200) {
      throw stagingError('The prepared request could not be verified.');
    }
    Object parsed = parseJson(response.getBody());
    if (
      !(parsed instanceof Map<String, Object>) ||
      ((Map<String, Object>) parsed).get('Status') != 'Created'
    ) {
      throw stagingError(
        'Jobs can only be staged for a request in Created status.'
      );
    }
  }

  private static List<Object> parseResults(String body, List<String> keys) {
    Object parsed = parseJson(body);
    if (
      !(parsed instanceof List<Object>) ||
      ((List<Object>) parsed).size() != keys.size()
    ) {
      throw stagingError(
        'Incomplete job submission response. Reconcile the request before retrying.'
      );
    }
    List<Object> results = new List<Object>();
    List<Object> rows = (List<Object>) parsed;
    for (Integer i = 0; i < rows.size(); i++) {
      if (!(rows[i] instanceof Map<String, Object>)) {
        throw stagingError('Invalid job submission result.');
      }
      Map<String, Object> row = (Map<String, Object>) rows[i];
      Object success = row.get('success');
      Object jobId = row.get('id');
      if (
        !(success instanceof Boolean) ||
        !(row.get('errors') instanceof List<Object>) ||
        (success == true &&
        (!(jobId instanceof String) || String.isBlank((String) jobId)))
      ) {
        throw stagingError(
          'Invalid job submission result. Reconcile the request before retrying.'
        );
      }
      results.add(
        new Map<String, Object>{
          'orgKey' => keys[i],
          'jobId' => jobId,
          'success' => success,
          'errors' => sanitizeErrors((List<Object>) row.get('errors'))
        }
      );
    }
    return results;
  }

  private static List<Object> sanitizeErrors(List<Object> errors) {
    List<Object> sanitized = new List<Object>();
    for (Object value : errors) {
      if (!(value instanceof Map<String, Object>)) {
        throw stagingError('Invalid job submission error details.');
      }
      Map<String, Object> error = (Map<String, Object>) value;
      String message = error.get('message') instanceof String
        ? (String) error.get('message')
        : 'Job submission failed.';
      sanitized.add(
        new Map<String, Object>{
          'statusCode' => error.get('statusCode'),
          'message' => message.left(1000)
        }
      );
    }
    return sanitized;
  }

  private static Object parseJson(String body) {
    try {
      return JSON.deserializeUntyped(body);
    } catch (System.JSONException e) {
      throw stagingError(
        'Invalid submission response. Reconcile the request before retrying.'
      );
    }
  }

  private static HttpResponse send(
    String resource,
    String method,
    String body
  ) {
    HttpRequest request = new HttpRequest();
    request.setEndpoint(
      Package2Interface.getApiHost() + '/services/data/v57.0/' + resource
    );
    request.setMethod(method);
    request.setTimeout(CALLOUT_TIMEOUT_MS);
    Package2Interface.applyAuth(request);
    request.setHeader('Content-Type', 'application/json;charset=UTF-8');
    request.setHeader('Accept', 'application/json');
    if (body != null)
      request.setBody(body);
    try {
      return new Http().send(request);
    } catch (System.CalloutException e) {
      throw stagingError(
        'Push API callout failed. Reconcile the request before retrying.'
      );
    }
  }

  private static AuraHandledException stagingError(String message) {
    AuraHandledException error = new AuraHandledException(message);
    error.setMessage(message);
    return error;
  }
}
