/*******************************************************************************************
 * @Name         Package2Interface
 * @Date         11/10/2020
 * @Description  Interface Class for making thats make all call out for 2GP Visualizer application.
 *******************************************************************************************/
global with sharing class Package2Interface { // NOPMD
  /**
   * @Description Thrown when a Tooling/REST callout on the Named Credential path
   * returns a non-200 status, carrying the HTTP status and response body so the
   * UI can show a specific cause instead of an empty result.
   */
  global class ToolingCalloutException extends Exception {
  }

  private static final String INVALID_FILTER_FIELD_MESSAGE = 'Invalid filter field name.';
  private static final String INVALID_FILTER_TYPE_MESSAGE = 'Invalid filter data type.';
  private static final String INVALID_FILTER_BOOLEAN_MESSAGE = 'Invalid filter boolean value.';
  private static final String INVALID_FILTER_DECIMAL_MESSAGE = 'Invalid filter decimal value.';
  private static final String INVALID_SORT_PAIR_MESSAGE = 'Invalid sort input pair.';

  private static final Map<String, String> PACKAGE2_VERSION_SORT_FIELD_MAP = new Map<String, String>{
    'id' => 'Id',
    'branch' => 'Branch',
    'description' => 'Description',
    'ispasswordprotected' => 'IsPasswordProtected',
    'isreleased' => 'IsReleased',
    'majorversion' => 'MajorVersion',
    'minorversion' => 'MinorVersion',
    'patchversion' => 'PatchVersion',
    'buildnumber' => 'BuildNumber',
    'tag' => 'Tag',
    'name' => 'Name',
    'package2id' => 'Package2Id',
    'subscriberpackageversionid' => 'SubscriberPackageVersionId',
    'ancestorid' => 'AncestorId',
    'validationskipped' => 'ValidationSkipped',
    'builddurationinseconds' => 'BuildDurationInSeconds',
    'haspassedcodecoveragecheck' => 'HasPassedCodeCoverageCheck',
    'hasmetadataremoved' => 'HasMetadataRemoved',
    'releaseversion' => 'ReleaseVersion',
    'language' => 'Language',
    'createddate' => 'CreatedDate',
    'createdby' => 'CreatedBy.Name',
    'createdbyname' => 'CreatedBy.Name',
    'owner' => 'CreatedBy.Name',
    'validatedasync' => 'ValidatedAsync',
    'systemmodstamp' => 'SystemModstamp',
    'versionnumber' => 'versionNumber'
  };
  private static final Map<String, String> PACKAGE1_VERSION_SORT_FIELD_MAP = new Map<String, String>{
    'id' => 'Id',
    'buildnumber' => 'BuildNumber',
    'isdeprecated' => 'IsDeprecated',
    'majorversion' => 'MajorVersion',
    'metadatapackageid' => 'MetadataPackageId',
    'minorversion' => 'MinorVersion',
    'name' => 'Name',
    'patchversion' => 'PatchVersion',
    'releasestate' => 'ReleaseState',
    'systemmodstamp' => 'SystemModstamp',
    'versionnumber' => 'versionNumber'
  };
  private static final Map<String, String> SIGNUP_REQUEST_SORT_FIELD_MAP = new Map<String, String>{
    'company' => 'Company',
    'country' => 'Country',
    'createdby' => 'CreatedBy.Name',
    'createdbyname' => 'CreatedBy.Name',
    'owner' => 'CreatedBy.Name',
    'createddate' => 'CreatedDate',
    'createdorgid' => 'CreatedOrgId',
    'createdorginstance' => 'CreatedOrgInstance',
    'edition' => 'Edition',
    'errorcode' => 'ErrorCode',
    'firstname' => 'FirstName',
    'id' => 'Id',
    'issignupemailsuppressed' => 'IsSignupEmailSuppressed',
    'lastmodifiedbyid' => 'LastModifiedById',
    'lastmodifieddate' => 'LastModifiedDate',
    'lastname' => 'LastName',
    'ownerid' => 'OwnerId',
    'preferredlanguage' => 'PreferredLanguage',
    'resolvedtemplateid' => 'ResolvedTemplateId',
    'shouldconnecttoenvhub' => 'ShouldConnectToEnvHub',
    'signupemail' => 'SignupEmail',
    'signupsource' => 'SignupSource',
    'status' => 'Status',
    'subdomain' => 'Subdomain',
    'systemmodstamp' => 'SystemModstamp',
    'templateid' => 'TemplateId',
    'trialdays' => 'TrialDays',
    'trialsourceorgid' => 'TrialSourceOrgId',
    'username' => 'Username'
  };
  private static final Map<String, String> PACKAGE_SUBSCRIBER_SORT_FIELD_MAP = new Map<String, String>{
    'id' => 'Id',
    'metadatapackageid' => 'MetadataPackageId',
    'metadatapackageversionid' => 'MetadataPackageVersionId',
    'orgkey' => 'OrgKey',
    'orgname' => 'OrgName',
    'orgtype' => 'OrgType',
    'orgstatus' => 'OrgStatus',
    'instancename' => 'InstanceName',
    'parentorg' => 'ParentOrg',
    'customupgradetype' => 'CustomUpgradeType',
    'hasrestrictionenabled' => 'HasRestrictionEnabled',
    'iscustomupgradeallowed' => 'IsCustomUpgradeAllowed',
    'systemmodstamp' => 'SystemModstamp'
  };
  private static final Map<String, String> PACKAGE2_VERSION_CREATE_REQUEST_SORT_FIELD_MAP = new Map<String, String>{
    'id' => 'Id',
    'status' => 'Status',
    'package2id' => 'Package2Id',
    'package2versionid' => 'Package2VersionId',
    'branch' => 'Branch',
    'tag' => 'Tag',
    'asyncvalidation' => 'AsyncValidation',
    'calculatecodecoverage' => 'CalculateCodeCoverage',
    'calctransitivedependencies' => 'CalcTransitiveDependencies',
    'skipvalidation' => 'SkipValidation',
    'isdevusepkgziprequested' => 'IsDevUsePkgZipRequested',
    'ispasswordprotected' => 'IsPasswordProtected',
    'isconversionrequest' => 'IsConversionRequest',
    'language' => 'Language',
    'createdby' => 'CreatedBy.Name',
    'createdbyname' => 'CreatedBy.Name',
    'owner' => 'CreatedBy.Name',
    'createddate' => 'CreatedDate',
    'systemmodstamp' => 'SystemModstamp'
  };
  private static final Map<String, String> PACKAGE_SUBSCRIBER_CHART_GROUP_MAP = new Map<String, String>{
    'orgtype' => 'OrgType',
    'orgstatus' => 'OrgStatus',
    'instancename' => 'InstanceName',
    'metadatapackageversionid' => 'MetadataPackageVersionId'
  };
  private static final Map<String, String> LMA_CHART_GROUP_MAP = new Map<String, String>{
    'sflma__lead__r.leadsource' => 'sfLma__Lead__r.LeadSource',
    'sflma__status__c' => 'sfLma__Status__c',
    'sflma__is_sandbox__c' => 'sfLma__Is_Sandbox__c'
  };
  private static final Map<String, String> PACKAGE_PUSH_JOB_CHART_GROUP_MAP = new Map<String, String>{
    'status' => 'Status'
  };

  /**************************************************************************************
   * @Description  AgentScript Coach platform-cache constants and helpers. The Coach
   * sends a static rubric + a static AgentScript body to the Models API and gets back
   * a long, expensive analysis. Caching by SHA-256 of the prompt envelope cuts repeat
   * opens from ~30-60s to <500ms.
   *
   * Partition: pkgviz.AgentScriptCoach (named, non-default — required for managed
   * package install). Visibility NAMESPACE so subscriber Apex cannot read entries.
   * TTL 48h (max). Bump KEY_VERSION to globally invalidate.
   **************************************************************************************/
  // Resolved at runtime: 'pkgviz.AgentScriptCoach' when running from the
  // installed managed package (subscriber org), 'local.AgentScriptCoach' when
  // running from a non-namespaced org (scratch/dev). Avoids the manual
  // const-flip at packaging time and prevents the 'local resolves to
  // subscriber namespace inside a managed package' footgun.
  @TestVisible
  private static String coachCachePartition {
    get {
      if (coachCachePartition == null) {
        String ns = getPackageNamespace();
        coachCachePartition =
          (String.isBlank(ns) ? 'local' : ns) + '.AgentScriptCoach';
      }
      return coachCachePartition;
    }
    set;
  }

  private static String packageNamespace;
  private static Boolean packageNamespaceResolved = false;

  /**
   * @Description  Returns the running namespace prefix of this package
   * ('pkgviz' when installed, null in a non-namespaced org).
   *
   * Uses Type reflection (not SOQL on ApexClass): String.valueOf(T.class)
   * returns 'namespace.ClassName' when running inside a namespaced package,
   * and just 'ClassName' otherwise. SOQL on ApexClass is unreliable in
   * subscriber orgs because the running user often lacks View Setup access,
   * causing the query to return zero rows and the helper to fall back to
   * 'local' — which resolves to the SUBSCRIBER namespace inside an installed
   * managed package and triggers "Cross-namespace PUT not supported".
   */
  @TestVisible
  private static String getPackageNamespace() {
    if (!packageNamespaceResolved) {
      String fullName = String.valueOf(Package2Interface.class);
      Integer dotIdx = fullName.indexOf('.');
      packageNamespace = dotIdx > 0 ? fullName.substring(0, dotIdx) : null;
      packageNamespaceResolved = true;
    }
    return packageNamespace;
  }
  @TestVisible
  private static final String COACH_CACHE_KEY_VERSION = 'v1';
  @TestVisible
  private static final Integer COACH_CACHE_TTL_SECONDS = 172800;

  /**
   * @Description  Build a deterministic Platform Cache key from the LLM prompt
   * envelope. SHA-256 truncated to 40 hex chars + version prefix stays under the
   * 50-char Platform Cache key limit.
   */
  @TestVisible
  private static String buildCoachCacheKey(
    String modelName,
    String systemPrompt,
    String userPrompt
  ) {
    String composite = modelName + '|' + systemPrompt + '|' + userPrompt;
    Blob digest = Crypto.generateDigest('SHA-256', Blob.valueOf(composite));
    String hex = EncodingUtil.convertToHex(digest);
    // Platform Cache keys must be strictly alphanumeric — no separators at all.
    return COACH_CACHE_KEY_VERSION + hex.substring(0, 40);
  }

  /**
   * @Description  Read a cached Coach LLM response. Returns null on miss or when
   * no cache is allocated (e.g. Developer Edition orgs).
   */
  public static String getCachedCoachResponse(
    String modelName,
    String systemPrompt,
    String userPrompt
  ) {
    String key = buildCoachCacheKey(modelName, systemPrompt, userPrompt);
    Cache.OrgPartition partition = Cache.Org.getPartition(coachCachePartition);
    if (partition == null) {
      return null;
    }
    Object cached = partition.get(key);
    return (String) cached;
  }

  /**
   * @Description  Store a Coach LLM response in cache. No-op when response is
   * blank so failed generations are never memoized.
   */
  public static void putCachedCoachResponse(
    String modelName,
    String systemPrompt,
    String userPrompt,
    String response
  ) {
    if (String.isBlank(response)) {
      return;
    }
    Cache.OrgPartition partition = Cache.Org.getPartition(coachCachePartition);
    if (partition == null) {
      return;
    }
    String key = buildCoachCacheKey(modelName, systemPrompt, userPrompt);
    partition.put(
      key,
      response,
      COACH_CACHE_TTL_SECONDS,
      Cache.Visibility.NAMESPACE,
      false
    );
  }

  /**************************************************************************************
   * @Description  Get the list of packages using tooling API.
   **************************************************************************************/
  public static List<ObjectWrappers.PackageWrapper> getPackage2(
    String sortDirection
  ) {
    List<ObjectWrappers.PackageWrapper> packages = new List<ObjectWrappers.PackageWrapper>();
    String normalizedSortDirection = SoqlInputValidator.normalizeSortDirection(
      sortDirection,
      'Invalid package sort direction.'
    );
    string s =
      'Select Id, ContainerOptions, Description, Name, NamespacePrefix, SubscriberPackageID, isOrgDependent, PackageErrorUsername, WasTransferred, CreatedBy.Name, CreatedDate, AppAnalyticsEnabled, DataCloudPackage FROM Package2 WHERE IsDeprecated = false ORDER BY Name ' +
      normalizedSortDirection +
      ' LIMIT 500';
    List<Object> records = submitQuery(s);
    for (Object record : records) {
      ObjectWrappers.PackageWrapper p = (ObjectWrappers.PackageWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.PackageWrapper.class
      );
      if (p.CreatedBy != null) {
        p.owner = p.CreatedBy.name;
      }
      p.isOrgDependent = p.isOrgDependent == true;
      packages.add(p);
    }
    return packages;
  }

  public static String getPackage2TypeById(String package2Id) {
    if (String.isBlank(package2Id)) {
      return null;
    }
    String s =
      'SELECT Id, ContainerOptions FROM Package2 WHERE Id = \'' +
      String.escapeSingleQuotes(package2Id) +
      '\'';
    List<Object> records = submitQuery(s);
    for (Object record : records) {
      Map<String, Object> m = (Map<String, Object>) record;
      return (String) m.get('ContainerOptions');
    }
    return null;
  }

  public static Boolean verifyUnlockedPackageInstalled() {
    string s = 'SELECT Id, SubscriberPackageId, SubscriberPackage.NamespacePrefix, SubscriberPackage.Name FROM InstalledSubscriberPackage WHERE SubscriberPackageId = \'033Rh000000AYI9IAO\'';
    List<Object> record = submitQuery(s);
    if (record.size() == 1) {
      return true;
    }
    return false;
  }

  public static List<ObjectWrappers.InstalledPackageWrapper> getInstalledPackages(
    List<String> subscriberPackageIds
  ) {
    List<ObjectWrappers.InstalledPackageWrapper> installedPackages = new List<ObjectWrappers.InstalledPackageWrapper>();
    if (subscriberPackageIds == null || subscriberPackageIds.isEmpty()) {
      return installedPackages;
    }
    String inClause = '';
    for (String pkgId : subscriberPackageIds) {
      inClause = inClause + '\'' + String.escapeSingleQuotes(pkgId) + '\',';
    }
    inClause = inClause.substring(0, inClause.length() - 1);
    String s =
      'SELECT Id, SubscriberPackageId, SubscriberPackageVersionId FROM InstalledSubscriberPackage WHERE SubscriberPackageId IN (' +
      inClause +
      ')';
    List<Object> records = submitQuery(s);
    for (Object record : records) {
      ObjectWrappers.InstalledPackageWrapper p = (ObjectWrappers.InstalledPackageWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.InstalledPackageWrapper.class
      );
      installedPackages.add(p);
    }
    return installedPackages;
  }

  /**************************************************************************************
   * @Description  Get the list of 1GP packages using tooling API.
   **************************************************************************************/
  public static List<ObjectWrappers.PackageWrapper1> getPackage1(
    String sortDirection
  ) {
    List<ObjectWrappers.PackageWrapper1> packages = new List<ObjectWrappers.PackageWrapper1>();
    String normalizedSortDirection = SoqlInputValidator.normalizeSortDirection(
      sortDirection,
      'Invalid package sort direction.'
    );
    string s =
      'SELECT Id, Name, NamespacePrefix, PackageCategory, SystemModstamp FROM MetadataPackage WHERE PackageCategory = \'Package\' ORDER BY Name ' +
      normalizedSortDirection +
      ' LIMIT 500';
    List<Object> records = submitQuery(s);
    for (Object record : records) {
      ObjectWrappers.PackageWrapper1 p = (ObjectWrappers.PackageWrapper1) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.PackageWrapper1.class
      );
      packages.add(p);
    }
    return packages;
  }

  /**************************************************************************************
   * @Description	Get the list of 1GP package versions for the given package and additional filters passed through FilterWrapper
   **************************************************************************************/
  public static List<ObjectWrappers.Package1VersionWrapper> getPackage1Versions(
    list<ObjectWrappers.FilterWrapper> filterWrapperList,
    String minMajorVersion,
    String maxMajorVersion,
    String minMinorVersion,
    String maxMinorVersion,
    String sortedBy,
    String sortDirection,
    String versionLimit,
    String versionOffset
  ) {
    List<ObjectWrappers.Package1VersionWrapper> packageVersions = new List<ObjectWrappers.Package1VersionWrapper>();
    Integer parsedVersionLimit = SoqlInputValidator.parseIntegerInRange(
      versionLimit,
      1,
      2000,
      'Invalid version limit.'
    );
    Integer parsedVersionOffset = SoqlInputValidator.parseIntegerInRange(
      versionOffset,
      0,
      2000,
      'Invalid version offset.'
    );
    String queryString = 'SELECT BuildNumber, Id, IsDeprecated, MajorVersion, MetadataPackageId, MinorVersion,Name, PatchVersion, ReleaseState, SystemModstamp FROM MetadataPackageVersion WHERE IsDeprecated = false ';
    String whereClause = '';
    if (filterWrapperList != null && !filterWrapperList.isEmpty()) {
      whereClause = getWhereClause(filterWrapperList);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' AND ' + whereClause;
      }
    }
    if (
      minMajorVersion != null &&
      maxMajorVersion != null &&
      minMinorVersion != null &&
      maxMinorVersion != null
    ) {
      Integer parsedMinMajorVersion = SoqlInputValidator.parseNonNegativeInteger(
        minMajorVersion,
        'Invalid version range.'
      );
      Integer parsedMaxMajorVersion = SoqlInputValidator.parseNonNegativeInteger(
        maxMajorVersion,
        'Invalid version range.'
      );
      Integer parsedMinMinorVersion = SoqlInputValidator.parseNonNegativeInteger(
        minMinorVersion,
        'Invalid version range.'
      );
      Integer parsedMaxMinorVersion = SoqlInputValidator.parseNonNegativeInteger(
        maxMinorVersion,
        'Invalid version range.'
      );
      String versionClause = getVersionRangeWhereClause(
        parsedMinMajorVersion,
        parsedMaxMajorVersion,
        parsedMinMinorVersion,
        parsedMaxMinorVersion
      );
      queryString = queryString + versionClause;
    }
    if (hasSortInputs(sortedBy, sortDirection)) {
      String normalizedSortDirection = SoqlInputValidator.normalizeSortDirection(
        sortDirection,
        'Invalid version sort direction.'
      );
      String normalizedSortField = SoqlInputValidator.normalizeAllowlistedIdentifier(
        sortedBy,
        PACKAGE1_VERSION_SORT_FIELD_MAP,
        'Invalid version sort field.'
      );
      queryString =
        queryString +
        buildOrderByClauseForVersions(
          normalizedSortField,
          normalizedSortDirection
        );
    }
    queryString =
      queryString +
      ' LIMIT ' +
      String.valueOf(parsedVersionLimit) +
      ' OFFSET ' +
      String.valueOf(parsedVersionOffset);
    List<Object> records = submitQuery(queryString);
    for (Object record : records) {
      ObjectWrappers.Package1VersionWrapper p = (ObjectWrappers.Package1VersionWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.Package1VersionWrapper.class
      );
      p.versionNumber =
        p.majorVersion +
        '.' +
        p.minorVersion +
        '.' +
        p.patchVersion +
        '-' +
        p.buildNumber;
      p.id = p.id;
      packageVersions.add(p);
    }
    return packageVersions;
  }

  public static List<ObjectWrappers.SignupRequestWrapper> getSignUpRequests(
    list<ObjectWrappers.FilterWrapper> filterWrapper,
    String sortedBy,
    String sortDirection,
    String signUpLimit,
    String signUpOffset
  ) {
    List<ObjectWrappers.SignupRequestWrapper> signUpList = new List<ObjectWrappers.SignupRequestWrapper>();
    String normalizedSortDirection = SoqlInputValidator.normalizeSortDirection(
      sortDirection,
      'Invalid sign-up sort direction.'
    );
    String normalizedSortField = SoqlInputValidator.normalizeAllowlistedIdentifier(
      sortedBy,
      SIGNUP_REQUEST_SORT_FIELD_MAP,
      'Invalid sign-up sort field.'
    );
    Integer parsedSignUpLimit = SoqlInputValidator.parseIntegerInRange(
      signUpLimit,
      1,
      2000,
      'Invalid sign-up limit.'
    );
    Integer parsedSignUpOffset = SoqlInputValidator.parseIntegerInRange(
      signUpOffset,
      0,
      2000,
      'Invalid sign-up offset.'
    );
    String queryString = 'SELECT Company, Country, CreatedBy.Name, CreatedDate, CreatedOrgId, CreatedOrgInstance, Edition, ErrorCode, FirstName, Id, IsSignupEmailSuppressed, LastModifiedById, LastModifiedDate, LastName, OwnerId, PreferredLanguage, ResolvedTemplateId, ShouldConnectToEnvHub, SignupEmail, SignupSource, Status,Subdomain, SystemModstamp, TemplateId, TrialDays, TrialSourceOrgId, Username FROM SignupRequest  ';
    String whereClause = '';
    if (filterWrapper != null && !filterWrapper.isEmpty()) {
      whereClause = getWhereClause(filterWrapper);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' WHERE ' + whereClause;
      }
    }
    queryString =
      queryString +
      'ORDER BY ' +
      normalizedSortField +
      ' ' +
      normalizedSortDirection;
    queryString =
      queryString +
      ' LIMIT ' +
      String.valueOf(parsedSignUpLimit) +
      ' OFFSET ' +
      String.valueOf(parsedSignUpOffset);
    if (Type.forName('SignupRequest') != null) {
      SObjectAccessDecision decision = Security.stripInaccessible(
        AccessType.READABLE,
        Database.query(queryString) // NOPMD - Sort tokens are allowlisted, pagination is bounded, and filter literals are validated or escaped.
      );
      for (sObject o : decision.getRecords()) {
        ObjectWrappers.SignupRequestWrapper sw = (ObjectWrappers.SignupRequestWrapper) JSON.deserialize(
          JSON.serialize(o),
          ObjectWrappers.SignupRequestWrapper.class
        );
        if (sw.CreatedBy != null) {
          sw.owner = sw.CreatedBy.name;
        }
        signUpList.add(sw);
      }
    }
    return signUpList;
  }

  /**************************************************************************************
   * @Description  Get the list of packages subscriber by quering PackageSubscriber object.
   **************************************************************************************/
  global static List<ObjectWrappers.PackageSubscriberWrapper> get2GPPackageSubscriberList(
    List<ObjectWrappers.FilterWrapper> filterWrapperList,
    String sortedBy,
    String sortDirection,
    String subscriberLimit,
    String subscriberOffset
  ) {
    List<ObjectWrappers.PackageSubscriberWrapper> packageSubList = new List<ObjectWrappers.PackageSubscriberWrapper>();
    String normalizedSortDirection = SoqlInputValidator.normalizeSortDirection(
      sortDirection,
      'Invalid subscriber sort direction.'
    );
    String normalizedSortField = SoqlInputValidator.normalizeAllowlistedIdentifier(
      sortedBy,
      PACKAGE_SUBSCRIBER_SORT_FIELD_MAP,
      'Invalid subscriber sort field.'
    );
    Integer parsedSubscriberLimit = SoqlInputValidator.parseIntegerInRange(
      subscriberLimit,
      1,
      2000,
      'Invalid subscriber limit.'
    );
    Integer parsedSubscriberOffset = SoqlInputValidator.parseIntegerInRange(
      subscriberOffset,
      0,
      2000,
      'Invalid subscriber offset.'
    );

    String queryString = 'SELECT Id, MetadataPackageId, MetadataPackageVersionId, OrgKey, OrgName, OrgType, OrgStatus, InstanceName, ParentOrg, CustomUpgradeType, HasRestrictionEnabled, IsCustomUpgradeAllowed, SystemModstamp FROM PackageSubscriber ';
    String whereClause = '';
    if (filterWrapperList != null && !filterWrapperList.isEmpty()) {
      whereClause = getWhereClause(filterWrapperList);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' WHERE ' + whereClause;
      }
    }
    queryString =
      queryString +
      'ORDER BY ' +
      normalizedSortField +
      ' ' +
      normalizedSortDirection;
    queryString =
      queryString +
      ' LIMIT ' +
      String.valueOf(parsedSubscriberLimit) +
      ' OFFSET ' +
      String.valueOf(parsedSubscriberOffset);
    if (Type.forName('PackageSubscriber') != null) {
      SObjectAccessDecision decision = Security.stripInaccessible(
        AccessType.READABLE,
        Database.query(queryString) // NOPMD - Sort tokens are allowlisted, pagination is bounded, and filter literals are validated or escaped.
      );
      for (sObject o : decision.getRecords()) {
        ObjectWrappers.PackageSubscriberWrapper ps = (ObjectWrappers.PackageSubscriberWrapper) JSON.deserialize(
          JSON.serialize(o),
          ObjectWrappers.PackageSubscriberWrapper.class
        );
        packageSubList.add(ps);
      }
    }
    return packageSubList;
  }

  /**************************************************************************************
   * @Description  PackageSubscriber rows whose ParentOrg matches a production org (sandboxes created from that org).
   **************************************************************************************/
  public static List<ObjectWrappers.PackageSubscriberWrapper> getPackageSubscribersByParentOrg(
    String parentOrgKey,
    String subscriberLimit,
    String subscriberOffset
  ) {
    List<ObjectWrappers.PackageSubscriberWrapper> packageSubList = new List<ObjectWrappers.PackageSubscriberWrapper>();
    if (
      String.isBlank(parentOrgKey) || Type.forName('PackageSubscriber') == null
    ) {
      return packageSubList;
    }
    String lim = String.valueOf(
      SoqlInputValidator.parseIntegerInRange(
        String.isNotBlank(subscriberLimit) ? subscriberLimit : '50',
        1,
        2000,
        'Invalid subscriber limit.'
      )
    );
    String off = String.valueOf(
      SoqlInputValidator.parseIntegerInRange(
        String.isNotBlank(subscriberOffset) ? subscriberOffset : '0',
        0,
        2000,
        'Invalid subscriber offset.'
      )
    );
    String queryString =
      'SELECT Id, MetadataPackageId, MetadataPackageVersionId, OrgKey, OrgName, OrgType, OrgStatus, InstanceName, ParentOrg, CustomUpgradeType, HasRestrictionEnabled, IsCustomUpgradeAllowed, SystemModstamp FROM PackageSubscriber WHERE ParentOrg = \'' +
      String.escapeSingleQuotes(parentOrgKey) +
      '\' ORDER BY SystemModstamp DESC LIMIT ' +
      lim +
      ' OFFSET ' +
      off;
    SObjectAccessDecision decision = Security.stripInaccessible(
      AccessType.READABLE,
      Database.query(queryString) // NOPMD - ParentOrg is escaped and pagination values are bounded integers.
    );
    for (sObject o : decision.getRecords()) {
      ObjectWrappers.PackageSubscriberWrapper ps = (ObjectWrappers.PackageSubscriberWrapper) JSON.deserialize(
        JSON.serialize(o),
        ObjectWrappers.PackageSubscriberWrapper.class
      );
      ps.id = (String) o.get('Id');
      packageSubList.add(ps);
    }
    return packageSubList;
  }

  /**************************************************************************************
   * @Description  Get a single PackageSubscriber by OrgKey.
   **************************************************************************************/
  global static ObjectWrappers.PackageSubscriberWrapper getPackageSubscriberByOrgKey(
    String orgKey
  ) {
    ObjectWrappers.PackageSubscriberWrapper subscriber = new ObjectWrappers.PackageSubscriberWrapper();
    if (String.isBlank(orgKey) || Type.forName('PackageSubscriber') == null) {
      return subscriber;
    }
    String queryString = 'SELECT Id, MetadataPackageId, MetadataPackageVersionId, OrgKey, OrgName, OrgType, OrgStatus, InstanceName, ParentOrg, CustomUpgradeType, HasRestrictionEnabled, IsCustomUpgradeAllowed FROM PackageSubscriber WHERE OrgKey = :orgKey LIMIT 1';
    SObjectAccessDecision decision = Security.stripInaccessible(
      AccessType.READABLE,
      Database.query(queryString) // NOPMD - Fixed SOQL uses the orgKey bind; no query token is concatenated.
    );
    for (sObject o : decision.getRecords()) {
      subscriber = (ObjectWrappers.PackageSubscriberWrapper) JSON.deserialize(
        JSON.serialize(o),
        ObjectWrappers.PackageSubscriberWrapper.class
      );
    }
    return subscriber;
  }

  /**************************************************************************************
	* @Description  Get the list of packages subscriber group by provided field for displaying chart in package subscriber componenet.
					Additional filters can be handled by filter class
	**************************************************************************************/
  public static List<AggregateResult> getSubscriberChartData(
    list<ObjectWrappers.FilterWrapper> filterWrapperList,
    string groupByField
  ) {
    String normalizedGroupByField = SoqlInputValidator.normalizeAllowlistedIdentifier(
      groupByField,
      PACKAGE_SUBSCRIBER_CHART_GROUP_MAP,
      'Invalid subscriber chart group field.'
    );
    String queryString =
      'SELECT Count(Id), ' +
      normalizedGroupByField +
      ' FROM PackageSubscriber ';
    String whereClause = '';
    if (filterWrapperList != null && !filterWrapperList.isEmpty()) {
      whereClause = getWhereClause(filterWrapperList);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' WHERE ' + whereClause;
      }
    }
    queryString = queryString + ' GROUP BY ' + normalizedGroupByField;
    queryString = queryString + ' ORDER BY Count(Id) DESC LIMIT 6';
    List<AggregateResult> subChartData = new List<AggregateResult>();
    if (Type.forName('PackageSubscriber') != null) {
      subChartData = Database.query(queryString); // NOPMD - Group fields are allowlisted and filter literals are validated or escaped.
    }
    return subChartData;
  }

  /**************************************************************************************
	* @Description  Get the list of packages subscriber group by provided field for displaying chart in lma data table componenet.
					Additional filters can be handled by filter class 
	**************************************************************************************/
  public static List<AggregateResult> getLmaChartData(
    List<ObjectWrappers.FilterWrapper> filterWrapperList,
    string groupByField
  ) {
    String normalizedGroupByField = SoqlInputValidator.normalizeAllowlistedIdentifier(
      groupByField,
      LMA_CHART_GROUP_MAP,
      'Invalid LMA chart group field.'
    );
    String queryString =
      'SELECT Count(Id), ' +
      normalizedGroupByField +
      ' FROM sfLma__License__c ';
    String whereClause = '';
    if (filterWrapperList != null && !filterWrapperList.isEmpty()) {
      whereClause = getWhereClause(filterWrapperList);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' WHERE ' + whereClause;
      }
    }
    queryString = queryString + ' GROUP BY ' + normalizedGroupByField;
    queryString = queryString + ' ORDER BY Count(Id) DESC LIMIT 6';
    List<AggregateResult> lmaChartData = new List<AggregateResult>();
    if (Type.forName('sfLma__License__c') != null) {
      lmaChartData = Database.query(queryString); // NOPMD - Group fields are allowlisted and filter literals are validated or escaped.
    }
    return lmaChartData;
  }

  public static List<AggregateResult> getPackagePushJobChartData(
    List<ObjectWrappers.FilterWrapper> filterWrapperList,
    string groupByField
  ) {
    String normalizedGroupByField = SoqlInputValidator.normalizeAllowlistedIdentifier(
      groupByField,
      PACKAGE_PUSH_JOB_CHART_GROUP_MAP,
      'Invalid package push job chart group field.'
    );
    String queryString =
      'SELECT Count(Id), ' +
      normalizedGroupByField +
      ' FROM PackagePushJob ';
    String whereClause = '';
    if (filterWrapperList != null && !filterWrapperList.isEmpty()) {
      whereClause = getWhereClause(filterWrapperList);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' WHERE ' + whereClause;
      }
    }
    queryString = queryString + ' GROUP BY ' + normalizedGroupByField;
    queryString = queryString + ' ORDER BY Count(Id) DESC LIMIT 6';
    List<AggregateResult> chartData = new List<AggregateResult>();
    if (Type.forName('PackagePushJob') != null) {
      chartData = Database.query(queryString); // NOPMD - Group fields are allowlisted and filter literals are validated or escaped.
    }
    return chartData;
  }

  /**************************************************************************************
   * @Description	Get the list of package versions for the given package and additional filters passed through FilterWrapper
   **************************************************************************************/
  global static List<ObjectWrappers.PackageVersionWrapper> getPackage2Versions(
    list<ObjectWrappers.FilterWrapper> filterWrapperList,
    String minMajorVersion,
    String maxMajorVersion,
    String minMinorVersion,
    String maxMinorVersion,
    String sortedBy,
    String sortDirection,
    String versionLimit,
    String versionOffset
  ) {
    List<ObjectWrappers.PackageVersionWrapper> packageVersions = new List<ObjectWrappers.PackageVersionWrapper>();
    Integer parsedVersionLimit = SoqlInputValidator.parseIntegerInRange(
      versionLimit,
      1,
      2000,
      'Invalid version limit.'
    );
    Integer parsedVersionOffset = SoqlInputValidator.parseIntegerInRange(
      versionOffset,
      0,
      2000,
      'Invalid version offset.'
    );
    String queryString = 'SELECT Id, Branch, Description, IsPasswordProtected, IsReleased, MajorVersion, MinorVersion, PatchVersion, BuildNumber, Tag, Name, Package2Id, SubscriberPackageVersionId, AncestorId, ValidationSkipped, BuildDurationInSeconds, HasPassedCodeCoverageCheck, HasMetadataRemoved, ReleaseVersion, Language, CreatedBy.Name, CreatedDate, ValidatedAsync FROM Package2Version WHERE IsDeprecated = false ';
    String whereClause = '';
    if (filterWrapperList != null && !filterWrapperList.isEmpty()) {
      whereClause = getWhereClause(filterWrapperList);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' AND ' + whereClause;
      }
    }
    if (
      minMajorVersion != null &&
      maxMajorVersion != null &&
      minMinorVersion != null &&
      maxMinorVersion != null
    ) {
      Integer parsedMinMajorVersion = SoqlInputValidator.parseNonNegativeInteger(
        minMajorVersion,
        'Invalid version range.'
      );
      Integer parsedMaxMajorVersion = SoqlInputValidator.parseNonNegativeInteger(
        maxMajorVersion,
        'Invalid version range.'
      );
      Integer parsedMinMinorVersion = SoqlInputValidator.parseNonNegativeInteger(
        minMinorVersion,
        'Invalid version range.'
      );
      Integer parsedMaxMinorVersion = SoqlInputValidator.parseNonNegativeInteger(
        maxMinorVersion,
        'Invalid version range.'
      );
      String versionClause = getVersionRangeWhereClause(
        parsedMinMajorVersion,
        parsedMaxMajorVersion,
        parsedMinMinorVersion,
        parsedMaxMinorVersion
      );
      queryString = queryString + versionClause;
    }
    if (hasSortInputs(sortedBy, sortDirection)) {
      String normalizedSortDirection = SoqlInputValidator.normalizeSortDirection(
        sortDirection,
        'Invalid version sort direction.'
      );
      String normalizedSortField = SoqlInputValidator.normalizeAllowlistedIdentifier(
        sortedBy,
        PACKAGE2_VERSION_SORT_FIELD_MAP,
        'Invalid version sort field.'
      );
      queryString =
        queryString +
        buildOrderByClauseForVersions(
          normalizedSortField,
          normalizedSortDirection
        );
    }
    queryString =
      queryString +
      ' LIMIT ' +
      String.valueOf(parsedVersionLimit) +
      ' OFFSET ' +
      String.valueOf(parsedVersionOffset);
    List<Object> records = submitQuery(queryString);
    for (Object record : records) {
      ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.PackageVersionWrapper.class
      );
      p.versionNumber =
        p.majorVersion +
        '.' +
        p.minorVersion +
        '.' +
        p.patchVersion +
        '-' +
        p.buildNumber;
      if (p.CreatedBy != null) {
        p.owner = p.CreatedBy.name;
      }
      p.id = p.id;
      p.buildDurationInSeconds = p.buildDurationInSeconds;
      p.releaseVersion = p.releaseVersion;
      p.hasPassedCodeCoverageCheck = p.hasPassedCodeCoverageCheck == true;
      p.isDeprecated = p.isDeprecated == true;
      p.isPasswordProtected = p.isPasswordProtected == true;
      p.isReleased = p.isReleased == true;
      p.validationSkipped = p.validationSkipped == true;
      p.hasMetadataRemoved = p.hasMetadataRemoved == true;
      if (!String.isBlank(p.subscriberPackageVersionId)) {
        p.installUrl =
          'https://login.salesforce.com/packaging/installPackage.apexp?p0=' +
          p.subscriberPackageVersionId;
      }
      packageVersions.add(p);
    }
    return packageVersions;
  }

  /**************************************************************************************
   * @Description	Get the list of Package2VersionCreateRequest records (the async build
   * jobs that produce a Package2Version). Scoped/filtered via the FilterWrapper list
   * (e.g. Package2Id, Status). Mirrors getPackage2Versions but has no baseline WHERE.
   **************************************************************************************/
  public static List<ObjectWrappers.Package2VersionCreateRequestWrapper> getPackage2VersionCreateRequests(
    list<ObjectWrappers.FilterWrapper> filterWrapperList,
    String sortedBy,
    String sortDirection,
    String requestLimit,
    String requestOffset
  ) {
    List<ObjectWrappers.Package2VersionCreateRequestWrapper> createRequests = new List<ObjectWrappers.Package2VersionCreateRequestWrapper>();
    Integer parsedRequestLimit = SoqlInputValidator.parseIntegerInRange(
      requestLimit,
      1,
      2000,
      'Invalid create-request limit.'
    );
    Integer parsedRequestOffset = SoqlInputValidator.parseIntegerInRange(
      requestOffset,
      0,
      2000,
      'Invalid create-request offset.'
    );
    String queryString = 'SELECT Id, Status, Package2Id, Package2VersionId, Branch, Tag, AsyncValidation, CalculateCodeCoverage, CalcTransitiveDependencies, SkipValidation, IsDevUsePkgZipRequested, IsPasswordProtected, IsConversionRequest, Language, CreatedBy.Name, CreatedDate, SystemModstamp FROM Package2VersionCreateRequest ';
    if (filterWrapperList != null && !filterWrapperList.isEmpty()) {
      String whereClause = getWhereClause(filterWrapperList);
      if (!String.isBlank(whereClause)) {
        queryString = queryString + ' WHERE ' + whereClause;
      }
    }
    if (hasSortInputs(sortedBy, sortDirection)) {
      String normalizedSortField = SoqlInputValidator.normalizeAllowlistedIdentifier(
        sortedBy,
        PACKAGE2_VERSION_CREATE_REQUEST_SORT_FIELD_MAP,
        'Invalid create-request sort field.'
      );
      String normalizedSortDirection = SoqlInputValidator.normalizeSortDirection(
        sortDirection,
        'Invalid create-request sort direction.'
      );
      queryString =
        queryString +
        ' ORDER BY ' +
        normalizedSortField +
        ' ' +
        normalizedSortDirection;
    }
    queryString =
      queryString +
      ' LIMIT ' +
      String.valueOf(parsedRequestLimit) +
      ' OFFSET ' +
      String.valueOf(parsedRequestOffset);
    List<Object> records = submitQuery(queryString);
    for (Object record : records) {
      ObjectWrappers.Package2VersionCreateRequestWrapper createRequest = (ObjectWrappers.Package2VersionCreateRequestWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.Package2VersionCreateRequestWrapper.class
      );
      if (createRequest.CreatedBy != null) {
        createRequest.CreatedByName = createRequest.CreatedBy.name;
      }
      createRequests.add(createRequest);
    }
    return createRequests;
  }

  /**************************************************************************************
   * @Description	Get the Package2VersionCreateRequestError rows for a create request
   * that failed (Status = 'Error'). Filters on the ParentRequestId reference.
   **************************************************************************************/
  public static List<ObjectWrappers.Package2VersionCreateRequestErrorWrapper> getPackage2VersionCreateRequestErrors(
    String requestId
  ) {
    List<ObjectWrappers.Package2VersionCreateRequestErrorWrapper> errors = new List<ObjectWrappers.Package2VersionCreateRequestErrorWrapper>();
    if (String.isBlank(requestId)) {
      return errors;
    }
    String queryString =
      'SELECT Id, Message, ParentRequestId FROM Package2VersionCreateRequestError WHERE ParentRequestId = \'' +
      String.escapeSingleQuotes(requestId) +
      '\'';
    List<Object> records = submitQuery(queryString);
    for (Object record : records) {
      ObjectWrappers.Package2VersionCreateRequestErrorWrapper createError = (ObjectWrappers.Package2VersionCreateRequestErrorWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.Package2VersionCreateRequestErrorWrapper.class
      );
      errors.add(createError);
    }
    return errors;
  }

  global static List<String> getLatestPackageVersionsList(
    String packageId,
    String versionLimit
  ) {
    Integer parsedVersionLimit = SoqlInputValidator.parseIntegerInRange(
      versionLimit,
      1,
      2000,
      'Invalid latest-version limit.'
    );
    String queryString = 'SELECT SubscriberPackageVersionId FROM Package2Version WHERE IsDeprecated = false AND IsReleased = true AND Package2Id = ';
    queryString =
      queryString +
      '\'' +
      String.escapeSingleQuotes(packageId) +
      '\'' +
      ' ORDER BY CreatedDate DESC LIMIT ' +
      String.valueOf(parsedVersionLimit);
    List<Object> records = submitQuery(queryString);
    List<String> versions = new List<String>();
    for (Object record : records) {
      ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.PackageVersionWrapper.class
      );
      versions.add(p.SubscriberPackageVersionId);
    }
    return versions;
  }

  /**************************************************************************************
   * @Description	Invoke the tooling API query passed from parent menthods like Package details, package version etc..
   **************************************************************************************/
  public static List<Object> submitQuery(String queryString) {
    List<Object> records = new List<Map<String, Object>>();
    HTTPRequest req = new HTTPRequest();
    req.setEndpoint(
      getBaseURL('tooling') +
        'query?q=' +
        EncodingUtil.urlEncode(queryString, 'UTF-8')
    );
    req.setMethod('GET');
    applyAuth(req);
    req.setHeader('Content-Type', 'application/json');
    Http h = new Http();
    HttpResponse res = h.send(req);
    if (res.getStatusCode() == 200) {
      String result = res.getBody();
      Map<String, Object> m = (Map<String, Object>) JSON.deserializeUntyped(
        result
      );
      if (m.containsKey('records')) {
        records = (List<Object>) m.get('records');
      }
      return records;
    }
    // On the Named Credential path, surface failures so the UI shows a real cause
    // rather than an empty list. The legacy session path keeps its prior behavior.
    if (useNamedCredential()) {
      throw new ToolingCalloutException(
        'Tooling API callout failed (HTTP ' +
          res.getStatusCode() +
          '): ' +
          res.getBody()
      );
    }
    return records;
  }

  /**************************************************************************************
   * @Description Method for getting the visualforce session id inorder to invoke tooling API
   **************************************************************************************/
  global static string getSessionId() {
    Pagereference sidPage = Page.SessionCreator;
    if (Test.isRunningTest()) {
      return 'we can not run getContent in test class';
    } else {
      Map<String, Object> sidJSON = (Map<String, Object>) JSON.deserializeUntyped(
        sidPage.getContent().toString()
      );
      String sessionID = (String) sidJSON.get('sessionId');
      return sessionID;
    }
  }

  // Developer name of the packaged Named Credential that fronts the org's own
  // Tooling/REST API via OAuth Client Credentials. The 'callout:' endpoint is
  // namespace-qualified at runtime (pkgviz__ when installed) so the same code
  // works in a namespaced subscriber org and a local scratch org.
  @TestVisible
  private static final String NAMED_CREDENTIAL_DEVNAME = 'Package_Visualizer_Named_Credential';
  @TestVisible
  private static final String EXTERNAL_CREDENTIAL_DEVNAME = 'Package_Visualizer_External_Credential';

  // Subscriber-owned Named Credential created by the setup wizard at runtime.
  // Unmanaged, so referenced by bare dev name (no pkgviz__ prefix).
  @TestVisible
  private static final String NEW_NC_DEVNAME = 'pkgviz_Tooling_Named_Credential';

  // Cached per-transaction read of the Use_Named_Credential__c toggle.
  @TestVisible
  private static Boolean useNamedCredentialOverride = null;

  /**
   * @Description  Whether callouts should route through the packaged Named
   * Credential (true) or the legacy Visualforce session-id path (false).
   * Reads the protected hierarchy Custom Setting org default; cached for the
   * transaction. A test can force the value via useNamedCredentialOverride.
   * @return true when the Named Credential path is enabled.
   */
  @TestVisible
  private static Boolean useNamedCredential() {
    if (useNamedCredentialOverride != null) {
      return useNamedCredentialOverride;
    }
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    return settings != null && settings.Use_Named_Credential__c == true;
  }

  /**************************************************************************************
   * @Description	Public read of the Named Credential toggle, for the migration
   * UI / status checks.
   * @return true when callouts route through the Named Credential.
   **************************************************************************************/
  global static Boolean isNamedCredentialEnabled() {
    return useNamedCredential();
  }

  /**************************************************************************************
   * @Description	Persists the Named Credential toggle on the org-default
   * Integration Settings. Called by the migration tool only after a verified
   * test callout. Resets the per-transaction cache so the new value takes effect.
   * @param enabled  true to route callouts through the Named Credential.
   **************************************************************************************/
  global static void setNamedCredentialEnabled(Boolean enabled) {
    Integration_Settings__c settings = Integration_Settings__c.getOrgDefaults();
    if (settings.Id == null) {
      settings.SetupOwnerId = UserInfo.getOrganizationId();
    }
    settings.Use_Named_Credential__c = enabled;
    upsert settings;
    useNamedCredentialOverride = null;
  }

  /**************************************************************************************
   * @Description	Runs a minimal Tooling API query through the Named Credential
   * path, regardless of the current toggle. Used by the setup wizard's
   * "Test & Confirm" step to verify the OAuth self-callout works before enabling the
   * toggle org-wide. Queries ApexClass — a Tooling object present in EVERY org — so
   * the test proves the secure connection regardless of whether this is a Dev Hub
   * (Package2 only exists in Dev Hub orgs; querying it would falsely fail the test in
   * non-Dev-Hub orgs even when auth is working). Returns the query records on HTTP
   * 200, or throws on any non-200 response.
   * @return Query records on success.
   **************************************************************************************/
  global static List<Object> testNamedCredentialCallout() {
    Boolean previousOverride = useNamedCredentialOverride;
    try {
      useNamedCredentialOverride = true;
      HttpRequest req = new HttpRequest();
      req.setEndpoint(
        getBaseURL('tooling') +
          'query?q=' +
          EncodingUtil.urlEncode('SELECT Id FROM ApexClass LIMIT 1', 'UTF-8')
      );
      req.setMethod('GET');
      applyAuth(req);
      req.setHeader('Content-Type', 'application/json');
      HttpResponse res = new Http().send(req);
      if (res.getStatusCode() == 200) {
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
          res.getBody()
        );
        return body.containsKey('records')
          ? (List<Object>) body.get('records')
          : new List<Object>();
      }
      throw new ToolingCalloutException(
        'Test callout failed (HTTP ' +
          res.getStatusCode() +
          '): ' +
          res.getBody()
      );
    } finally {
      useNamedCredentialOverride = previousOverride;
    }
  }

  /**************************************************************************************
   * @Description	Returns the host portion of a Salesforce API endpoint. When the
   * Named Credential path is enabled, returns the namespace-qualified
   * 'callout:<NamedCredential>' reference so the platform injects the OAuth
   * bearer token (generateAuthorizationHeader). Otherwise returns the current
   * org domain URL used with the legacy session-id header. Shared by all
   * Tooling/REST callouts so they route consistently.
   **************************************************************************************/
  global static String getApiHost() {
    if (useNamedCredential()) {
      // Route through the subscriber-owned Named Credential CREATED at runtime by
      // ToolingCredentialService.provisionCredentials(). It is unmanaged (bare
      // name, no pkgviz__ prefix), so its callout URL is set to the subscriber's My
      // Domain at setup time — sidestepping the managed-component URL lock that
      // makes a PACKAGED Named Credential's URL uneditable in a subscriber org
      // (verified: packaged NC URL can't be changed by Apex or admin Setup UI).
      return 'callout:' + NEW_NC_DEVNAME;
    }
    return URL.getOrgDomainUrl().toExternalForm();
  }

  /**************************************************************************************
   * @Description	Returns the Named Credential developer name qualified with the
   * running namespace ('pkgviz__Package_Visualizer_Named_Credential' when
   * installed, unqualified in a local/scratch org). Used for both the
   * 'callout:' endpoint and ConnectApi management calls so they always target
   * the same credential.
   **************************************************************************************/
  global static String getQualifiedNamedCredentialName() {
    String ns = getPackageNamespace();
    return (String.isBlank(ns) ? '' : ns + '__') + NAMED_CREDENTIAL_DEVNAME;
  }

  /**************************************************************************************
   * @Description	Returns the External Credential developer name qualified with
   * the running namespace, for ConnectApi management calls.
   **************************************************************************************/
  global static String getQualifiedExternalCredentialName() {
    String ns = getPackageNamespace();
    return (String.isBlank(ns) ? '' : ns + '__') + EXTERNAL_CREDENTIAL_DEVNAME;
  }

  /**************************************************************************************
   * @Description	Method for getting the current org base URL for tooling API.
   * Builds on getApiHost() so callouts honor the Named Credential toggle.
   **************************************************************************************/
  global static string getBaseURL(String apiType) {
    return getApiHost() +
      '/services/data/v67.0/' +
      String.escapeSingleQuotes(apiType) +
      '/';
  }

  /**************************************************************************************
   * @Description	Apply authentication to a Tooling/REST API request. On the
   * Named Credential path the platform injects the Authorization header, so this
   * is a no-op. On the legacy path it adds the Visualforce session-id bearer.
   **************************************************************************************/
  global static void applyAuth(HttpRequest req) {
    if (!useNamedCredential()) {
      req.setHeader('Authorization', 'Bearer ' + getSessionId());
    }
  }

  /**************************************************************************************
   * @Description	Method that build where cloud. We are using escapeSingleQuotes in this method.
   **************************************************************************************/
  @TestVisible
  public static string getWhereClause(
    list<ObjectWrappers.FilterWrapper> FilterWrapperList
  ) {
    string whereClause = '';
    if (FilterWrapperList == null || FilterWrapperList.isEmpty()) {
      return whereClause;
    }
    for (ObjectWrappers.FilterWrapper fw : FilterWrapperList) {
      string fName = getSafeFilterFieldName(fw.fieldName);
      string value = fw.value;
      String dataType = fw.dataType == null
        ? null
        : fw.dataType.trim().toUpperCase();
      if (!String.isBlank(fName) && !String.isBlank(value)) {
        if (!String.isBlank(whereClause)) {
          whereClause = whereClause + ' AND ';
        }
        if ('STRING'.equals(dataType)) {
          whereClause =
            whereClause +
            ' ' +
            fName +
            '=' +
            '\'' +
            String.escapeSingleQuotes(value) +
            '\'';
        } else if ('ID'.equals(dataType)) {
          whereClause =
            whereClause +
            ' ' +
            fName +
            ' = ' +
            '\'' +
            String.escapeSingleQuotes(value) +
            '\'';
        } else if ('LIST'.equals(dataType)) {
          whereClause =
            whereClause +
            ' ' +
            fName +
            ' IN ' +
            '(' +
            parseListValues(value) +
            ') ';
        } else if ('SEARCH'.equals(dataType)) {
          whereClause =
            whereClause +
            ' ' +
            fName +
            ' LIKE ' +
            '\'%' +
            escapeSoqlLikeValue(value) +
            '%\'';
        } else if ('BOOLEAN'.equals(dataType)) {
          String normalizedBoolean = SoqlInputValidator.normalizeBooleanLiteral(
            value,
            INVALID_FILTER_BOOLEAN_MESSAGE
          );
          whereClause = whereClause + ' ' + fName + ' = ' + normalizedBoolean;
        } else if ('LESSOREQUAL'.equals(dataType)) {
          String normalizedDecimal = SoqlInputValidator.normalizeStrictDecimalLiteral(
            value,
            INVALID_FILTER_DECIMAL_MESSAGE
          );
          whereClause = whereClause + ' ' + fName + ' <= ' + normalizedDecimal;
        } else if ('GREATEROREQUAL'.equals(dataType)) {
          String normalizedDecimal = SoqlInputValidator.normalizeStrictDecimalLiteral(
            value,
            INVALID_FILTER_DECIMAL_MESSAGE
          );
          whereClause = whereClause + ' ' + fName + ' >= ' + normalizedDecimal;
        } else {
          throw validationException(INVALID_FILTER_TYPE_MESSAGE);
        }
      }
    }
    return whereClause;
  }

  @TestVisible
  private static String getSafeFilterFieldName(String fieldName) {
    if (String.isBlank(fieldName)) {
      return null;
    }
    String trimmedFieldName = fieldName.trim();
    if (
      !Pattern.matches(
        '^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)?$',
        trimmedFieldName
      )
    ) {
      throw validationException(INVALID_FILTER_FIELD_MESSAGE);
    }
    return trimmedFieldName;
  }

  @TestVisible
  private static String escapeSoqlLikeValue(String value) {
    return SoqlInputValidator.escapeLikeSearchValue(value);
  }

  private static string getVersionRangeWhereClause(
    Integer minMajorVersion,
    Integer maxMajorVersion,
    Integer minMinorVersion,
    Integer maxMinorVersion
  ) {
    string versionClause =
      ' AND ((MajorVersion = ' +
      String.valueOf(minMajorVersion) +
      ' AND MinorVersion >= ' +
      String.valueOf(minMinorVersion) +
      ') OR (MajorVersion > ' +
      String.valueOf(minMajorVersion) +
      ' )) AND ((MajorVersion = ' +
      String.valueOf(maxMajorVersion) +
      ' AND MinorVersion <= ' +
      String.valueOf(maxMinorVersion) +
      ') OR (MajorVersion < ' +
      String.valueOf(maxMajorVersion) +
      ' ))';
    return versionClause;
  }

  public static String getPackageVersionCodeCoverage(
    String subscriberPackageVersionId
  ) {
    string queryString =
      'SELECT id, SubscriberPackageVersionId, CodeCoverage FROM Package2Version WHERE SubscriberPackageVersionId = \'' +
      String.escapeSingleQuotes(subscriberPackageVersionId) +
      '\' LIMIT 1';
    String codeCoverage;
    List<Object> records = submitQuery(queryString);
    for (Object record : records) {
      ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.PackageVersionWrapper.class
      );
      try {
        codeCoverage = p.codeCoverage.apexCodeCoveragePercentage;
      } catch (Exception e) {
        codeCoverage = '-1';
      }
    }
    return codeCoverage;
  }

  public static Boolean getIsSecurityReviewed(
    String subscriberPackageVersionId
  ) {
    string queryString =
      'SELECT Id, IsSecurityReviewed FROM SubscriberPackageVersion WHERE Id = \'' +
      String.escapeSingleQuotes(subscriberPackageVersionId) +
      '\' LIMIT 1';
    Boolean isSecurityReviewApproved;
    List<Object> records = submitQuery(queryString);
    for (Object record : records) {
      ObjectWrappers.PackageVersionWrapper p = (ObjectWrappers.PackageVersionWrapper) JSON.deserialize(
        JSON.serialize(record),
        ObjectWrappers.PackageVersionWrapper.class
      );
      try {
        isSecurityReviewApproved = p.isSecurityReviewed;
      } catch (Exception e) {
        isSecurityReviewApproved = null;
      }
    }
    return isSecurityReviewApproved;
  }

  /**************************************************************************************
   * @Description	Private method that rebuild string for IN clause.
   **************************************************************************************/
  @TestVisible
  private static String parseListValues(string value) {
    string retString = '';
    if (!String.isBlank(value)) {
      for (String str : value.split('~')) {
        if (!String.isBlank(str)) {
          retString =
            retString +
            '\'' +
            String.escapeSingleQuotes(str.trim()) +
            '\',';
        }
      }
    }
    if (!String.isBlank(retString)) {
      retString = retString.substring(0, retString.length() - 1);
    }
    return retString;
  }

  private static Boolean hasSortInputs(String sortedBy, String sortDirection) {
    if (String.isBlank(sortedBy) && String.isBlank(sortDirection)) {
      return false;
    }
    if (String.isBlank(sortedBy) || String.isBlank(sortDirection)) {
      throw validationException(INVALID_SORT_PAIR_MESSAGE);
    }
    return true;
  }

  private static AuraHandledException validationException(String message) {
    AuraHandledException error = new AuraHandledException(message);
    error.setMessage(message);
    return error;
  }

  private static String buildOrderByClauseForVersions(
    String normalizedSortField,
    String normalizedSortDirection
  ) {
    if ('versionNumber'.equals(normalizedSortField)) {
      return ' ORDER BY MajorVersion ' +
        normalizedSortDirection +
        ', MinorVersion ' +
        normalizedSortDirection +
        ', PatchVersion ' +
        normalizedSortDirection +
        ', BuildNumber ' +
        normalizedSortDirection;
    }
    return ' ORDER BY ' + normalizedSortField + ' ' + normalizedSortDirection;
  }

  public static String updateLicense(
    String licenseId,
    String expirationDate,
    String seats,
    String status
  ) {
    try {
      SObjectType sObjectType = Schema.getGlobalDescribe()
        .get('sfLma__License__c');
      Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
      Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();
      Boolean objectCrudCheck = sObjectType.getDescribe().isUpdateable();
      if (objectCrudCheck == true) {
        SObject lmaLicense = sObjectType.newSObject();
        lmaLicense.put('id', licenseId);
        if (
          fieldsMap.get('sfLma__Status__c').getDescribe().isUpdateable() &&
          status != null
        ) {
          lmaLicense.put('sfLma__Status__c', String.escapeSingleQuotes(status));
        }
        if (
          fieldsMap.get('sfLma__Expiration__c').getDescribe().isUpdateable()
        ) {
          if (expirationDate != null && expirationDate != '') {
            lmaLicense.put(
              'sfLma__Expiration__c',
              Date.valueOf(String.escapeSingleQuotes(expirationDate))
            );
          } else {
            lmaLicense.put('sfLma__Expiration__c', null);
          }
        }
        if (fieldsMap.get('sfLma__Seats__c').getDescribe().isUpdateable()) {
          if (seats != null && seats != '') {
            lmaLicense.put('sfLma__Seats__c', Integer.valueOf(seats));
          } else {
            lmaLicense.put('sfLma__Seats__c', -1);
          }
        }
        update lmaLicense;
        return lmaLicense.id;
      }
    } catch (Exception e) {
      throw new AuraHandledException('Something went wrong!');
    }
    return null;
  }

  public static String updatePackage2Fields(
    List<ObjectWrappers.FilterWrapper> filterWrapperList,
    String objectName,
    String objectId
  ) {
    try {
      String httpBody = '{';
      for (ObjectWrappers.FilterWrapper fw : filterWrapperList) {
        httpBody = httpBody + '"' + fw.fieldName + '":"' + fw.value + '",';
      }
      httpBody = httpBody.substring(0, httpBody.length() - 1);
      httpBody = httpBody + '}';
      Http http = new Http();
      HTTPRequest req = new HTTPRequest();
      req.setEndpoint(
        getBaseURL('tooling') +
          'sobjects/' +
          String.escapeSingleQuotes(objectName) +
          '/' +
          String.escapeSingleQuotes(objectId) +
          '/'
      );
      req.setMethod('PATCH');
      applyAuth(req);
      req.setHeader('Content-Type', 'application/json;charset=UTF-8');
      req.setHeader('Accept', 'application/json');
      req.setBody(httpBody);
      HttpResponse res = http.send(req);
      if (res.getStatusCode() == 204) {
        return 'success';
      } else {
        return res.getBody();
      }
    } catch (Exception e) {
      throw new AuraHandledException('Something went wrong!');
    }
  }

  public static String getEnvHubMemberId(String orgId) {
    String queryString = 'SELECT Id, MemberEntity FROM EnvironmentHubMember WHERE MemberEntity = :orgId WITH SECURITY_ENFORCED LIMIT 1 ';
    sObject s = Database.query(queryString); // NOPMD - Fixed SOQL uses the orgId bind; no query token is concatenated.
    return s.Id;
  }

  @AuraEnabled(cacheable=true)
  public static boolean isAccount() {
    return (Type.forName('Account') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isContact() {
    return (Type.forName('Contact') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isLead() {
    return (Type.forName('Lead') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isOpportunity() {
    return (Type.forName('Opportunity') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isCampaign() {
    return (Type.forName('Campaign') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isCase() {
    return (Type.forName('Case') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isTask() {
    return (Type.forName('Task') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isEvent() {
    return (Type.forName('Event') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isUser() {
    return (Type.forName('User') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isOrder() {
    return (Type.forName('Order') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isAsset() {
    return (Type.forName('Asset') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isContract() {
    return (Type.forName('Contract') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isPricebook2() {
    return (Type.forName('Pricebook2') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isProduct2() {
    return (Type.forName('Product2') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isCampaignMember() {
    return (Type.forName('CampaignMember') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isActiveScratchOrg() {
    return (Type.forName('ActiveScratchOrg') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isRecommendation() {
    return (Type.forName('Recommendation') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isPackageVersion() {
    return (Type.forName('sfLma__Package_Version__c') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isPackage() {
    return (Type.forName('sfLma__Package__c') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isLicense() {
    return (Type.forName('sfLma__License__c') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isContentVersion() {
    return (Type.forName('ContentVersion') != null);
  }

  @AuraEnabled(cacheable=true)
  public static boolean isEnvironmentHubMember() {
    return (Type.forName('EnvironmentHubMember') != null);
  }

  /**************************************************************************************
   * @Description  Get the list of package dependencies for a given subscriber package version ID
   **************************************************************************************/
  public static ObjectWrappers.PackageDependenciesResponse getPackageDependencies(
    String subscriberPackageVersionId
  ) {
    ObjectWrappers.PackageDependenciesResponse response = new ObjectWrappers.PackageDependenciesResponse();
    response.dependencies = new List<ObjectWrappers.PackageDependencyWrapper>();

    String queryString =
      'SELECT Dependencies FROM SubscriberPackageVersion WHERE Id = \'' +
      String.escapeSingleQuotes(subscriberPackageVersionId) +
      '\' LIMIT 50';
    List<Object> records = submitQuery(queryString);

    if (!records.isEmpty()) {
      Map<String, Object> record = (Map<String, Object>) records[0];
      if (
        record.containsKey('Dependencies') && record.get('Dependencies') != null
      ) {
        Map<String, Object> dependenciesObj = (Map<String, Object>) record.get(
          'Dependencies'
        );
        if (
          dependenciesObj.containsKey('ids') &&
          dependenciesObj.get('ids') != null
        ) {
          List<Object> dependencyIds = (List<Object>) dependenciesObj.get(
            'ids'
          );
          for (Object depId : dependencyIds) {
            Map<String, Object> dependency = (Map<String, Object>) depId;
            ObjectWrappers.PackageDependencyWrapper depWrapper = new ObjectWrappers.PackageDependencyWrapper();
            if (dependency.containsKey('subscriberPackageVersionId')) {
              depWrapper.subscriberPackageVersionId = (String) dependency.get(
                'subscriberPackageVersionId'
              );
            }
            response.dependencies.add(depWrapper);
          }
        }
      }
    }
    return response;
  }

  // Tooling Schema strings can be large; cap parsing at 256 KB to stay well clear
  // of the Apex heap limit when many servers are returned at once.
  private static final Integer MCP_SCHEMA_MAX_LENGTH = 262144;

  /**************************************************************************************
   * @Description  Live discovery of MCP servers registered in the org. MCP servers
   * are ExternalServiceRegistration rows whose RegistrationProviderType is
   * 'ModelContextProtocol'; each carries a Schema JSON document describing the
   * server, its tools and their input/output fields.
   **************************************************************************************/
  public static List<ObjectWrappers.McpServerWrapper> getMcpServers() {
    // ExternalServiceRegistration is a Tooling-only object: it is never in the
    // enterprise schema, so Type.forName() always returns null for it — guarding
    // on that would disable the feature in every org. Instead we let the Tooling
    // callout run and rely on the submitQuery try/catch below to degrade
    // gracefully if the object or integration isn't available.
    List<ObjectWrappers.McpServerWrapper> servers = new List<ObjectWrappers.McpServerWrapper>();
    // serverLabel -> the parsed I/O of each tool the server's Schema advertises,
    // keyed by tool name. Used to enrich the accepted-tool (GenAiFunction) list.
    Map<String, Map<String, ObjectWrappers.McpToolWrapper>> schemaToolsByServer = new Map<String, Map<String, ObjectWrappers.McpToolWrapper>>();
    // Only surface ESRs that were distributed by this ISV package:
    // NamespacePrefix = 'pkgviz' AND ManageableState = 'installed'.
    // Subscriber-created (unmanaged) servers are excluded.
    String queryString = 'SELECT Id, MasterLabel, DeveloperName, Description, NamedCredential, Status, Schema FROM ExternalServiceRegistration WHERE RegistrationProviderType = \'ModelContextProtocol\' AND NamespacePrefix = \'pkgviz\' AND ManageableState = \'installed\' ORDER BY MasterLabel LIMIT 200';
    List<Object> records;
    try {
      records = submitQuery(queryString);
    } catch (Exception e) {
      throw new AuraHandledException(
        'Unable to load MCP servers. Confirm the Tooling API integration is configured.'
      );
    }
    for (Object record : records) {
      Map<String, Object> row = (Map<String, Object>) record;
      ObjectWrappers.McpServerWrapper srv = new ObjectWrappers.McpServerWrapper();
      srv.id = (String) row.get('Id');
      srv.label = (String) row.get('MasterLabel');
      srv.description = (String) row.get('Description');
      srv.namedCredential = (String) row.get('NamedCredential');
      srv.status = (String) row.get('Status');
      srv.isActive = 'Complete'.equalsIgnoreCase(srv.status);
      srv.setupUrl =
        '/lightning/setup/AgentforceRegistry/' +
        toSetupRecordId(srv.id) +
        '/view?setup__source=MCP_SERVER';
      srv.tools = new List<ObjectWrappers.McpToolWrapper>();
      // Parse the Schema for server metadata + per-tool I/O shapes (not the tool list
      // itself — accepted tools come from GenAiFunctionDefinition below).
      schemaToolsByServer.put(
        srv.label,
        parseMcpSchema((String) row.get('Schema'), srv)
      );
      servers.add(srv);
    }

    // Attach the accepted tools (GenAiFunctions the subscriber added during MCP setup).
    // These are the only tools that produce a deployable AgentScript action, so the
    // displayed/generated tool list is GenAiFunction-driven.
    attachAcceptedTools(servers, schemaToolsByServer);

    for (ObjectWrappers.McpServerWrapper srv : servers) {
      srv.toolCount = srv.tools.size();
      srv.hasTools = !srv.tools.isEmpty();
    }
    return servers;
  }

  private static String toSetupRecordId(String recordId) {
    return String.isBlank(recordId) || recordId.length() <= 15
      ? recordId
      : recordId.substring(0, 15);
  }

  /**************************************************************************************
   * @Description  Query GenAiFunctionDefinition for accepted mcpTool functions and
   * correlate them to their server by MasterLabel suffix ("<tool> - <ServerLabel>").
   * Enriches each tool with the input/output shapes parsed from the server Schema and
   * the derived AgentScript target (operation name). A failure here only leaves servers
   * tool-less — it never blanks the server list.
   *
   * Note: correlation is best-effort by label. Two servers sharing a MasterLabel would
   * collide; that is out of scope (subscriber-controlled naming).
   **************************************************************************************/
  private static void attachAcceptedTools(
    List<ObjectWrappers.McpServerWrapper> servers,
    Map<String, Map<String, ObjectWrappers.McpToolWrapper>> schemaToolsByServer
  ) {
    Map<String, ObjectWrappers.McpServerWrapper> serverByLabel = new Map<String, ObjectWrappers.McpServerWrapper>();
    for (ObjectWrappers.McpServerWrapper srv : servers) {
      serverByLabel.put(srv.label, srv);
    }
    List<Object> funcs;
    try {
      funcs = submitQuery(
        'SELECT Id, DeveloperName, MasterLabel, Description, InvocationTargetType FROM GenAiFunctionDefinition WHERE InvocationTargetType = \'mcpTool\' LIMIT 2000'
      );
    } catch (Exception e) {
      // GenAiFunctionDefinition may be permission-gated even when ESR isn't. Degrade
      // to tool-less servers rather than failing the whole list.
      return;
    }
    for (Object f : funcs) {
      Map<String, Object> row = (Map<String, Object>) f;
      String masterLabel = (String) row.get('MasterLabel');
      // MasterLabel format: "<toolName> - <ServerLabel>". Split on the LAST " - " so a
      // tool name containing " - " doesn't break the server match.
      Integer sep = masterLabel == null ? -1 : masterLabel.lastIndexOf(' - ');
      if (sep < 0) {
        continue;
      }
      String toolName = masterLabel.substring(0, sep);
      String serverLabel = masterLabel.substring(sep + 3);
      ObjectWrappers.McpServerWrapper srv = serverByLabel.get(serverLabel);
      if (srv == null) {
        continue;
      }
      ObjectWrappers.McpToolWrapper tool = new ObjectWrappers.McpToolWrapper();
      tool.name = toolName;
      tool.genAiFunctionId = (String) row.get('Id');
      tool.developerName = (String) row.get('DeveloperName');
      tool.masterLabel = masterLabel;
      tool.description = (String) row.get('Description');
      tool.operationName = deriveOperationName(toolName);
      tool.isWired = true;
      // Enrich I/O from the Schema tool of the same name, when available.
      Map<String, ObjectWrappers.McpToolWrapper> schemaTools = schemaToolsByServer.get(
        serverLabel
      );
      ObjectWrappers.McpToolWrapper schemaTool = schemaTools == null
        ? null
        : schemaTools.get(toolName);
      tool.inputs = schemaTool == null
        ? new List<ObjectWrappers.McpIoFieldWrapper>()
        : schemaTool.inputs;
      tool.outputs = schemaTool == null
        ? new List<ObjectWrappers.McpIoFieldWrapper>()
        : schemaTool.outputs;
      srv.tools.add(tool);
    }
  }

  /**************************************************************************************
   * @Description  Derive the AgentScript action target tail from a tool name. The
   * platform encodes the ESR operation as 'mcptool__<toolName>' with each underscore
   * hex-encoded as 'x5f' (0x5F). e.g. 'ask_question' -> 'mcptoolx5fx5faskx5fquestion'.
   **************************************************************************************/
  private static String deriveOperationName(String toolName) {
    if (String.isBlank(toolName)) {
      return null;
    }
    return ('mcptool__' + toolName).replace('_', 'x5f');
  }

  /**************************************************************************************
   * @Description  Parse the Schema JSON of one MCP server. Sets the server's scalar
   * metadata (serverName/version/protocolVersion) and returns the per-tool I/O shapes
   * keyed by tool name. A bad schema flips schemaParseFailed and returns an empty map —
   * it must never blank out the whole server list, so the parse is fully contained here.
   **************************************************************************************/
  private static Map<String, ObjectWrappers.McpToolWrapper> parseMcpSchema(
    String schemaJson,
    ObjectWrappers.McpServerWrapper srv
  ) {
    Map<String, ObjectWrappers.McpToolWrapper> schemaTools = new Map<String, ObjectWrappers.McpToolWrapper>();
    srv.schemaParseFailed = false;
    if (String.isBlank(schemaJson)) {
      return schemaTools;
    }
    if (schemaJson.length() > MCP_SCHEMA_MAX_LENGTH) {
      srv.schemaParseFailed = true;
      return schemaTools;
    }
    try {
      Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(
        schemaJson
      );
      Object descriptorObj = root.get('serverDescriptor');
      if (descriptorObj instanceof Map<String, Object>) {
        Map<String, Object> descriptor = (Map<String, Object>) descriptorObj;
        srv.protocolVersion = (String) descriptor.get('protocolVersion');
        Object serverInfoObj = descriptor.get('serverInfo');
        if (serverInfoObj instanceof Map<String, Object>) {
          Map<String, Object> serverInfo = (Map<String, Object>) serverInfoObj;
          srv.serverName = (String) serverInfo.get('name');
          srv.serverVersion = (String) serverInfo.get('version');
        }
      }
      Object toolsObj = root.get('tools');
      if (toolsObj instanceof List<Object>) {
        for (Object toolObj : (List<Object>) toolsObj) {
          if (!(toolObj instanceof Map<String, Object>)) {
            continue;
          }
          Map<String, Object> tool = (Map<String, Object>) toolObj;
          ObjectWrappers.McpToolWrapper toolWrapper = new ObjectWrappers.McpToolWrapper();
          toolWrapper.name = (String) tool.get('name');
          toolWrapper.inputs = parseIoFields(tool.get('inputSchema'));
          toolWrapper.outputs = parseIoFields(tool.get('outputSchema'));
          if (toolWrapper.name != null) {
            schemaTools.put(toolWrapper.name, toolWrapper);
          }
        }
      }
    } catch (Exception e) {
      // One malformed schema must not break the whole list — never rethrow.
      srv.schemaParseFailed = true;
    }
    return schemaTools;
  }

  /**************************************************************************************
   * @Description  Flatten a JSON-Schema object node ('properties' + 'required') into
   * a list of field wrappers. Vendor extension keys (prefixed 'x-') are ignored.
   * Properties whose type is expressed via 'anyOf' fall back to 'string'.
   **************************************************************************************/
  private static List<ObjectWrappers.McpIoFieldWrapper> parseIoFields(
    Object schemaObj
  ) {
    List<ObjectWrappers.McpIoFieldWrapper> fields = new List<ObjectWrappers.McpIoFieldWrapper>();
    if (!(schemaObj instanceof Map<String, Object>)) {
      return fields;
    }
    Map<String, Object> schema = (Map<String, Object>) schemaObj;
    Object propsObj = schema.get('properties');
    if (!(propsObj instanceof Map<String, Object>)) {
      return fields;
    }
    Map<String, Object> props = (Map<String, Object>) propsObj;
    Set<String> requiredNames = new Set<String>();
    Object requiredObj = schema.get('required');
    if (requiredObj instanceof List<Object>) {
      for (Object req : (List<Object>) requiredObj) {
        if (req instanceof String) {
          requiredNames.add((String) req);
        }
      }
    }
    for (String propName : props.keySet()) {
      if (propName != null && propName.startsWith('x-')) {
        continue;
      }
      ObjectWrappers.McpIoFieldWrapper field = new ObjectWrappers.McpIoFieldWrapper();
      field.name = propName;
      field.isRequired = requiredNames.contains(propName);
      field.type = 'string';
      Object propDefObj = props.get(propName);
      if (propDefObj instanceof Map<String, Object>) {
        Map<String, Object> propDef = (Map<String, Object>) propDefObj;
        Object typeObj = propDef.get('type');
        if (typeObj instanceof String) {
          field.type = (String) typeObj;
        }
        // else: 'anyOf' (or anything else) falls back to the 'string' default.
      }
      fields.add(field);
    }
    return fields;
  }
}
