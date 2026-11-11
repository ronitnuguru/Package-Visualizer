/** Verifies staging never dispatches and preserves each API row outcome. */
@IsTest
private with sharing class PushUpgradesStagingTest {
  @IsTest
  static void shouldStage200JobsWithoutDispatch() {
    StagingMock mock = new StagingMock();
    Test.setMock(HttpCalloutMock.class, mock);
    List<String> keys = PushStagingTestDataFactory.orgKeys(200);
    Test.startTest();
    List<Object> rows = (List<Object>) JSON.deserializeUntyped(
      PushUpgradesInterface.stagePushJobChunk(
        PushStagingTestDataFactory.requestId(),
        keys
      )
    );
    Test.stopTest();
    Assert.areEqual(
      keys.size(),
      rows.size(),
      'Every supplied org needs a result'
    );
    Assert.areEqual(1, mock.readCount, 'Read parent status before submission');
    Assert.areEqual(
      1,
      mock.postCount,
      'One collection request stages 200 jobs'
    );
    Assert.areEqual(0, mock.patchCount, 'Staging must never dispatch');
    for (Integer i = 0; i < rows.size(); i++) {
      Map<String, Object> row = (Map<String, Object>) rows[i];
      Assert.areEqual(
        keys[i],
        row.get('orgKey'),
        'Result order must match input'
      );
      Assert.areEqual(true, row.get('success'), 'Mock accepted every job');
      Assert.isNotNull(row.get('jobId'), 'Accepted rows retain their job IDs');
    }
  }

  @IsTest
  static void shouldRetainPartialFailureDetails() {
    StagingMock mock = new StagingMock();
    mock.partialFailure = true;
    Test.setMock(HttpCalloutMock.class, mock);
    Test.startTest();
    List<Object> rows = (List<Object>) JSON.deserializeUntyped(
      PushUpgradesInterface.stagePushJobChunk(
        PushStagingTestDataFactory.requestId(),
        PushStagingTestDataFactory.orgKeys(2)
      )
    );
    Test.stopTest();
    Map<String, Object> failed = (Map<String, Object>) rows[1];
    List<Object> errors = (List<Object>) failed.get('errors');
    Assert.areEqual(
      false,
      failed.get('success'),
      'Partial failure must stay visible'
    );
    Assert.areEqual(
      null,
      failed.get('jobId'),
      'Failed rows have no platform job'
    );
    Assert.areEqual(
      'Subscriber blocked',
      ((Map<String, Object>) errors[0]).get('message'),
      'Retain API diagnostics'
    );
    Assert.areEqual(
      0,
      mock.patchCount,
      'Partial submission must never dispatch'
    );
  }

  @IsTest
  static void shouldReject201Jobs() {
    assertRejected(
      PushStagingTestDataFactory.orgKeys(201),
      new StagingMock(),
      0
    );
  }
  @IsTest
  static void shouldReject251JobsInOneChunk() {
    assertRejected(
      PushStagingTestDataFactory.orgKeys(251),
      new StagingMock(),
      0
    );
  }
  @IsTest
  static void shouldReject2000JobsInOneChunk() {
    assertRejected(
      PushStagingTestDataFactory.orgKeys(2000),
      new StagingMock(),
      0
    );
  }
  @IsTest
  static void shouldRejectNullCohort() {
    assertRejected(null, new StagingMock(), 0);
  }
  @IsTest
  static void shouldRejectEmptyCohort() {
    assertRejected(new List<String>(), new StagingMock(), 0);
  }

  @IsTest
  static void shouldRejectDuplicateOrgKeys() {
    List<String> keys = PushStagingTestDataFactory.orgKeys(1);
    keys.add(keys[0]);
    assertRejected(keys, new StagingMock(), 0);
  }

  @IsTest
  static void shouldRejectCanceledParent() {
    StagingMock mock = new StagingMock();
    mock.parentStatus = 'Canceled';
    assertRejected(PushStagingTestDataFactory.orgKeys(1), mock, 0);
  }

  @IsTest
  static void shouldRejectPendingParent() {
    StagingMock mock = new StagingMock();
    mock.parentStatus = 'Pending';
    assertRejected(PushStagingTestDataFactory.orgKeys(1), mock, 0);
  }

  @IsTest
  static void shouldRejectTruncatedResponse() {
    StagingMock mock = new StagingMock();
    mock.truncateResponse = true;
    assertRejected(PushStagingTestDataFactory.orgKeys(2), mock, 1);
  }

  @IsTest
  static void shouldRejectMalformedResponse() {
    StagingMock mock = new StagingMock();
    mock.malformedResponse = true;
    assertRejected(PushStagingTestDataFactory.orgKeys(1), mock, 1);
  }

  @IsTest
  static void shouldRejectSuccessWithoutJobId() {
    StagingMock mock = new StagingMock();
    mock.missingJobId = true;
    assertRejected(PushStagingTestDataFactory.orgKeys(1), mock, 1);
  }

  private static void assertRejected(
    List<String> keys,
    StagingMock mock,
    Integer expectedPosts
  ) {
    Test.setMock(HttpCalloutMock.class, mock);
    Boolean rejected = false;
    Test.startTest();
    try {
      PushUpgradesInterface.stagePushJobChunk(
        PushStagingTestDataFactory.requestId(),
        keys
      );
    } catch (AuraHandledException expected) {
      rejected = true;
    }
    Test.stopTest();
    Assert.isTrue(rejected, 'Invalid or uncertain staging must be rejected');
    Assert.areEqual(
      expectedPosts,
      mock.postCount,
      'Unexpected collection write count'
    );
    Assert.areEqual(0, mock.patchCount, 'Rejected staging must never dispatch');
  }

  private class StagingMock implements HttpCalloutMock {
    Integer readCount = 0;
    Integer postCount = 0;
    Integer patchCount = 0;
    String parentStatus = 'Created';
    Boolean partialFailure = false;
    Boolean truncateResponse = false;
    Boolean malformedResponse = false;
    Boolean missingJobId = false;

    public HttpResponse respond(HttpRequest request) {
      HttpResponse response = new HttpResponse();
      response.setHeader('Content-Type', 'application/json');
      if (request.getMethod() == 'GET') {
        readCount++;
        response.setStatusCode(200);
        response.setBody(
          JSON.serialize(
            new Map<String, Object>{
              'Id' => PushStagingTestDataFactory.requestId(),
              'Status' => parentStatus
            }
          )
        );
      } else if (request.getMethod() == 'POST') {
        postCount++;
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
          request.getBody()
        );
        List<Object> records = (List<Object>) body.get('records');
        List<Object> results = new List<Object>();
        for (Integer i = 0; i < records.size(); i++) {
          Map<String, Object> job = (Map<String, Object>) records[i];
          Assert.areEqual(
            PushStagingTestDataFactory.requestId(),
            job.get('PackagePushRequestId'),
            'Every job must belong to the prepared request'
          );
          Boolean success = !(partialFailure && i == 1);
          results.add(
            new Map<String, Object>{
              'id' => success && !missingJobId
                ? '0DX' + String.valueOf(i + 1).leftPad(12, '0')
                : null,
              'success' => success,
              'errors' => success
                ? new List<Object>()
                : new List<Object>{
                    new Map<String, Object>{
                      'message' => 'Subscriber blocked',
                      'statusCode' => 'INVALID_OPERATION'
                    }
                  }
            }
          );
        }
        if (truncateResponse) {
          results.remove(results.size() - 1);
        }
        response.setStatusCode(200);
        response.setBody(malformedResponse ? '{}' : JSON.serialize(results));
      } else {
        patchCount++;
        response.setStatusCode(204);
      }
      return response;
    }
  }
}
