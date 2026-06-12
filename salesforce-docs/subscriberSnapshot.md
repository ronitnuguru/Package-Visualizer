# App Analytics Subscriber Snapshots

## Overview

Subscriber Snapshots provide a point-in-time view of your managed package's footprint across subscriber organizations.

Unlike Package Usage Logs, which capture user activity and interactions, Subscriber Snapshots capture the state of subscriber orgs and packaged entities on a specific day. They are intended for understanding package adoption, object growth, deployment trends, and overall customer health. They do not contain user-level activity data.

Subscriber Snapshots are generated daily and can be downloaded through App Analytics.

---

# What is a Subscriber Snapshot?

A Subscriber Snapshot is a small CSV file containing a point-in-time view of:

* Subscriber organization information
* Managed package information
* Packaged custom object record counts
* Subscriber adoption metrics
* Package installation metadata

Subscriber Snapshots are designed to answer questions such as:

* How many customers actively use my package?
* Which customers are growing fastest?
* How many packaged records exist across subscriber orgs?
* Which customers may be at risk of churn?
* How quickly are customers adopting new package versions?

Unlike Package Usage Logs, Subscriber Snapshots do not capture individual user actions.

---

# Snapshot Generation

Subscriber Snapshots are generated once per day.

A snapshot represents the state of a subscriber org at a specific point in time.

When requesting a date range:

```text
StartTime=2026-01-18T00:00:00Z
EndTime=2026-01-21T00:00:00Z
```

App Analytics returns one snapshot for each complete day in the range.

Example:

| Date   |
| ------ |
| Jan 18 |
| Jan 19 |
| Jan 20 |

Three snapshots are returned.

---

# Enabling Subscriber Snapshots

Subscriber Snapshots require:

* A managed package that has passed Security Review
* A License Management App (LMA)
* App Analytics enabled for the package

For 1GP and 2GP packages, App Analytics must be activated before snapshot data becomes available.

---

# Included Data

Subscriber Snapshots typically include:

## Subscriber Organization Data

```text
org_id
org_type
org_edition
org_status
country
created_date
```

These fields help identify customer distribution and org characteristics.

---

## Package Installation Data

```text
package_id
package_version
installation_date
```

Useful for understanding package adoption and upgrade trends.

---

## Custom Entity Data

Subscriber Snapshots provide counts of packaged custom object records.

Example:

```text
Invoice__c = 125,000
Subscription__c = 15,000
Contract__c = 9,200
```

This allows ISVs to measure package utilization over time.

---

## Security Adoption Data

Subscriber Snapshots can include information related to subscriber security posture, such as MFA adoption percentages.

Example:

```text
mfa_enabled_percentage
```

This helps identify customer readiness for security-related features.

---

# What Subscriber Snapshots Do NOT Include

Subscriber Snapshots do not contain:

* User activity
* Apex execution logs
* Lightning page views
* API activity
* CRUD events
* Custom Interaction events
* Individual user identities

For user-level activity, use:

* Package Usage Logs
* Package Usage Summaries
* Custom Interactions

---

# Common Use Cases

## 1. Track Customer Growth

Monitor record counts for packaged objects.

Example:

```text
Date        Invoice__c
----------- ----------
Jan 1       10,000
Feb 1       15,000
Mar 1       22,000
```

This reveals whether customer adoption is increasing.

---

## 2. Identify Churn Risk

Look for customers whose packaged object counts stop growing.

Example:

```text
Customer A

Jan  = 100,000 records
Feb  = 102,000 records
Mar  = 102,100 records
Apr  = 102,050 records
```

Flat growth may indicate declining engagement.

---

## 3. Measure Package Footprint

Determine how much of your package is being used across subscriber orgs.

Questions answered:

* How many packaged records exist?
* Which objects are most heavily used?
* Which features are underutilized?

---

## 4. Track Version Adoption

Analyze package version distribution.

Example:

```text
Version 5.0 = 500 orgs
Version 5.1 = 250 orgs
Version 6.0 = 75 orgs
```

