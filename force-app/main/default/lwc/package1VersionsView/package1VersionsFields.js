export default {
  fields: {
    versionNumber: {
      type: "text",
      fieldName: "versionNumber",
      label: "Version Number",
      sortable: true,
      iconName: "standard:number_input"
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
    buildNumber: {
      type: "text",
      fieldName: "buildNumber",
      label: "Build Number",
      sortable: true
    },
    name: {
      type: "text",
      fieldName: "name",
      label: "Name",
      sortable: true,
      iconName: "custom:custom18"
    },
    releaseState: {
      type: "text",
      fieldName: "releaseState",
      label: "Release State",
      sortable: true,
      iconName: "standard:task2"
    },
    metadataPackageId: {
      type: "text",
      fieldName: "metadataPackageId",
      label: "Metadata Package Id",
      sortable: true,
      iconName: "standard:record"
    },
    id: {
      type: "text",
      fieldName: "id",
      label: "Version Id",
      sortable: true,
      iconName: "standard:record"
    },
    systemModstamp: {
      type: "date",
      fieldName: "systemModstamp",
      label: "Last Modified At",
      iconName: "standard:date_time",
      sortable: true,
      typeAttributes: {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    }
  }
};