export default {
  fields: {
    instanceName: {
      type: "text",
      fieldName: "instanceName",
      label: "Instance Name",
      sortable: true,
      iconName: "standard:default"
    },
    metadataPackageId: {
      type: "text",
      fieldName: "metadataPackageId",
      label: "Metadata Package Id",
      sortable: true,
      iconName: "standard:record"
    },
    metadataPackageVersionId: {
      type: "text",
      fieldName: "metadataPackageVersionId",
      label: "Package Version Id",
      sortable: true,
      iconName: "standard:record"
    },
    orgKey: {
      type: "text ",
      fieldName: "orgKey",
      label: "Organization Id",
      sortable: true
    },
    orgName: {
        type: "text ",
        fieldName: "orgName",
        label: "Organization Name",
        sortable: true,
        iconName: "standard:employee_organization",
        wrapText: true,
      },
    orgStatus: {
      type: "text",
      fieldName: "orgStatus",
      label: "Status",
      sortable: true
    },
    orgType: {
      type: "text",
      fieldName: "orgType",
      label: "Type",
      sortable: true
    }
  }
};