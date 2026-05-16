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
      sortable: true,
      iconName: "standard:record"
    },
    orgName: {
      type: "button",
      fieldName: "orgName",
      label: "Organization Name",
      sortable: true,
      iconName: "standard:customer",
      wrapText: true,
      typeAttributes: {
        label: { fieldName: "orgName" },
        name: "show_details",
        variant: "base"
      }
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
    },
    parentOrg: {
      type: "text ",
      fieldName: "parentOrg",
      label: "Parent Org",
      sortable: true,
      iconName: "standard:record"
    },
    customUpgradeType: {
      type: "text",
      fieldName: "customUpgradeType",
      label: "Custom Upgrade Type",
      sortable: true,
      iconName: "standard:activation_target"
    },
    hasRestrictionEnabled: {
      type: "boolean",
      fieldName: "hasRestrictionEnabled",
      label: "Restriction Enabled",
      iconName: "standard:task2",
      sortable: true
    },
    isCustomUpgradeAllowed: {
      type: "boolean",
      fieldName: "isCustomUpgradeAllowed",
      label: "Custom Upgrade Allowed",
      iconName: "standard:task2",
      sortable: true
    },
    SystemModstamp: {
      type: "date",
      fieldName: "SystemModstamp",
      label: "Last Modified At",
      iconName: "standard:date_time",
      sortable: true,
      wrapText: true,
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
