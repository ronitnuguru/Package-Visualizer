/**
 * Validates and normalizes user-supplied SOQL input tokens for dynamic queries.
 * This utility is package-internal and side-effect free.
 */
public with sharing class SoqlInputValidator {
  /**
   * Prevents instantiation of this utility class.
   */
  private SoqlInputValidator() {
  }

  /**
   * Returns a canonical allowlisted identifier for case-insensitive input.
   *
   * @param input Raw identifier from caller input.
   * @param allowlist Lowercased-key map of allowed identifiers to canonical values.
   * @param errorMessage Stable error message for invalid input.
   * @return Canonical allowlisted identifier.
   */
  public static String normalizeAllowlistedIdentifier(
    String input,
    Map<String, String> allowlist,
    String errorMessage
  ) {
    if (String.isBlank(input) || allowlist == null || allowlist.isEmpty()) {
      throw validationException(errorMessage);
    }
    String normalizedInput = input.trim().toLowerCase();
    if (!allowlist.containsKey(normalizedInput)) {
      throw validationException(errorMessage);
    }
    return allowlist.get(normalizedInput);
  }

  /**
   * Normalizes a sort direction token to ASC or DESC.
   *
   * @param sortDirection Raw sort direction value.
   * @param errorMessage Stable error message for invalid input.
   * @return ASC or DESC.
   */
  public static String normalizeSortDirection(
    String sortDirection,
    String errorMessage
  ) {
    if (String.isBlank(sortDirection)) {
      throw validationException(errorMessage);
    }
    String normalizedDirection = sortDirection.trim().toUpperCase();
    if (normalizedDirection != 'ASC' && normalizedDirection != 'DESC') {
      throw validationException(errorMessage);
    }
    return normalizedDirection;
  }

  /**
   * Parses an integer token and enforces inclusive bounds.
   *
   * @param value Raw integer token.
   * @param minimum Inclusive minimum.
   * @param maximum Inclusive maximum.
   * @param errorMessage Stable error message for invalid input.
   * @return Parsed integer.
   */
  public static Integer parseIntegerInRange(
    String value,
    Integer minimum,
    Integer maximum,
    String errorMessage
  ) {
    if (String.isBlank(value)) {
      throw validationException(errorMessage);
    }
    String normalizedValue = value.trim();
    if (!Pattern.matches('^[0-9]+$', normalizedValue)) {
      throw validationException(errorMessage);
    }
    Integer parsedValue;
    try {
      parsedValue = Integer.valueOf(normalizedValue);
    } catch (Exception e) {
      throw validationException(errorMessage);
    }
    if (parsedValue < minimum || parsedValue > maximum) {
      throw validationException(errorMessage);
    }
    return parsedValue;
  }

  /**
   * Parses a strict nonnegative integer token.
   *
   * @param value Raw integer token.
   * @param errorMessage Stable error message for invalid input.
   * @return Parsed integer greater than or equal to zero.
   */
  public static Integer parseNonNegativeInteger(
    String value,
    String errorMessage
  ) {
    return parseIntegerInRange(value, 0, 2147483647, errorMessage);
  }

  /**
   * Parses and canonicalizes a boolean literal.
   *
   * @param value Raw boolean token.
   * @param errorMessage Stable error message for invalid input.
   * @return Canonical lowercase true or false.
   */
  public static String normalizeBooleanLiteral(
    String value,
    String errorMessage
  ) {
    if (String.isBlank(value)) {
      throw validationException(errorMessage);
    }
    String normalizedValue = value.trim().toLowerCase();
    if (normalizedValue != 'true' && normalizedValue != 'false') {
      throw validationException(errorMessage);
    }
    return normalizedValue;
  }

  /**
   * Validates and returns a strict decimal literal token.
   *
   * @param value Raw decimal token.
   * @param errorMessage Stable error message for invalid input.
   * @return Trimmed decimal literal.
   */
  public static String normalizeStrictDecimalLiteral(
    String value,
    String errorMessage
  ) {
    if (String.isBlank(value)) {
      throw validationException(errorMessage);
    }
    String normalizedValue = value.trim();
    if (
      !Pattern.matches('^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$', normalizedValue)
    ) {
      throw validationException(errorMessage);
    }
    return normalizedValue;
  }

  /**
   * Escapes a value for use inside a LIKE '%...%' literal.
   *
   * @param value Raw string value.
   * @return Escaped value with literal % and _ handling.
   */
  public static String escapeLikeSearchValue(String value) {
    String escapedValue = String.escapeSingleQuotes(value);
    return escapedValue.replace('%', '\\%').replace('_', '\\_');
  }

  private static AuraHandledException validationException(String message) {
    AuraHandledException error = new AuraHandledException(message);
    error.setMessage(message);
    return error;
  }
}
