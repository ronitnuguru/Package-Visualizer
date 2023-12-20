export default {
  fields: {
    Id: {
      type: "text",
      fieldName: "Id",
      label: "Push Request Id",
      sortable: true,
      iconName: "standard:record"
    },
    PackageVersionId: {
      type: "text",
      fieldName: "PackageVersionId",
      label: "Package Version Id",
      sortable: true,
      iconName: "standard:record"
    },
    ScheduledStartTime: {
      type: "date",
      fieldName: "ScheduledStartTime",
      label: "Scheduled Start Time",
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
    Status: {
      type: "text",
      fieldName: "Status",
      label: "Status",
      sortable: true
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
    DurationSeconds: {
      type: "number",
      fieldName: "DurationSeconds",
      label: "Duration Seconds",
      sortable: false,
      iconName: "custom:custom95"
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