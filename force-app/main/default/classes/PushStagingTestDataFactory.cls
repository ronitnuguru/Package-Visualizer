/** Synthetic packaging identifiers for isolated headless push tests. */
@IsTest
public with sharing class PushStagingTestDataFactory {
  public static String requestId() {
    return '0DV' + String.valueOf(1).leftPad(12, '0');
  }

  public static List<String> orgKeys(Integer count) {
    List<String> keys = new List<String>();
    for (Integer i = 1; i <= count; i++) {
      keys.add('00D' + String.valueOf(i).leftPad(12, '0'));
    }
    return keys;
  }
}
