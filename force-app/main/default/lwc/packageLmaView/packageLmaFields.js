export default {
  fields: {
    id: {
      type: "url",
      fieldName: "id",
      label: "License Name",
      typeAttributes: {
        label: {
          fieldName: "name",
          target: "_blank"
        }
      },
      sortable: true,
      iconName: "custom:custom45"
    },
    leadName: {
      type: "url",
      fieldName: "leadId",
      label: "Lead",
      typeAttributes: {
        label: {
          fieldName: "leadName",
          target: "_blank"
        }
      },
      sortable: false,
      iconName: "standard:lead"
    },
    leadSource: {
      type: "text",
      fieldName: "leadSource",
      label: "Lead Source",
      sortable: false
    },
    accountName: {
      type: "url",
      fieldName: "accountId",
      label: "Account",
      typeAttributes: {
        label: {
          fieldName: "accountName",
          target: "_blank"
        }
      },
      sortable: false,
      iconName: "standard:account"
    },
    contactName: {
      type: "url",
      fieldName: "contactId",
      label: "Contact",
      typeAttributes: {
        label: {
          fieldName: "contactName",
          target: "_blank"
        }
      },
      sortable: false,
      iconName: "standard:contact"
    },
    installDate: {
      type: "date",
      fieldName: "installDate",
      label: "Install Date",
      iconName: "standard:date_input",
      sortable: false,
      typeAttributes: {
        year: "numeric",
        month: "long",
        day: "2-digit"
      }
    },
    lastModifiedDate: {
      type: "date",
      fieldName: "lastModifiedDate",
      label: "Last Modified Date",
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
    licenseStatus: {
      type: "text",
      fieldName: "licenseStatus",
      label: "License Status",
      sortable: false
    },
    licenseType: {
      type: "text",
      fieldName: "licenseType",
      label: "License Type",
      sortable: false
    },
    licensedSeats: {
      type: "text",
      fieldName: "licensedSeats",
      label: "Licensed Seats",
      sortable: false
    }
  }
};