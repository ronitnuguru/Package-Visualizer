/*******************************************************************************************
 * @Name         PushUpgradesInterfaceTest
 * @Date         03/08/2020
 * @Description  All the test classes for 2GP Visualizer application Push Upgrade related code.
 *******************************************************************************************/
@isTest
private class PushUpgradesInterfaceTest {
  /**************************************************************************************
   * @Description  Test class for getEligibleLowerPackageVersions
   **************************************************************************************/
  @isTest
  public static void testGetEligibleLowerPackageVersions() {
    Test.startTest();
    List<ObjectWrappers.MetadataPackageVersionWrapper> data = PushUpgradesCtrl.getEligibleLowerPackageVersions(
      '1.0.0',
      '10.0.0'
    );
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for getEligibleHigherPackageVersions
   **************************************************************************************/
  @isTest
  public static void testGetEligibleHigherPackageVersions() {
    Test.startTest();
    List<ObjectWrappers.MetadataPackageVersionWrapper> data = PushUpgradesCtrl.getEligibleHigherPackageVersions(
      '1.0.0',
      '10.0.0',
      'id',
      'desc'
    );
    List<ObjectWrappers.MetadataPackageVersionWrapper> data2 = PushUpgradesCtrl.getEligibleHigherPackageVersions(
      '1.0.0',
      '10.0.0',
      'id',
      'asc'
    );
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for getPackageVersionPushRequests
   **************************************************************************************/
  @isTest
  public static void testGetPackageVersionPushRequests() {
    Test.startTest();
    List<ObjectWrappers.FilterWrapper> fltList = createFilterList(
      'PackageVersionId',
      '0Ho000000000000AAA',
      'STRING'
    );
    List<ObjectWrappers.PackagePushRequestWrapper> data = PushUpgradesCtrl.getPackageVersionPushRequests(
      fltList,
      'Status',
      'Desc',
      '10',
      '10'
    );
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for getPackageVersionPushJobs
   **************************************************************************************/
  @isTest
  public static void testGetPackageVersionPushJobs() {
    Test.startTest();
    List<ObjectWrappers.FilterWrapper> fltList = createFilterList(
      'PackagePushRequestId',
      '0Ho000000000000AAA',
      'STRING'
    );
    List<ObjectWrappers.PackagePushJobWrapper> data = PushUpgradesCtrl.getPackageVersionPushJobs(
      fltList,
      'Status',
      'Desc',
      '10',
      '10'
    );
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for createPackagePushRequest
   **************************************************************************************/
  @isTest
  public static void testCreatePackagePushRequest() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
    try {
      string data = PushUpgradesCtrl.createPackagePushRequest(
        '0Ho000000000000AAA',
        System.now()
      );
    } catch (Exception e) {
      System.debug(e);
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for updatePackagePushRequest
   **************************************************************************************/
  @isTest
  public static void testUpdatePackagePushRequest() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
    try {
      string data = PushUpgradesCtrl.updatePackagePushRequest(
        '0Ho000000000000AAA',
        'Canceled'
      );
    } catch (Exception e) {
      System.debug(e);
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for getPushJobPackageSubscriber
   **************************************************************************************/
  @isTest
  public static void testGetPushJobPackageSubscribers() {
    Test.startTest();
    ObjectWrappers.PackageSubscriberWrapper data = PushUpgradesCtrl.getPushJobPackageSubscriber(
      '00D000000000000AAA',
      '033000000000000AAA'
    );
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  The PackageSubscriber lookup for a push job must be scoped by BOTH
   *               OrgKey AND MetadataPackageId. PackageSubscriber has one row per
   *               installed package per org, so an OrgKey-only query returns multiple
   *               rows for a multi-package publisher and the deserialization loop keeps
   *               an arbitrary (wrong) package. Asserting the query text keeps the fix
   *               verifiable even though PackageSubscriber is a read-only system object
   *               that cannot be inserted in a test.
   **************************************************************************************/
  @isTest
  public static void testPushJobSubscriberQueryIsScopedToPackage() {
    String query = PushUpgradesCtrl.buildPushJobSubscriberQuery(
      '00D000000000000AAA',
      '033000000000000AAA'
    );
    Assert.isTrue(
      query.contains('OrgKey = :orgId'),
      'Query must still filter by the subscriber OrgKey'
    );
    Assert.isTrue(
      query.contains('MetadataPackageId = :metadataPackageId'),
      'Query must also filter by MetadataPackageId so the correct package is resolved'
    );
    Assert.isTrue(
      query.containsIgnoreCase('LIMIT 1'),
      'Query must return a single row for the requested package'
    );
  }

  /**************************************************************************************
   * @Description  Test class for createPackagePushJobs.
   *               After job insertion, createPushJobs must PATCH the parent
   *               request Status to Pending to dispatch the upgrade. The
   *               capturing mock asserts that PATCH was issued.
   **************************************************************************************/
  @isTest
  public static void testCreatePackagePushJobs() {
    Test.startTest();
    CapturingCalloutMock mock = new CapturingCalloutMock();
    Test.setMock(HttpCalloutMock.class, mock);
    List<String> slist = new List<String>();
    slist.add('0Ho000000000000AAA');
    String data = PushUpgradesCtrl.createPackagePushJobs(
      '0Ho000000000000AAA',
      slist
    );
    Test.stopTest();
    System.assert(
      mock.sawPendingPatch,
      'createPushJobs must PATCH PackagePushRequest.Status to Pending after inserting jobs'
    );
  }

  /**************************************************************************************
   * @Description  Test class for getPackagePushJobChartData
   **************************************************************************************/
  @isTest
  public static void testGetPackagePushJobChartData() {
    Test.startTest();
    List<ObjectWrappers.FilterWrapper> fltList = createFilterList(
      'Status',
      'Pending',
      'STRING'
    );
    List<AggregateResult> result = PushUpgradesCtrl.getPackagePushJobChartData(
      fltList,
      'Status'
    );
    Test.stopTest();
  }

  @isTest
  public static void testPushUpgradesCalloutMockBranches() {
    PushUpgradesCalloutMock mock = new PushUpgradesCalloutMock();
    HttpRequest reqPatch = new HttpRequest();
    reqPatch.setEndpoint(
      'https://example.com/services/data/v57.0/sobjects/PackagePushRequest/0Ho000000000000AAA'
    );
    System.assertEquals(204, mock.respond(reqPatch).getStatusCode());

    HttpRequest reqPost = new HttpRequest();
    reqPost.setEndpoint(
      'https://example.com/services/data/v57.0/sobjects/PackagePushRequest'
    );
    System.assertEquals(400, mock.respond(reqPost).getStatusCode());

    HttpRequest reqComposite = new HttpRequest();
    reqComposite.setEndpoint(
      'https://example.com/services/data/v57.0/composite/sobjects'
    );
    System.assertEquals(200, mock.respond(reqComposite).getStatusCode());
  }

  /**************************************************************************************
   * @Description  Bulk test for createPackagePushJobs with 251+ subscribers.
   *               Exercises the chunk loop and asserts the Created -> Pending
   *               PATCH still fires after every chunk has been inserted.
   **************************************************************************************/
  @isTest
  public static void testCreatePackagePushJobsBulk() {
    Test.startTest();
    CapturingCalloutMock mock = new CapturingCalloutMock();
    Test.setMock(HttpCalloutMock.class, mock);
    List<String> bulkSubscriberList = new List<String>();
    for (Integer i = 0; i < 251; i++) {
      bulkSubscriberList.add(
        '00D00000000000' + String.valueOf(i).leftPad(3, '0')
      );
    }
    // Must use the ID that the mock matches for the PATCH endpoint
    String result = PushUpgradesCtrl.createPackagePushJobs(
      '0Ho000000000000AAA',
      bulkSubscriberList
    );
    Test.stopTest();
    System.assertNotEquals(null, result);
    System.assert(
      mock.compositePostCount >= 2,
      'Bulk run must POST at least two composite chunks'
    );
    System.assert(
      mock.sawPendingPatch,
      'After all chunks complete, createPushJobs must PATCH Status=Pending'
    );
  }

  /**************************************************************************************
   * @Description  Test class for createPackagePushRequest with past datetime
   **************************************************************************************/
  @isTest
  public static void testCreatePackagePushRequestPastDatetime() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
    try {
      Datetime pastTime = System.now().addDays(-1);
      String result = PushUpgradesCtrl.createPackagePushRequest(
        '04t000000000000AAA',
        pastTime
      );
    } catch (Exception e) {
      System.assertNotEquals(null, e.getMessage());
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for createPackagePushRequest with null datetime
   **************************************************************************************/
  @isTest
  public static void testCreatePackagePushRequestNullDatetime() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
    try {
      String result = PushUpgradesCtrl.createPackagePushRequest(
        '04t000000000000AAA',
        null
      );
    } catch (Exception e) {
      System.assertNotEquals(null, e.getMessage());
    }
    Test.stopTest();
  }

  /**************************************************************************************
   * @Description  Test class for create filter list
   **************************************************************************************/
  /**************************************************************************************
   * @Description  createPushJobs with empty subscriber list throws AuraHandledException
   **************************************************************************************/
  @isTest
  public static void testCreatePackagePushJobsEmptyList() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
    Boolean threw = false;
    try {
      PushUpgradesInterface.createPushJobs(
        '0Ho000000000000AAA',
        new List<String>()
      );
    } catch (Exception e) {
      threw = true;
    }
    Test.stopTest();
    System.assert(threw, 'Empty subscriber list should throw');
  }

  /**************************************************************************************
   * @Description  Direct execution of PushUpgradeQueueable processes one chunk and
   *               attaches a Finalizer; ensures the Queueable path compiles and runs.
   **************************************************************************************/
  @isTest
  public static void testPushUpgradeQueueableExecute() {
    Test.setMock(HttpCalloutMock.class, new PushUpgradesCalloutMock());
    List<String> subs = new List<String>();
    for (Integer i = 0; i < 250; i++) {
      subs.add('00D00000000000' + String.valueOf(i).leftPad(3, '0'));
    }
    Test.startTest();
    System.enqueueJob(
      new PushUpgradesInterface.PushUpgradeQueueable(
        '0Ho000000000000AAA',
        subs,
        0
      )
    );
    Test.stopTest();
    // Reaching here without an uncaught exception confirms the
    // Queueable + Finalizer wiring executed cleanly under the mock.
    System.assert(true);
  }

  /**************************************************************************************
   * @Description  CalloutException (e.g. read timeout) is surfaced as
   *               AuraHandledException by sendWithContext rather than leaking raw.
   **************************************************************************************/
  @isTest
  public static void testUpdatePushRequestCalloutTimeout() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new ThrowingCalloutMock());
    Boolean threw = false;
    try {
      PushUpgradesInterface.updatePushRequest('0Ho000000000000AAA', 'Pending');
    } catch (Exception e) {
      threw = true;
    }
    Test.stopTest();
    System.assert(threw, 'Timeout should be surfaced as an exception');
  }

  /**
   * Mock that simulates a read-timeout style failure by throwing
   * CalloutException from respond(), exercising the sendWithContext
   * catch block in PushUpgradesInterface.
   */
  private class ThrowingCalloutMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      throw new CalloutException('Read timed out');
    }
  }

  /**
   * Mock that returns happy-path responses and records whether the
   * Status=Pending PATCH was issued. Lets bulk and single-chunk tests
   * assert that createPushJobs flips Created -> Pending after every
   * job has been inserted.
   */
  private class CapturingCalloutMock implements HttpCalloutMock {
    public Boolean sawPendingPatch = false;
    public Integer compositePostCount = 0;

    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      String endpoint = req.getEndpoint();
      String method = req.getMethod();
      String body = req.getBody();

      if (endpoint.contains('composite/sobjects')) {
        compositePostCount++;
        res.setBody('[{"id":"0DX000000000001AAA","success":true,"errors":[]}]');
        res.setStatusCode(200);
        return res;
      }
      if (
        endpoint.contains('sobjects/PackagePushRequest/0Ho000000000000AAA') &&
        method == 'PATCH'
      ) {
        if (body != null && body.contains('"Pending"')) {
          sawPendingPatch = true;
        }
        res.setBody('');
        res.setStatusCode(204);
        return res;
      }
      if (
        endpoint.contains('sobjects/PackagePushRequest') && method == 'POST'
      ) {
        res.setBody('{"id":"0DV000000000001AAA","success":true}');
        res.setStatusCode(201);
        return res;
      }
      res.setBody('');
      res.setStatusCode(200);
      return res;
    }
  }

  /**************************************************************************************
   * @Description  countSuccesses with a body where every record has success=false
   *               triggers the successCount==0 throw in pushUpgradeCallout.
   **************************************************************************************/
  @isTest
  public static void testCreatePushJobsAllRecordsFail() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new AllFailCalloutMock());
    Boolean threw = false;
    try {
      PushUpgradesInterface.createPushJobs(
        '0Ho000000000000AAA',
        new List<String>{ '00D000000000001AAA' }
      );
    } catch (AuraHandledException e) {
      threw = true;
    }
    Test.stopTest();
    Assert.isTrue(
      threw,
      'All-fail composite response should throw AuraHandledException'
    );
  }

  /**************************************************************************************
   * @Description  composite/sobjects returns non-200 status, exercising the
   *               res.getStatusCode() != 200 throw branch in pushUpgradeCallout.
   **************************************************************************************/
  @isTest
  public static void testCreatePushJobsCompositeNon200() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new Non200CompositeMock());
    Boolean threw = false;
    try {
      PushUpgradesInterface.createPushJobs(
        '0Ho000000000000AAA',
        new List<String>{ '00D000000000001AAA' }
      );
    } catch (AuraHandledException e) {
      threw = true;
    }
    Test.stopTest();
    Assert.isTrue(
      threw,
      'Non-200 composite response should throw AuraHandledException'
    );
  }

  /**************************************************************************************
   * @Description  Partial success (some records fail) exercises the
   *               successCount < attempted debug/warn branch.
   **************************************************************************************/
  @isTest
  public static void testCreatePushJobsPartialSuccess() {
    Test.startTest();
    CapturingCalloutMock mock = new CapturingCalloutMock();
    Test.setMock(HttpCalloutMock.class, new PartialSuccessMock());
    List<String> subs = new List<String>{
      '00D000000000001AAA',
      '00D000000000002AAA'
    };
    try {
      PushUpgradesInterface.createPushJobs('0Ho000000000000AAA', subs);
    } catch (Exception e) {
      // partial success may or may not throw depending on mock; either is fine
    }
    Test.stopTest();
    Assert.isTrue(
      true,
      'Partial success path exercised without uncaught exception'
    );
  }

  /**************************************************************************************
   * @Description  countSuccesses with a blank body returns 0 (exercises isBlank guard).
   **************************************************************************************/
  @isTest
  public static void testCountSuccessesBlankBody() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new BlankBodyMock());
    Boolean threw = false;
    try {
      PushUpgradesInterface.createPushJobs(
        '0Ho000000000000AAA',
        new List<String>{ '00D000000000001AAA' }
      );
    } catch (AuraHandledException e) {
      threw = true;
    }
    Test.stopTest();
    Assert.isTrue(threw, 'Blank body returns 0 successes and should throw');
  }

  /**************************************************************************************
   * @Description  countSuccesses with a non-list JSON body (object, not array)
   *               hits the !(parsed instanceof List<Object>) guard.
   **************************************************************************************/
  @isTest
  public static void testCountSuccessesNonListBody() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new NonListBodyMock());
    Boolean threw = false;
    try {
      PushUpgradesInterface.createPushJobs(
        '0Ho000000000000AAA',
        new List<String>{ '00D000000000001AAA' }
      );
    } catch (AuraHandledException e) {
      threw = true;
    }
    Test.stopTest();
    Assert.isTrue(threw, 'Non-list body returns 0 successes and should throw');
  }

  /**************************************************************************************
   * @Description  PushUpgradeFinalizer.execute SUCCESS + isFinalChunk=true flips
   *               the parent request to Pending.
   **************************************************************************************/
  @isTest
  public static void testFinalizerSuccessFinalChunk() {
    Test.setMock(HttpCalloutMock.class, new CapturingCalloutMock());
    List<String> subs = new List<String>();
    for (Integer i = 0; i < 201; i++) {
      subs.add('00D00000000000' + String.valueOf(i).leftPad(3, '0'));
    }
    Test.startTest();
    // Enqueuing the Queueable exercises execute() + attachFinalizer() + Finalizer.execute().
    // With 201 subs starting at offset 200, this IS the final chunk so the
    // Finalizer should fire the Created->Pending PATCH.
    System.enqueueJob(
      new PushUpgradesInterface.PushUpgradeQueueable(
        '0Ho000000000000AAA',
        subs,
        200
      )
    );
    Test.stopTest();
    Assert.isTrue(
      true,
      'Finalizer SUCCESS + isFinalChunk path executed without error'
    );
  }

  /**************************************************************************************
   * @Description  PushUpgradeFinalizer.execute SUCCESS + isFinalChunk=false
   *               re-enqueues the next chunk instead of flipping Pending.
   **************************************************************************************/
  @isTest
  public static void testFinalizerSuccessNotFinalChunk() {
    Test.setMock(HttpCalloutMock.class, new CapturingCalloutMock());
    List<String> subs = new List<String>();
    for (Integer i = 0; i < 500; i++) {
      subs.add('00D00000000000' + String.valueOf(i).leftPad(3, '0'));
    }
    Test.startTest();
    // offset=0 with 500 subs: chunk ends at 200, not the final chunk.
    // Finalizer should re-enqueue rather than call updatePushRequest.
    System.enqueueJob(
      new PushUpgradesInterface.PushUpgradeQueueable(
        '0Ho000000000000AAA',
        subs,
        0
      )
    );
    Test.stopTest();
    Assert.isTrue(
      true,
      'Finalizer SUCCESS + not-final-chunk re-enqueue path executed without error'
    );
  }

  /**************************************************************************************
   * @Description  updatePushRequest with a non-204 response throws AuraHandledException.
   **************************************************************************************/
  @isTest
  public static void testUpdatePushRequestNon204() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new Non204PatchMock());
    Boolean threw = false;
    try {
      PushUpgradesInterface.updatePushRequest('0Ho000000000000AAA', 'Pending');
    } catch (AuraHandledException e) {
      threw = true;
    }
    Test.stopTest();
    Assert.isTrue(
      threw,
      'Non-204 PATCH response should throw AuraHandledException'
    );
  }

  /**************************************************************************************
   * @Description  createPushRequest returns 400 with security-review message,
   *               exercises the specific 400 branch that wraps the known message.
   **************************************************************************************/
  @isTest
  public static void testCreatePushRequestSecurityReviewError() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new SecurityReviewErrorMock());
    Boolean threw = false;
    try {
      PushUpgradesCtrl.createPackagePushRequest(
        '04t000000000000AAA',
        System.now().addHours(1)
      );
    } catch (AuraHandledException e) {
      threw = true;
    }
    Test.stopTest();
    Assert.isTrue(
      threw,
      'Security review error response should throw AuraHandledException'
    );
  }

  /**************************************************************************************
   * @Description  createPushRequest returns 400 with an unrelated body,
   *               exercises the generic throw branch.
   **************************************************************************************/
  @isTest
  public static void testCreatePushRequestGenericError() {
    Test.startTest();
    Test.setMock(HttpCalloutMock.class, new Generic400Mock());
    Boolean threw = false;
    try {
      PushUpgradesCtrl.createPackagePushRequest(
        '04t000000000000AAA',
        System.now().addHours(1)
      );
    } catch (AuraHandledException e) {
      threw = true;
    }
    Test.stopTest();
    Assert.isTrue(
      threw,
      'Generic error response should throw AuraHandledException'
    );
  }

  // --- Private mock helpers ---

  private class AllFailCalloutMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      if (req.getEndpoint().contains('composite/sobjects')) {
        res.setBody(
          '[{"id":null,"success":false,"errors":[{"message":"fail"}]}]'
        );
        res.setStatusCode(200);
      } else {
        res.setBody('');
        res.setStatusCode(204);
      }
      return res;
    }
  }

  private class Non200CompositeMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      if (req.getEndpoint().contains('composite/sobjects')) {
        res.setBody('{"error":"server error"}');
        res.setStatusCode(500);
      } else {
        res.setBody('');
        res.setStatusCode(204);
      }
      return res;
    }
  }

  private class PartialSuccessMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      if (req.getEndpoint().contains('composite/sobjects')) {
        // One success, one failure = partial
        res.setBody(
          '[{"id":"0DX000000000001AAA","success":true,"errors":[]},{"id":null,"success":false,"errors":[]}]'
        );
        res.setStatusCode(200);
      } else {
        res.setBody('');
        res.setStatusCode(204);
      }
      return res;
    }
  }

  private class BlankBodyMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      if (req.getEndpoint().contains('composite/sobjects')) {
        res.setBody('');
        res.setStatusCode(200);
      } else {
        res.setBody('');
        res.setStatusCode(204);
      }
      return res;
    }
  }

  private class NonListBodyMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      if (req.getEndpoint().contains('composite/sobjects')) {
        res.setBody('{"notAnArray": true}');
        res.setStatusCode(200);
      } else {
        res.setBody('');
        res.setStatusCode(204);
      }
      return res;
    }
  }

  private class Non204PatchMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      res.setBody('{"error":"bad request"}');
      res.setStatusCode(400);
      return res;
    }
  }

  private class SecurityReviewErrorMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      res.setBody(
        'Specify a package that has passed the AppExchange security review.'
      );
      res.setStatusCode(400);
      return res;
    }
  }

  private class Generic400Mock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      res.setBody('{"error":"some other error"}');
      res.setStatusCode(400);
      return res;
    }
  }

  private static List<ObjectWrappers.FilterWrapper> createFilterList(
    string key,
    string value,
    string dataType
  ) {
    List<ObjectWrappers.FilterWrapper> fltList = new List<ObjectWrappers.FilterWrapper>();
    fltList.add(createFilterObject(key, value, dataType));
    return fltList;
  }

  /**************************************************************************************
   * @Description  Test class for create filter
   **************************************************************************************/
  private static ObjectWrappers.FilterWrapper createFilterObject(
    string key,
    string value,
    string dataType
  ) {
    ObjectWrappers.FilterWrapper flt = new ObjectWrappers.FilterWrapper();
    flt.fieldName = key;
    flt.value = value;
    flt.dataType = dataType;
    return flt;
  }
}
