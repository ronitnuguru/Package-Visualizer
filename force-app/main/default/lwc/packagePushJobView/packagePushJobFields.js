export default {
  fields: {
    Id: {
      type: "text",
      fieldName: "Id",
      label: "Push Job Id",
      sortable: true,
      iconName: "standard:record"
    },
    PackagePushRequestId: {
      type: "text",
      fieldName: "PackagePushRequestId",
      label: "Package Push Request Id",
      sortable: true,
      iconName: "standard:record"
    },
    SubscriberOrganizationKey: {
      type: "text",
      fieldName: "SubscriberOrganizationKey",
      label: "Subscriber Org",
      sortable: true,
      iconName: "standard:employee_organization"
    },
    StartTime: {
      type: "date",
      fieldName: "StartTime",
      label: "Start Time",
      iconName: "standard:date_time",
      sortable: false,
      typeAttributes: {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    },
    EndTime: {
      type: "date",
      fieldName: "EndTime",
      label: "End Time",
      iconName: "standard:date_time",
      sortable: false,
      typeAttributes: {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }
    },
    Status: {
      type: "text",
      fieldName: "Status",
      label: "Status",
      sortable: true
    },
    DurationSeconds: {
      type: "number",
      fieldName: "DurationSeconds",
      label: "Duration Seconds",
      sortable: false,
      iconName: "standard:number_input"
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