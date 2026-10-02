/**
 * Runs bounded Package2 Tooling queries through Package Visualizer's shared transport.
 */
public with sharing class HxlPackageToolingGateway {
  private static final Integer TOOLING_TIMEOUT_MS = 10000;
  private static final Integer DETAIL_LOOKUP_LIMIT = 2000;
  private static final String ACTIVE_PACKAGE_FILTER = ' FROM Package2 WHERE IsDeprecated = false AND ContainerOptions IN (\'Managed\', \'Unlocked\')';
  private static final String PACKAGE_IDENTITY_FIELDS = 'Id, Name, ContainerOptions, NamespacePrefix, SubscriberPackageId, CreatedBy.Name, CreatedDate';
  private static final String LIST_FIELDS = 'SELECT ' + PACKAGE_IDENTITY_FIELDS;
  private static final String DETAIL_FIELDS =
    'SELECT ' +
    PACKAGE_IDENTITY_FIELDS +
    ', Description, PackageErrorUsername, IsOrgDependent, WasTransferred, AppAnalyticsEnabled, DataCloudPackage';
  private static final String VERSION_FIELDS = 'SELECT Id, Name, MajorVersion, MinorVersion, PatchVersion, BuildNumber, IsReleased, SubscriberPackageVersionId, CreatedBy.Name, CreatedDate';
  private static final String ACTIVE_VERSION_FILTER = ' FROM Package2Version WHERE IsDeprecated = false';
  private static final String ISO_DATETIME_PATTERN = 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'';
  private static final String VERSION_DETAIL_FIELDS = 'SELECT Id, Name, MajorVersion, MinorVersion, PatchVersion, BuildNumber, AncestorId, SubscriberPackageVersionId, Branch, Tag, Description, IsReleased, IsPasswordProtected, HasPassedCodeCoverageCheck, ValidatedAsync, ValidationSkipped, HasMetadataRemoved, BuildDurationInSeconds, Language, ReleaseVersion, CreatedBy.Name, CreatedDate, Package2Id';
  private static final Integer VERSION_DETAIL_LOOKUP_LIMIT = 2000;
  private static final String SUBSCRIBER_LIST_FIELDS = 'SELECT Id, MetadataPackageId, MetadataPackageVersionId, OrgKey, OrgName, OrgType, OrgStatus, InstanceName, SystemModstamp';
  private static final String SUBSCRIBER_DETAIL_FIELDS = 'SELECT Id, MetadataPackageId, MetadataPackageVersionId, OrgKey, OrgName, OrgType, OrgStatus, InstanceName, ParentOrg, CustomUpgradeType, HasRestrictionEnabled, IsCustomUpgradeAllowed, SystemModstamp';

  /**
   * Reads one active package page after an optional keyset cursor.
   *
   * The Tooling API query endpoint accepts a query string rather than Apex bind
   * variables. The caller validates the Package2 ID; this method escapes the
   * cursor name before adding it to the remote SOQL string.
   *
   * @param afterName Last name returned by the prior page, or null for the first page
   * @param afterPackage2Id Last Package2 ID returned by the prior page, or null
   * @param pageSize Maximum number of records, including the continuation record
   * @return Raw Tooling API records for the requested page
   */
  public static List<Object> readActivePackagePage(
    String afterName,
    String afterPackage2Id,
    Integer pageSize
  ) {
    String query = LIST_FIELDS + ACTIVE_PACKAGE_FILTER;
    if (afterName != null && afterPackage2Id != null) {
      String escapedName = String.escapeSingleQuotes(afterName);
      query +=
        ' AND (Name > \'' +
        escapedName +
        '\' OR (Name = \'' +
        escapedName +
        '\' AND Id > \'' +
        afterPackage2Id +
        '\'))';
    }
    return Package2Interface.submitQuery(
      query + ' ORDER BY Name ASC, Id ASC LIMIT ' + pageSize,
      TOOLING_TIMEOUT_MS
    );
  }

  /**
   * Reads active packages for validated IDs and escaped exact names in one
   * Tooling query.
   *
   * @param package2Ids Normalized Package2 IDs from the HXL read service
   * @param subscriberPackageIds Normalized Subscriber Package IDs
   * @param packageNames Exact package names from the HXL read service
   * @return Raw Tooling API records for matching active packages
   */
  public static List<Object> readActivePackageDetails(
    Set<String> package2Ids,
    Set<String> subscriberPackageIds,
    Set<String> packageNames
  ) {
    List<String> predicates = new List<String>();
    addInPredicate(predicates, 'Id', package2Ids);
    addInPredicate(predicates, 'SubscriberPackageId', subscriberPackageIds);
    addInPredicate(predicates, 'Name', packageNames);
    if (predicates.isEmpty()) {
      return new List<Object>();
    }
    return Package2Interface.submitQuery(
      DETAIL_FIELDS +
        ACTIVE_PACKAGE_FILTER +
        ' AND (' +
        String.join(predicates, ' OR ') +
        ') ORDER BY Name ASC, Id ASC LIMIT ' +
        DETAIL_LOOKUP_LIMIT,
      TOOLING_TIMEOUT_MS
    );
  }

  /**
   * Reads one active package-version page after an optional keyset cursor.
   *
   * @param package2Id A resolved, normalized Package2 ID
   * @param afterCreatedDate Last created date returned by the prior page, or null for the first page
   * @param afterId Last Package2Version ID returned by the prior page, or null
   * @param pageSize Maximum number of records, including the continuation record
   * @return Raw Tooling API records for the requested version page
   */
  public static List<Object> readActivePackageVersionPage(
    String package2Id,
    Datetime afterCreatedDate,
    String afterId,
    Integer pageSize
  ) {
    String query =
      VERSION_FIELDS +
      ACTIVE_VERSION_FILTER +
      ' AND Package2Id = \'' +
      package2Id +
      '\'';
    if (afterCreatedDate != null && afterId != null) {
      String isoCreatedDate = afterCreatedDate.formatGmt(ISO_DATETIME_PATTERN);
      query +=
        ' AND (CreatedDate < ' +
        isoCreatedDate +
        ' OR (CreatedDate = ' +
        isoCreatedDate +
        ' AND Id < \'' +
        afterId +
        '\'))';
    }
    return Package2Interface.submitQuery(
      query + ' ORDER BY CreatedDate DESC, Id DESC LIMIT ' + pageSize,
      TOOLING_TIMEOUT_MS
    );
  }

  /**
   * Reads active package versions for validated 04t IDs, escaped exact names,
   * and exact Major/Minor/Patch/Build tuples in one Tooling query.
   *
   * @param subscriberPackageVersionIds Normalized Subscriber Package Version IDs
   * @param versionNames Exact version names from the HXL read service
   * @param versionNumberKeys Parsed Major/Minor/Patch/Build tuples from the HXL read service
   * @return Raw Tooling API records for matching active package versions
   */
  public static List<Object> readActivePackageVersionDetails(
    Set<String> subscriberPackageVersionIds,
    Set<String> versionNames,
    List<VersionNumberKey> versionNumberKeys
  ) {
    List<String> predicates = new List<String>();
    addInPredicate(
      predicates,
      'SubscriberPackageVersionId',
      subscriberPackageVersionIds
    );
    addInPredicate(predicates, 'Name', versionNames);
    addVersionNumberPredicate(predicates, versionNumberKeys);
    if (predicates.isEmpty()) {
      return new List<Object>();
    }
    return Package2Interface.submitQuery(
      VERSION_DETAIL_FIELDS +
        ACTIVE_VERSION_FILTER +
        ' AND (' +
        String.join(predicates, ' OR ') +
        ') ORDER BY Name ASC, Id ASC LIMIT ' +
        VERSION_DETAIL_LOOKUP_LIMIT,
      TOOLING_TIMEOUT_MS
    );
  }

  // PackageSubscriber is not exposed through the Tooling API (confirmed live:
  // "INVALID_TYPE: sObject type 'PackageSubscriber' is not supported"), unlike
  // Package2/Package2Version. These two methods query it directly instead of
  // routing through Package2Interface.submitQuery's Tooling HTTP transport.
  @TestVisible
  private static List<SObject> subscriberTestRecords;

  /**
   * Reads one PackageSubscriber page filtered by package or version ID, newest first.
   * Uses keyset pagination (SystemModstamp, Id) rather than OFFSET, since SOQL OFFSET
   * is capped at 2000 rows on this object and some packages already exceed that.
   *
   * @param filterField MetadataPackageId or MetadataPackageVersionId
   * @param filterValue The validated 033 or 04t ID to filter on
   * @param afterModstamp Last SystemModstamp returned by the prior page, or null for the first page
   * @param afterId Last record Id returned by the prior page, or null
   * @param pageSize Maximum number of records, including the continuation record
   * @return Raw PackageSubscriber records for the requested page
   */
  public static List<SObject> readSubscriberPage(
    String filterField,
    String filterValue,
    DateTime afterModstamp,
    String afterId,
    Integer pageSize
  ) {
    if (Test.isRunningTest() && subscriberTestRecords != null) {
      return subscriberTestRecords;
    }
    String query =
      SUBSCRIBER_LIST_FIELDS +
      ' FROM PackageSubscriber WHERE ' +
      filterField +
      ' = :filterValue';
    if (afterModstamp != null && afterId != null) {
      query += ' AND (SystemModstamp < :afterModstamp OR (SystemModstamp = :afterModstamp AND Id < :afterId))';
    }
    query += ' ORDER BY SystemModstamp DESC, Id DESC LIMIT :pageSize';
    return Security.stripInaccessible(
        AccessType.READABLE,
        Database.query(query)
      )
      .getRecords();
  }

  /**
   * Reads one PackageSubscriber record by its OrgKey.
   *
   * @param orgKey The PackageSubscriber OrgKey to look up
   * @return Raw PackageSubscriber records matching the OrgKey (zero or one record)
   */
  public static List<SObject> readSubscriberDetail(String orgKey) {
    if (Test.isRunningTest() && subscriberTestRecords != null) {
      return subscriberTestRecords;
    }
    String query =
      SUBSCRIBER_DETAIL_FIELDS +
      ' FROM PackageSubscriber WHERE OrgKey = :orgKey LIMIT 1';
    return Security.stripInaccessible(
        AccessType.READABLE,
        Database.query(query)
      )
      .getRecords();
  }

  private static void addVersionNumberPredicate(
    List<String> predicates,
    List<VersionNumberKey> versionNumberKeys
  ) {
    if (versionNumberKeys == null || versionNumberKeys.isEmpty()) {
      return;
    }
    List<String> tuples = new List<String>();
    for (VersionNumberKey key : versionNumberKeys) {
      tuples.add(
        '(MajorVersion = ' +
          key.majorVersion +
          ' AND MinorVersion = ' +
          key.minorVersion +
          ' AND PatchVersion = ' +
          key.patchVersion +
          ' AND BuildNumber = ' +
          key.buildNumber +
          ')'
      );
    }
    predicates.add('(' + String.join(tuples, ' OR ') + ')');
  }

  private static void addInPredicate(
    List<String> predicates,
    String fieldName,
    Set<String> values
  ) {
    if (values == null || values.isEmpty()) {
      return;
    }
    List<String> quotedValues = new List<String>();
    for (String value : values) {
      quotedValues.add('\'' + String.escapeSingleQuotes(value) + '\'');
    }
    quotedValues.sort();
    predicates.add(fieldName + ' IN (' + String.join(quotedValues, ',') + ')');
  }

  /** Parsed Major/Minor/Patch/Build tuple used to filter Package2Version by version number. */
  public class VersionNumberKey {
    public Integer majorVersion;
    public Integer minorVersion;
    public Integer patchVersion;
    public Integer buildNumber;
  }
}
