/**
 * Orchestrates bounded subscriber reads for the Slackbot HXL actions.
 * Mirrors HxlPackageReadService structure for consistent query patterns.
 */
public with sharing class HxlSubscriberReadService {
  private static final Integer PAGE_SIZE = 10;
  private static final String UPSTREAM_ERROR_MESSAGE = 'Subscriber information could not be retrieved. Try again or check Package Visualizer setup.';
  private static final String INVALID_FILTER_MESSAGE = 'Use an exact 033 Subscriber Package ID or 04t Subscriber Package Version ID.';
  private static final String INVALID_ORG_KEY_MESSAGE = 'Organization key is required.';

  @TestVisible
  private static Boolean permissionOverride;

  /**
   * Returns one list result per input filter/cursor pair.
   *
   * @param filters Package or version IDs (033 or 04t)
   * @param cursors Opaque continuation cursors, or blank values for the first page
   * @return One list result for every input filter
   */
  public static List<HxlSubscriberListResult> listSubscribers(
    List<String> filters,
    List<String> cursors
  ) {
    List<HxlSubscriberListResult> results = new List<HxlSubscriberListResult>();
    if (filters == null || filters.isEmpty()) {
      return results;
    }

    String unavailable = unavailableState();
    for (Integer i = 0; i < filters.size(); i++) {
      String filter = filters[i];
      String cursorValue = cursors != null &&
        i < cursors.size()
        ? cursors[i]
        : null;
      HxlSubscriberListResult result;
      if (unavailable != null) {
        result = listResultWithState(unavailable, unavailableMessage());
      } else if (!isValidFilter(filter)) {
        result = listResultWithState('INVALID_FILTER', INVALID_FILTER_MESSAGE);
      } else {
        try {
          PageCursor cursor = decodeCursor(cursorValue);
          result = readSubscriberPage(filter, cursor);
        } catch (InvalidInputException e) {
          result = listResultWithState(
            'INVALID_CURSOR',
            'This subscriber page cursor is invalid. Start again from the subscriber list.'
          );
        } catch (Exception e) {
          result = listResultWithState(
            'UPSTREAM_ERROR',
            UPSTREAM_ERROR_MESSAGE
          );
        }
      }
      results.add(result);
    }
    return results;
  }

  /**
   * Returns one detail result per input orgKey.
   *
   * @param orgKeys Organization keys from PackageSubscriber records
   * @return One detail result for every input orgKey
   */
  public static List<HxlSubscriberDetailResult> getSubscriberDetails(
    List<String> orgKeys
  ) {
    List<HxlSubscriberDetailResult> results = new List<HxlSubscriberDetailResult>();
    if (orgKeys == null || orgKeys.isEmpty()) {
      return results;
    }

    String unavailable = unavailableState();
    for (String orgKey : orgKeys) {
      HxlSubscriberDetailResult result;
      if (unavailable != null) {
        result = detailResultWithState(unavailable, unavailableMessage());
      } else if (String.isBlank(orgKey)) {
        result = detailResultWithState(
          'INVALID_ORG_KEY',
          INVALID_ORG_KEY_MESSAGE
        );
      } else {
        try {
          result = readSubscriberDetail(orgKey);
        } catch (Exception e) {
          result = detailResultWithState(
            'UPSTREAM_ERROR',
            UPSTREAM_ERROR_MESSAGE
          );
        }
      }
      results.add(result);
    }
    return results;
  }

  /**
   * @return True when the action completed with data or a valid empty page
   */
  public static Boolean isSuccessfulState(String state) {
    return state == 'READY' || state == 'EMPTY';
  }

  private static Boolean isValidFilter(String filter) {
    if (String.isBlank(filter)) {
      return false;
    }
    Integer length = filter.length();
    if (length != 15 && length != 18) {
      return false;
    }
    return filter.startsWith('033') || filter.startsWith('04t');
  }

  private static PageCursor decodeCursor(String cursorValue) {
    if (String.isBlank(cursorValue)) {
      return null;
    }
    try {
      String decoded = EncodingUtil.base64Decode(cursorValue).toString();
      Map<String, Object> cursorData = (Map<String, Object>) JSON.deserializeUntyped(
        decoded
      );
      Object modstampValue = cursorData.get('lastModstamp');
      Object idValue = cursorData.get('lastId');
      if (modstampValue == null || idValue == null) {
        throw new InvalidInputException();
      }
      PageCursor cursor = new PageCursor();
      cursor.lastModstamp = (Datetime) JSON.deserialize(
        JSON.serialize(modstampValue),
        Datetime.class
      );
      cursor.lastId = (String) idValue;
      return cursor;
    } catch (InvalidInputException e) {
      throw e;
    } catch (Exception e) {
      throw new InvalidInputException();
    }
  }

  private static String encodeCursor(DateTime lastModstamp, String lastId) {
    String json = JSON.serialize(
      new Map<String, Object>{
        'lastModstamp' => lastModstamp,
        'lastId' => lastId
      }
    );
    return EncodingUtil.base64Encode(Blob.valueOf(json));
  }

  private static HxlSubscriberListResult readSubscriberPage(
    String filter,
    PageCursor cursor
  ) {
    String filterField = filter.startsWith('033')
      ? 'MetadataPackageId'
      : 'MetadataPackageVersionId';
    List<SObject> records = HxlPackageToolingGateway.readSubscriberPage(
      filterField,
      filter,
      cursor?.lastModstamp,
      cursor?.lastId,
      PAGE_SIZE + 1
    );
    HxlSubscriberListResult result = HxlSubscriberResultMapper.toListResult(
      records,
      PAGE_SIZE
    );
    if (result.hasMore) {
      SObject lastShown = records[PAGE_SIZE - 1];
      result.nextCursor = encodeCursor(
        (DateTime) lastShown.get('SystemModstamp'),
        (String) lastShown.get('Id')
      );
    }
    return result;
  }

  private static HxlSubscriberDetailResult readSubscriberDetail(String orgKey) {
    List<SObject> records = HxlPackageToolingGateway.readSubscriberDetail(
      orgKey
    );
    if (records == null || records.isEmpty()) {
      return detailResultWithState(
        'NOT_FOUND',
        'No subscriber found with this organization key.'
      );
    }
    return HxlSubscriberResultMapper.toDetailResult(records[0]);
  }

  private static String unavailableState() {
    Boolean permitted = permissionOverride == null
      ? Type.forName('PackageSubscriber') != null
      : permissionOverride;
    return permitted ? null : 'NO_ACCESS';
  }

  private static String unavailableMessage() {
    return 'PackageSubscriber access is not available in this org.';
  }

  private static HxlSubscriberListResult listResultWithState(
    String state,
    String message
  ) {
    HxlSubscriberListResult result = new HxlSubscriberListResult();
    result.state = state;
    result.message = message;
    return result;
  }

  private static HxlSubscriberDetailResult detailResultWithState(
    String state,
    String message
  ) {
    HxlSubscriberDetailResult result = new HxlSubscriberDetailResult();
    result.state = state;
    result.message = message;
    return result;
  }

  /** Keyset page cursor: the last record's SystemModstamp and Id from the prior page. */
  private class PageCursor {
    DateTime lastModstamp;
    String lastId;
  }

  private class InvalidInputException extends Exception {
  }
}
