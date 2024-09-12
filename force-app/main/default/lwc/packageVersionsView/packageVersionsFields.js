export default {
  fields: {
    versionNumber: {
      type: "text",
      fieldName: "versionNumber",
      label: "Version Number",
      sortable: true,
      iconName: "standard:number_input"
    },
    ancestorId: {
      type: "text",
      fieldName: "ancestorId",
      label: "Ancestor Id",
      sortable: true,
      iconName: "standard:record"
    },
    buildNumber: {
      type: "text",
      fieldName: "buildNumber",
      label: "Build Number",
      sortable: true
    },
    hasPassedCodeCoverageCheck: {
      type: "boolean",
      fieldName: "hasPassedCodeCoverageCheck",
      label: "Has Passed Code Coverage Check",
      sortable: true,
      iconName: "standard:code_playground"
    },
    hasMetadataRemoved: {
      type: "boolean",
      fieldName: "hasMetadataRemoved",
      label: "Has Metadata Removed",
      sortable: true,
      iconName: "standard:first_non_empty"
    },
    isPasswordProtected: {
      type: "boolean",
      fieldName: "isPasswordProtected",
      label: "Is Password Protected",
      sortable: true,
      iconName: "standard:password"
    },
    isReleased: {
      type: "boolean",
      fieldName: "isReleased",
      label: "Is Released",
      sortable: true,
      iconName: "standard:task2"
    },
    majorVersion: {
      type: "text",
      fieldName: "majorVersion",
      label: "Major Version",
      sortable: true
    },
    minorVersion: {
      type: "text",
      fieldName: "minorVersion",
      label: "Minor Version",
      sortable: true
    },
    name: {
      type: "text",
      fieldName: "name",
      label: "Name",
      sortable: true,
      iconName: "custom:custom18"
    },
    package2Id: {
      type: "text",
      fieldName: "package2Id",
      label: "Package2 Id",
      sortable: true,
      iconName: "standard:record"
    },
    subscriberPackageVersionId: {
      type: "text",
      fieldName: "subscriberPackageVersionId",
      label: "Subscriber Package Version Id",
      sortable: true,
      iconName: "standard:record"
    },
    validatedAsync: {
      type: "boolean",
      fieldName: "validatedAsync",
      label: "Validated Async",
      sortable: true,
      iconName: "standard:task2"
    },
    validationSkipped: {
      type: "boolean",
      fieldName: "validationSkipped",
      label: "Validation Skipped",
      sortable: true
    },
    buildDurationInSeconds: {
      type: "text",
      fieldName: "buildDurationInSeconds",
      label: "Build Duration In Seconds",
      sortable: true,
      iconName: "custom:custom95"
    },
    releaseVersion: {
      type: "text",
      fieldName: "releaseVersion",
      label: "Release Version",
      sortable: true,
      iconName: "standard:number_input"
    },
    language: {
      type: "text",
      fieldName: "language",
      label: "Language",
      sortable: true,
      iconName: "standard:person_language"
    },
    createdDate: {
      type: "date",
      fieldName: "createdDate",
      label: "Created Date",
      iconName: "standard:date_time",
      sortable: true,
      typeAttributes: {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      },
    },
    owner: {
      type: "text",
      fieldName: "owner",
      label: "Created By",
      sortable: true,
      iconName: "standard:avatar"
    }
  }
};