import "dotenv/config";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { join } from "path";

import {
  Runner,
  setDefaultOpenAIClient,
  setOpenAIAPI,
} from "@openai/agents";

import { requirementAgent } from "./agents/requirementAgent";
import { requirementSchema } from "./schemas/requirementSchema";


// ==========================================
// 1. OPENROUTER CONFIGURATION
// ==========================================

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

setDefaultOpenAIClient(openrouter);

setOpenAIAPI("chat_completions");


// ==========================================
// 2. CREATE AGENT RUNNER
// ==========================================

const runner = new Runner();


// ==========================================
// 3. SAMPLE CLIENT REQUIREMENT
// ==========================================

const clientRequirement = `
I want to build a hospital management application.

Patient should be able to register and login.

Patient can search doctors and book appointments.

Doctor should receive appointment requests and should be able
to accept or reject them.

After consultation, doctor should create EMR for the patient.

Doctor can add diagnosis, medicines and services inside EMR.

If patient has insurance, a claim should be generated
and sent to insurance company.

Insurance company can approve or reject the claim.
`;


// ==========================================
// 4. RUN BUSINESS ANALYST AGENT
// ==========================================

async function main() {

  try {

    console.log("Starting Business Analyst Agent...\n");


    // Run BA Agent
    const result = await runner.run(
      requirementAgent,
      clientRequirement
    );


    // ======================================
    // 5. GET RAW OUTPUT
    // ======================================

    console.log("Raw BA Agent Output:\n");

    console.log(result.finalOutput);

    const rawOutput = String(result.finalOutput);
    const reportPath = "report.html";
    const reportJsonPath = join("ui", "public", "report.json");


    // ======================================
    // 6. CONVERT AI RESPONSE TO JSON
    // ======================================

    try {

      const parsedOutput = JSON.parse(rawOutput);


      // ====================================
      // 7. VALIDATE JSON USING ZOD
      // ====================================

      const validatedOutput =
        requirementSchema.parse(parsedOutput);


      console.log("\nValidated BA Output:\n");

      console.dir(validatedOutput, {
        depth: null
      });

      const html = buildHtmlReport(validatedOutput, rawOutput);
      await writeFile(reportPath, html, "utf8");
      await writeFile(reportJsonPath, JSON.stringify(validatedOutput, null, 2), "utf8");

      console.log(`\nHTML report written to ${reportPath}`);
      console.log(`JSON report written to ${reportJsonPath}`);

    } catch (error) {

      console.error(
        "\nJSON / Schema Validation Error:"
      );

      console.dir(error, {
        depth: null
      });

      const html = buildErrorHtmlReport(rawOutput, error);
      await writeFile(reportPath, html, "utf8");

      console.log(`\nHTML report written to ${reportPath} (with validation error)`);

    }


  } catch (error) {

    console.error("\nBA Agent Error:");

    console.dir(error, {
      depth: null
    });

  }

}


