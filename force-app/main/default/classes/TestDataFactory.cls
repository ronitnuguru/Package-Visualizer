@IsTest
public class TestDataFactory {
  public static List<Account> createAccounts(Integer count, Boolean doInsert) {
    return createAccounts(count, doInsert, null);
  }

  public static List<Account> createAccounts(
    Integer count,
    Boolean doInsert,
    Map<String, Object> fieldOverrides
  ) {
    Integer safeCount = count == null || count < 0 ? 0 : count;
    String seed = String.valueOf(DateTime.now().getTime());
    List<Account> accounts = new List<Account>();

    for (Integer i = 0; i < safeCount; i++) {
      Account accountRecord = new Account(
        Name = 'Test Account ' + seed + '-' + String.valueOf(i)
      );
      if (fieldOverrides != null && !fieldOverrides.isEmpty()) {
        for (String fieldName : fieldOverrides.keySet()) {
          accountRecord.put(fieldName, fieldOverrides.get(fieldName));
        }
      }
      accounts.add(accountRecord);
    }

    if (doInsert == true && !accounts.isEmpty()) {
      insert accounts;
    }
    return accounts;
  }

  public static Account createAccount(Boolean doInsert) {
    return createAccounts(1, doInsert)[0];
  }

  public static Account createAccount(
    Boolean doInsert,
    Map<String, Object> fieldOverrides
  ) {
    return createAccounts(1, doInsert, fieldOverrides)[0];
  }
}