This helps plan deprecation and support timelines.

---

## 5. Customer Success Monitoring

Customer Success teams can identify:

* High-growth customers
* Declining customers
* Upgrade candidates
* Expansion opportunities

---

# Retrieving Subscriber Snapshots

Subscriber Snapshots are downloaded through App Analytics.

Output format:

```text
CSV
```

Example workflow:

```text
App Analytics
    ↓
Subscriber Snapshot Export
    ↓
CSV File
    ↓
CRM Analytics
    ↓
Dashboard
```

Many ISVs automate imports into:

* CRM Analytics
* Tableau
* Snowflake
* Databricks
* BigQuery
* Internal data warehouses

---

# Snapshot Retention Strategy

Because snapshots represent historical state, retaining exports is recommended.

Example:

```text
Daily snapshots
      ↓
Monthly aggregation
      ↓
Trend reporting
```

This enables long-term customer growth analysis.

---

# Comparing App Analytics Data Types

| Capability        | Subscriber Snapshot | Package Usage Summary | Package Usage Logs |
| ----------------- | ------------------- | --------------------- | ------------------ |
| Daily Data        | Yes                 | No                    | Yes                |
| User Activity     | No                  | Aggregated            | Yes                |
| Object Counts     | Yes                 | No                    | No                 |
| Package Adoption  | Yes                 | Partial               | No                 |
| Feature Usage     | No                  | Yes                   | Yes                |
| Trend Analysis    | Yes                 | Yes                   | Yes                |
| User-Level Detail | No                  | No                    | Yes                |

---

# Example Snapshot Record

Example CSV row:

```csv
snapshot_date,org_id,package_version,invoice_count,mfa_percentage
2026-01-01,00DXXXXXXXXXXXX,5.1.0,12450,87
```

Interpretation:

* Snapshot taken January 1
* Customer running package version 5.1.0
* 12,450 packaged Invoice records
* 87% MFA adoption

---

# Building Trend Reports

Subscriber Snapshots are most useful when combined across time.

Example:

```text
Jan 1 → 10,000 records
Feb 1 → 14,000 records
Mar 1 → 18,000 records
Apr 1 → 25,000 records
```

Growth Rate:

```text
((25,000 - 10,000) / 10,000) * 100

= 150% growth
```

This enables:

* Adoption dashboards
* Growth forecasting
* Customer health scoring
* Churn prediction models

---

# Best Practices

## Retain Historical Data

Do not overwrite previous snapshots.

Store:

```text
snapshot_date
org_id
```

as part of the primary key.

---

## Focus on Trends

Individual snapshots are useful.

Multiple snapshots become significantly more valuable because they reveal growth patterns.

---

## Combine with Usage Logs

Subscriber Snapshots answer:

```text
How much is installed?
```

Usage Logs answer:

```text
How is it being used?
```

Using both datasets together provides a complete picture of customer adoption.

---

## Build Health Scores

Example health score inputs:

* Record growth rate
* Package version recency
* MFA adoption
* Feature usage (from Usage Logs)
* Custom Interactions

Combining these signals can help identify:

* Expansion opportunities
* At-risk customers
* Power users

---

# Limitations

Subscriber Snapshots:

* Do not include sandbox activity
* Do not include scratch org activity
* Do not contain user-level actions
* Represent a single point-in-time view
* Require App Analytics activation

Subscriber Snapshots should be viewed as organizational state data rather than activity data.

---

# Sample Analytics Questions

## Adoption

```text
How many customers are using our package?
```

## Growth

```text
Which customers increased object usage by 20% this quarter?
```

## Upgrade Readiness

```text
Which customers are still running versions older than 5.0?
```

## Health Monitoring

```text
Which customers have stopped growing for 90 days?
```

## Capacity Planning

```text
How many packaged records exist across all subscriber orgs?
```

---

# References

* App Analytics Subscriber Snapshots Documentation
* Salesforce Packaging Guide
* Trailhead: AppExchange Partner Intelligence Basics
* App Analytics Data Types Documentation