// ==========================================
// 8. START PROGRAM
// ==========================================

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function asList(items: string[]) {
  if (!items?.length) {
    return `<div class="empty">None</div>`;
  }
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function buildFunctionalRequirementsTable(items: Array<Record<string, string>>) {
  if (!items?.length) {
    return `<div class="empty">None</div>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Module</th>
          <th>Actor</th>
          <th>Requirement</th>
          <th>Acceptance Criteria</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(req => `
          <tr>
            <td>${escapeHtml(req.id)}</td>
            <td>${escapeHtml(req.module)}</td>
            <td>${escapeHtml(req.actor)}</td>
            <td>${escapeHtml(req.requirement)}</td>
            <td>${escapeHtml(req.acceptanceCriteria)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function buildHtmlReport(output: any, rawOutput: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BA Agent Report</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f3f4f6;
      color: #111827;
    }
    body {
      margin: 0;
      padding: 32px;
      background: #f3f4f6;
    }
    .container {
      max-width: 1120px;
      margin: 0 auto;
    }
    .hero {
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 2.5vw, 2.75rem);
      letter-spacing: -0.03em;
    }
    .subtitle {
      margin-top: 12px;
      color: #4b5563;
      font-size: 1rem;
      line-height: 1.6;
    }
    .card {
      background: #ffffff;
      border-radius: 28px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
      padding: 28px;
      margin-bottom: 24px;
    }
    .section-title {
      margin: 0 0 16px;
      font-size: 1.1rem;
      font-weight: 700;
      color: #111827;
    }
    .grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }
    .meta-item {
      padding: 16px;
      background: #f9fafb;
      border-radius: 20px;
      border: 1px solid #e5e7eb;
    }
    .meta-item strong {
      display: block;
      margin-bottom: 8px;
      color: #0f172a;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      line-height: 1.8;
    }
    li {
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th, td {
      text-align: left;
      padding: 14px 12px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      font-weight: 700;
      color: #111827;
    }
    pre {
      margin: 0;
      background: #111827;
      color: #f8fafc;
      padding: 18px;
      border-radius: 18px;
      overflow-x: auto;
      line-height: 1.6;
    }
    .empty {
      color: #6b7280;
      font-style: italic;
      padding: 8px 0;
    }
    .footer {
      margin-top: 16px;
      color: #6b7280;
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <section class="hero">
      <h1>Business Analyst Report</h1>
      <p class="subtitle">Generated from the AI agent output. Open this file in a browser to view the formatted result.</p>
    </section>

    <section class="card">
      <h2 class="section-title">Project Summary</h2>
      <div class="grid">
        <div class="meta-item"><strong>Project Name</strong>${escapeHtml(output.projectName)}</div>
        <div class="meta-item"><strong>Objective</strong>${escapeHtml(output.projectObjective)}</div>
        <div class="meta-item"><strong>Actors</strong>${asList(output.actors)}</div>
        <div class="meta-item"><strong>Modules</strong>${asList(output.modules)}</div>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Functional Requirements</h2>
      ${buildFunctionalRequirementsTable(output.functionalRequirements)}
    </section>

    <section class="card">
      <div class="grid">
        <div>
          <h2 class="section-title">Non-functional Requirements</h2>
          ${asList(output.nonFunctionalRequirements)}
        </div>
        <div>
          <h2 class="section-title">Business Rules</h2>
          ${asList(output.businessRules)}
        </div>
      </div>
    </section>

    <section class="card">
      <div class="grid">
        <div>
          <h2 class="section-title">Validations</h2>
          ${asList(output.validations)}
        </div>
        <div>
          <h2 class="section-title">Assumptions</h2>
          ${asList(output.assumptions)}
        </div>
      </div>
    </section>

    <section class="card">
      <div class="grid">
        <div>
          <h2 class="section-title">Dependencies</h2>
          ${asList(output.dependencies)}
        </div>
        <div>
          <h2 class="section-title">Clarification Questions</h2>
          ${asList(output.clarificationQuestions)}
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Raw AI Response</h2>
      <pre>${escapeHtml(rawOutput)}</pre>
    </section>

    <div class="footer">Report generated by the Business Analyst Agent.</div>
  </div>
</body>
</html>`;
}

function buildErrorHtmlReport(rawOutput: string, error: unknown) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BA Agent Report - Error</title>
  <style>
    body { margin: 0; padding: 32px; font-family: Inter, system-ui, sans-serif; background: #f3f4f6; color: #111827; }
    .card { max-width: 980px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 28px; box-shadow: 0 20px 45px rgba(15,23,42,0.08); }
    .section-title { margin-bottom: 16px; font-size: 1.2rem; font-weight: 700; }
    pre { background: #111827; color: #f8fafc; padding: 18px; border-radius: 18px; overflow-x: auto; }
    .error { color: #b91c1c; font-weight: 700; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Validation Error Report</h1>
    <p class="error">JSON / schema validation failed while rendering the report.</p>
    <h2 class="section-title">Raw AI Response</h2>
    <pre>${escapeHtml(rawOutput)}</pre>
    <h2 class="section-title">Error Details</h2>
    <pre>${escapeHtml(String(error))}</pre>
  </div>
</body>
</html>`;
}

main();