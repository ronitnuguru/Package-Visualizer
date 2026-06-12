# App Analytics Custom Interactions

## Overview

Custom Interactions allow Salesforce ISV partners to instrument managed package code and log business-specific user interactions that matter most to their application.

Unlike standard App Analytics events (such as Apex executions or Lightning component usage), Custom Interactions let you define your own interaction labels and track custom user journeys, feature adoption, business processes, and application workflows.

Common use cases include:

* Tracking feature adoption
* Understanding user journeys
* Measuring button clicks and UI interactions
* Tracking business process execution
* Monitoring Apex workflows across synchronous and asynchronous transactions
* Identifying unused features for future deprecation
* Generating analytics data for product management and customer success teams

---

## Prerequisites

Custom Interactions are available only for:

* Managed packages that have passed Security Review
* ISV partners with App Analytics enabled
* First-generation (1GP) or Second-generation (2GP) managed packages with App Analytics activated

Before using Custom Interactions, ensure App Analytics has been enabled for your package.

---

# Architecture

Custom Interactions use three primary components:

1. Apex Enum Labels
2. App Analytics Logging API
3. App Analytics Usage Logs

```text
User Action
    ↓
Managed Package Apex
    ↓
logCustomInteraction()
    ↓
App Analytics
    ↓
Package Usage Logs
    ↓
Reporting / CRM Analytics / External Analytics
```

---

# Step 1: Create Interaction Labels

Custom Interactions require labels defined as Apex Enum values.

The enum must:

* Exist within your managed package
* Be packaged metadata
* Use compile-time values
* Not be dynamically generated

Example:

```apex
public enum MyCustomInteractions {
    CREATE_INVOICE,
    POST_TO_AWS,
    INCREASE_QUANTITY,
    DECREASE_QUANTITY,
    COMPLETE_CHECKOUT
}
```

These enum values become the analytics labels that appear in App Analytics reports.

---

# Step 2: Log a Custom Interaction

Use the App Analytics Apex API:

```apex
IsvPartners.AppAnalytics.logCustomInteraction(
    MyCustomInteractions.CREATE_INVOICE
);
```

When this code executes, App Analytics records a custom interaction event.

---

# API Signatures

## Basic Signature

```apex
IsvPartners.AppAnalytics.logCustomInteraction(
    MyCustomInteractions.CREATE_INVOICE
);
```

Tracks a single interaction label.

---

## Signature with Record Identifier

```apex
Id invoiceId = invoice.Id;

IsvPartners.AppAnalytics.logCustomInteraction(
    MyCustomInteractions.CREATE_INVOICE,
    invoiceId
);
```

Allows related interactions to be grouped together.

The identifier is hashed and tokenized before storage. Customer data is never exposed in App Analytics.

---

## Signature with UUID

```apex
String correlationId =
    '4c44f8ab-58f8-48dc-a28b-6f63f05fa2b';

IsvPartners.AppAnalytics.logCustomInteraction(
    MyCustomInteractions.COMPLETE_CHECKOUT,
    correlationId
);
```

Useful for:

* Transaction correlation
* Multi-step workflows
* Async processing chains
* Distributed processes

The UUID is hashed and tokenized before storage.

---

# Example: Track Button Clicks

Controller:

```apex
public with sharing class InvoiceController {

    @AuraEnabled
    public static void increaseQuantity(Id invoiceId) {

        IsvPartners.AppAnalytics.logCustomInteraction(
            MyCustomInteractions.INCREASE_QUANTITY,
            invoiceId
        );

        // Business logic
    }
}
```

This allows product teams to determine how often users increase quantities within the application.

---

# Example: Track Feature Usage

```apex
public with sharing class InvoiceService {

    public static void createInvoice() {

        IsvPartners.AppAnalytics.logCustomInteraction(
            MyCustomInteractions.CREATE_INVOICE
        );

        // Invoice creation logic
    }
}
```

This provides adoption metrics for major package features.

---

# Example: Track User Journeys

```apex
String journeyId =
    Crypto.getRandomUUID();

IsvPartners.AppAnalytics.logCustomInteraction(
    MyCustomInteractions.CREATE_INVOICE,
    journeyId
);

IsvPartners.AppAnalytics.logCustomInteraction(
    MyCustomInteractions.POST_TO_AWS,
    journeyId
);

IsvPartners.AppAnalytics.logCustomInteraction(
    MyCustomInteractions.COMPLETE_CHECKOUT,
    journeyId
);
```

