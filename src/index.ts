import "dotenv/config";
import OpenAI from "openai";

import {
  Runner,
  setDefaultOpenAIClient,
  setOpenAIAPI,
} from "@openai/agents";

import { requirementAgent } from "./agents/requirementAgent";

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

setDefaultOpenAIClient(openrouter);
setOpenAIAPI("chat_completions");

const runner = new Runner();

async function main() {

  const clientRequirement = `
Project Name: SmartCRM 360

We want to develop a CRM Management System for our sales,
marketing and customer support teams.

Currently our sales team manages leads using Excel,
WhatsApp, email and phone calls.

Because of this, leads are sometimes missed,
follow-ups are delayed and duplicate customer records are created.

The CRM should provide one centralized system for managing
leads, customers, follow-ups, meetings, opportunities,
quotations, support tickets and reports.

The system will be used by:

Admin
Sales Manager
Sales Executive
Marketing Executive
Customer Support Executive
Management
Customer

Admin should be able to create users.

Admin should be able to edit users.

Admin should be able to activate and deactivate users.

A deactivated user should not be able to login.

Historical records created by a deactivated user should
remain available.

Users should login using email and password.

Email should have a valid format.

We need forgot password functionality.

Password should follow security requirements,
but the exact password policy has not been finalized.

We may lock accounts after multiple incorrect login attempts,
but the allowed number of attempts has not been finalized.

The system should automatically expire inactive sessions,
but the timeout duration has not been finalized.

We need Lead Management.

Sales Executives should be able to manually create leads.

Leads may also automatically come from our website.

Lead information should contain:

Lead ID
First Name
Last Name
Mobile Number
Email Address
Company Name
Lead Source
Interested Product
Lead Status
Assigned Sales Executive
Expected Budget
Expected Purchase Date
Notes

Lead ID must be unique.

Email address must have a valid email format.

Mobile number must contain a valid phone number.

Expected Budget cannot be negative.

Expected Purchase Date should not normally be in the past.

We do not want duplicate leads.

However, we have not finalized whether duplicates should
be detected using mobile number, email address or both.

Sales Managers should be able to assign leads
to Sales Executives.

Sales Managers should also be able to reassign leads.

The previous assignment history should remain available.

The assigned salesperson should receive a notification.

We have not finalized whether one lead can be assigned
to multiple Sales Executives.

Possible lead statuses are:

New
Assigned
Contacted
Interested
Follow-Up
Qualified
Not Interested
Converted
Lost

Sales Executives should be able to update lead status.

Important status changes should be maintained in an audit log.

When a lead becomes qualified,
the Sales Executive should be able to convert it into a customer.

A converted lead should normally not be converted again.

Previous lead activity should remain available after conversion.

We have not decided whether an opportunity should automatically
be created when converting a lead.

We need Customer Management.

Customer information should contain:

Customer ID
Customer Name
Company
Mobile Number
Email
Address
Account Manager
Notes

Customer ID must be unique.

Users should be able to search customers using
Customer ID, name, email, mobile number or company.

We need Follow-up Management.

Sales Executives should be able to schedule follow-ups.

A follow-up should contain:

Follow-up Date
Follow-up Time
Type
Description
Assigned User
Status
Reminder

A follow-up should not normally be created for a past date.

If the follow-up is not completed by its scheduled time,
it should become overdue.

The system should send follow-up reminders.

We have not finalized whether reminders should occur
10 minutes, 30 minutes or 1 hour before the follow-up.

We need Meeting Management.

Users should be able to schedule meetings.

Meeting details should contain:

Title
Date
Start Time
End Time
Online or Offline
Location
Meeting Link
Attendees
Description
Status

End Time must be greater than Start Time.

Online meetings should require a meeting link.

Offline meetings should require a location.

The system should detect overlapping meetings.

We have not decided whether overlapping meetings
should be blocked or only generate a warning.

We need Opportunity Management.

Opportunity information should contain:

Opportunity ID
Opportunity Name
Customer
Product
Expected Amount
Expected Closing Date
Sales Stage
Probability
Assigned Salesperson
Notes

Opportunity ID must be unique.

Expected Amount cannot be negative.

Probability must be between 0 and 100.

Possible opportunity stages are:

Qualification
Requirement Analysis
Proposal
Negotiation
Closed Won
Closed Lost

Closed Won opportunities should be counted as successful sales.

When an opportunity is Closed Lost,
the salesperson should provide a lost reason.

We have not finalized whether Lost Reason is mandatory.

We have not finalized whether Probability should
be entered manually or automatically calculated.

We need Quotation Management.

Sales Executives should be able to create quotations.

Quotation information should contain:

Quotation Number
Customer
Opportunity
Product
Quantity
Unit Price
Discount
Tax
Subtotal
Total Amount
Valid Until Date
Status

Quotation Number must be unique.

Quantity must be greater than zero.

Unit Price cannot be negative.

Discount must not result in a negative quotation total.

The exact tax calculation rules have not been finalized.

Quotations should be downloadable as PDF.

When a quotation is sent,
the customer should receive an email.

We may provide a customer portal where customers can
accept or reject quotations,
but this is not confirmed for Phase 1.

We need Support Ticket Management.

Support Executives should be able to create customer tickets.

Ticket information should contain:

Ticket Number
Customer
Subject
Description
Category
Priority
Assigned Support Executive
Status
Created Date
Resolution Notes

Ticket Number must be unique.

Possible priorities are:

Low
Medium
High
Critical

Possible statuses are:

Open
Assigned
In Progress
Waiting for Customer
Resolved
Closed

A ticket should normally not be closed
without Resolution Notes.

Critical tickets should generate notifications.

We need role-based access control.

Admin should have full access.

Sales Managers should access their team's information.

Sales Executives should normally access only records
assigned to them.

Support Executives should access customer information
needed for resolving tickets.

Support Executives should not normally modify
sales opportunities.

The complete permission matrix is not finalized.

A Sales Executive manually entering an Admin URL
must receive Access Denied.

We need dashboards displaying:

Total Leads
Qualified Leads
Converted Leads
Lost Leads
Conversion Rate
Total Customers
Total Opportunities
Won Opportunities
Lost Opportunities
Expected Revenue
Actual Revenue
Upcoming Follow-ups
Overdue Follow-ups
Open Tickets
Critical Tickets

Reports should support date filters.

Reports should be exportable to Excel.

Some reports should also be exportable to PDF.

We have not finalized which roles can export
confidential customer information.

Users should be able to upload attachments.

Supported formats may include:

PDF
DOC
DOCX
XLS
XLSX
PNG
JPG
JPEG

Executable files should not be accepted.

The maximum attachment size has not been finalized.

Important activities should be stored in an audit log.

Audit logs should contain:

User
Action
Date and Time
Previous Value
New Value
Record Reference

Normal users should not be able to edit audit records.

The CRM should integrate with our website.

When somebody submits the website enquiry form,
a lead should automatically be created in CRM.

The Lead Source should automatically be Website.

Integration failures should be logged.

The website API documentation has not yet been provided.

The CRM should integrate with an email service
for quotations, notifications and password reset.

The email service provider has not been finalized.

Possible future integrations include:

WhatsApp Business API
SMS Gateway
Google Calendar
Microsoft Outlook
Zoom
Microsoft Teams
Payment Gateway
Accounting Software

These are not confirmed for Phase 1.

The application should work on:

Chrome
Edge
Firefox
Safari

The application should be responsive on desktop,
laptop, tablet and mobile browsers.

Normal pages should load within approximately 3 seconds.

Search results should return within approximately 2 seconds.

The system should initially support at least
500 concurrent users.

The system must use HTTPS.

Passwords must not be stored as plain text.

Sensitive customer information must only be available
to authorized users.

The application should show understandable validation
messages instead of database errors or server exceptions.

Forms should not submit when mandatory fields are missing.

Double-clicking the Save button should not create duplicate records.

If the network fails while saving,
the system should show an appropriate error message.

Retrying should not create duplicate records.

Production data should be backed up regularly.

Backup frequency has not been finalized.

Backup retention duration has not been finalized.

Development, UAT and Production should be
separate environments.

Major functionality should be tested in UAT
before Production deployment.

Initially most users will be located in India,
but international users may use the CRM in the future.

Timezone handling should therefore be supported,
but the exact timezone strategy is not finalized.
`;

  const result = await runner.run(
    requirementAgent,
    clientRequirement
  );

  console.log("Raw BA Agent Output:\n");

  console.log(result.finalOutput);
}

main().catch(console.error);