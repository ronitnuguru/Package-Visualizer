export default {
  fields: {
    Id: {
      type: "button",
      fieldName: "Id",
      label: "Create Request Id",
      sortable: true,
      wrapText: true,
      iconName: "standard:record",
      typeAttributes: {
        label: { fieldName: "Id" },
        name: "show_details",
        variant: "base"
      }
    },
    Status: {
      type: "text",
      fieldName: "Status",
      label: "Status",
      sortable: true
    },
    Package2Id: {
      type: "text",
      fieldName: "Package2Id",
      label: "Package Id",
      sortable: true,
      iconName: "standard:record"
    },
    Package2VersionId: {
      type: "text",
      fieldName: "Package2VersionId",
      label: "Package Version Id (05i)",
      sortable: true,
      iconName: "standard:record"
    },
    Branch: {
      type: "text",
      fieldName: "Branch",
      label: "Branch",
      sortable: true
    },
    Tag: {
      type: "text",
      fieldName: "Tag",
      label: "Tag",
      sortable: true
    },
    Language: {
      type: "text",
      fieldName: "Language",
      label: "Language",
      sortable: true
    },
    CalculateCodeCoverage: {
      type: "boolean",
      fieldName: "CalculateCodeCoverage",
      label: "Calculate Code Coverage",
      sortable: true
    },
    SkipValidation: {
      type: "boolean",
      fieldName: "SkipValidation",
      label: "Skip Validation",
      sortable: true
    },
    CalcTransitiveDependencies: {
      type: "boolean",
      fieldName: "CalcTransitiveDependencies",
      label: "Calc Transitive Dependencies",
      sortable: true
    },
    AsyncValidation: {
      type: "boolean",
      fieldName: "AsyncValidation",
      label: "Async Validation",
      sortable: true
    },
    IsConversionRequest: {
      type: "boolean",
      fieldName: "IsConversionRequest",
      label: "Is Conversion Request",
      sortable: true
    },
    IsPasswordProtected: {
      type: "boolean",
      fieldName: "IsPasswordProtected",
      label: "Is Password Protected",
      sortable: true
    },
    IsDevUsePkgZipRequested: {
      type: "boolean",
      fieldName: "IsDevUsePkgZipRequested",
      label: "Is Dev Use Pkg Zip Requested",
      sortable: true
    },
    CreatedByName: {
      type: "text",
      fieldName: "CreatedByName",
      label: "Created By",
      sortable: true,
      iconName: "standard:user"
    },
    CreatedDate: {
      type: "date",
      fieldName: "CreatedDate",
      label: "Created Date",
      iconName: "standard:date_time",
      sortable: true,
      typeAttributes: {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    },
    SystemModstamp: {
      type: "date",
      fieldName: "SystemModstamp",
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