All events can later be correlated using the hashed journey identifier.

---

# Limits

## Maximum Interactions Per Request

A maximum of 50 Custom Interactions can be logged during a single user request.

```apex
for(Account a : accounts) {

    // Avoid this pattern
    IsvPartners.AppAnalytics.logCustomInteraction(
        MyCustomInteractions.CREATE_INVOICE
    );
}
```

Avoid calling `logCustomInteraction()` inside loops. Interactions beyond the limit are ignored and do not generate customer-facing errors.

---

# Debugging

Package usage logs are not available in Developer Edition orgs.

To support development and testing, App Analytics emits debug log events.

Set Apex log level to:

```text
FINE
```

Look for log entries such as:

```text
APP_ANALYTICS_FINE
APP_ANALYTICS_WARN
APP_ANALYTICS_ERROR
```

These events confirm whether Custom Interactions were successfully processed.

---

# Deployment Process

1. Add enum definitions
2. Instrument Apex code
3. Create a new package version
4. Upload package version
5. Deploy to customers
6. Monitor App Analytics usage data

Once subscribers begin using the new package version, Custom Interaction events start appearing in App Analytics logs.

---

# App Analytics Log Format

Custom Interactions appear in Package Usage Logs with:

| Field                | Value                  |
| -------------------- | ---------------------- |
| log_record_type      | CustomInteraction      |
| custom_entity_type   | CustomInteractionLabel |
| custom_entity        | Enum Value             |
| interaction_id_token | Hashed identifier      |

Example:

```json
{
  "log_record_type": "CustomInteraction",
  "custom_entity_type": "CustomInteractionLabel",
  "custom_entity": "MyCustomInteractions.CREATE_INVOICE",
  "interaction_id_token": "a1b2c3..."
}
```

Additional metadata can also be available:

```text
class_name
method_name
line_number
```

This information helps determine exactly where the interaction originated.

---

# Querying Custom Interactions

Filter Package Usage Logs using:

```text
log_record_type = CustomInteraction
```

and

```text
custom_entity_type = CustomInteractionLabel
```

Example query logic:

```text
Show all CREATE_INVOICE events
for the last 30 days
```

using:

```text
custom_entity =
MyCustomInteractions.CREATE_INVOICE
```

---

# Error Handling

Custom Interaction failures appear with:

```text
custom_entity_type = CustomInteractionFailure
```

Example failure:

```text
OVER_CALL_LIMIT
```

This occurs when more than 50 interactions are logged during a single request.

Monitor failure events to identify instrumentation issues.

---

# Monthly Summary Data

Custom Interactions are also aggregated into monthly App Analytics summary datasets.

You can report on:

* Feature adoption
* Usage trends
* Customer engagement
* Process completion rates
* Failure counts

Monthly summary records include:

```text
CustomInteractionLabel
CustomInteractionFailure
```

aggregation types.

---

# Best Practices

## Use Business-Level Labels

Good:

```apex
CREATE_INVOICE
COMPLETE_CHECKOUT
EXPORT_REPORT
```

Avoid:

```apex
CLICKED_BUTTON_1
CLICKED_BUTTON_2
```

---

## Track Important Milestones

Log interactions when:

* A feature is used
* A workflow completes
* A business process starts
* A user reaches a key milestone

---

## Correlate Multi-Step Processes

Use IDs or UUIDs to associate:

* Workflow steps
* Async jobs
* Transaction chains
* User journeys

---

## Avoid High-Volume Logging

Do not log:

* Every loop iteration
* Every record processed
* Excessively granular events

Focus on meaningful business outcomes.

---

# Example Interaction Taxonomy

```apex
public enum MyCustomInteractions {

    // User onboarding
    START_ONBOARDING,
    COMPLETE_ONBOARDING,

    // Billing
    CREATE_INVOICE,
    SEND_INVOICE,
    PAY_INVOICE,

    // Reporting
    GENERATE_REPORT,
    EXPORT_REPORT,

    // Integrations
    POST_TO_AWS,
    SYNC_TO_ERP,

    // UI actions
    CLICK_UPGRADE_BUTTON,
    OPEN_SETTINGS_PAGE
}
```

A well-designed taxonomy makes App Analytics significantly more useful for product management and customer success teams.

---

# References

* App Analytics Custom Interactions Documentation
* App Analytics Release Notes
* Salesforce Developers Blog: Get Better User Insights with Custom Interactions for AppExchange App Analytics
