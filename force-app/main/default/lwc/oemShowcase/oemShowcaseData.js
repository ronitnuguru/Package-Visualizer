export const NPI_ITEMS = [
  {
    name: "backup_restore",
    label: "Backup & Restore",
    navIcon: "utility:archive",
    headerIcon: "custom:custom13",
    tagline: "Data Protection",
    description:
      "Automated backup and point-in-time restore for your Salesforce data and metadata, safeguarding against accidental loss and enabling rapid recovery.",
    // No dedicated preset — the embedded builder shows a generic scratch org definition file.
    templateKey: "",
    marketingUrl: "https://www.salesforce.com/platform/data-backup-recovery/",
    developerCenterUrl: ""
  },
  {
    name: "health_cloud",
    label: "Health Cloud",
    navIcon: "utility:heart",
    headerIcon: "standard:patient_service",
    tagline: "Healthcare & Life Sciences",
    description:
      "Connected patient and member experiences with a unified view of care, purpose-built for healthcare and life sciences organizations.",
    // Maps to the "hls" preset in c/scratchOrgConfig TEMPLATES.
    templateKey: "hls",
    marketingUrl: "https://www.salesforce.com/healthcare/cloud/",
    developerCenterUrl:
      "https://developer.salesforce.com/developer-centers/health-cloud"
  },
  {
    name: "service_cloud",
    label: "Service Cloud",
    navIcon: "utility:it_service_management",
    headerIcon: "standard:it_service_management",
    tagline: "Customer Service",
    description:
      "Case management, omni-channel routing, and service automation that empower agents to resolve customer issues faster.",
    templateKey: "",
    marketingUrl: "https://www.salesforce.com/service/cloud/",
    developerCenterUrl:
      "https://developer.salesforce.com/developer-centers/service-cloud"
  },
  {
    name: "it_service",
    label: "IT Service",
    navIcon: "utility:workforce_engagement",
    headerIcon: "standard:workforce_engagement",
    tagline: "IT Service Management",
    description:
      "Incident, request, and change management workflows that keep IT operations running smoothly across the enterprise.",
    templateKey: "",
    marketingUrl: "https://www.salesforce.com/service/it-service-management/",
    developerCenterUrl: ""
  },
  {
    name: "financial_services_cloud",
    label: "Financial Services Cloud",
    navIcon: "utility:data_governance",
    headerIcon: "standard:data_governance",
    tagline: "Banking & Wealth Management",
    description:
      "Relationship-centric tools for banking, wealth management, and insurance, unifying client data and financial accounts for advisors and bankers.",
    // Maps to the "fsc" preset in c/scratchOrgConfig TEMPLATES.
    templateKey: "fsc",
    marketingUrl: "https://www.salesforce.com/financial-services/cloud/",
    developerCenterUrl:
      "https://developer.salesforce.com/developer-centers/financial-services-cloud"
  }
];
