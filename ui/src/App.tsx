import { useEffect, useState } from "react";

interface FunctionalRequirement {
  id: string;
  module: string;
  actor: string;
  requirement: string;
  acceptanceCriteria: string;
}

interface RequirementOutput {
  projectName: string;
  projectObjective: string;
  actors: string[];
  modules: string[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: string[];
  businessRules: string[];
  validations: string[];
  assumptions: string[];
  dependencies: string[];
  clarificationQuestions: string[];
}

type LoadState = "idle" | "loading" | "success" | "error";

const emptyOutput: RequirementOutput = {
  projectName: "",
  projectObjective: "",
  actors: [],
  modules: [],
  functionalRequirements: [],
  nonFunctionalRequirements: [],
  businessRules: [],
  validations: [],
  assumptions: [],
  dependencies: [],
  clarificationQuestions: [],
};

const defaultSummary = `## Project Summary
**Name** Example Project

**Objective** Describe the product, business goal, or domain in one or two sentences.

**Actors**
- User
- Admin

**Modules**
- User Management
- Reporting`;

function parseSummary(text: string): RequirementOutput {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  const extractValue = (pattern: RegExp) => {
    const line = lines.find((line) => pattern.test(line));
    if (!line) return "";
    const match = line.match(pattern);
    return match?.[1]?.trim() || "";
  };

  const parseInlineList = (pattern: RegExp) => {
    const match = text.match(pattern);
    if (!match?.[1]) return [];
    return match[1]
      .split(/[,;&] \s*|[,;]\s*|\band\b|\bor\b/gi)
      .map((item) => item.replace(/[^\w\s-]/g, "").trim())
      .filter(Boolean)
      .map((item) => item.replace(/\s+/g, " "));
  };

  const projectName = extractValue(/(?:\*\*Name\*\*|^Name\s*[:]?|^Project\s+Name\s*[:\-]?)\s*(.*)/i);
  const projectObjective = extractValue(/(?:\*\*Objective\*\*|^Objective\s*[:]?|^Objective\s*[:\-]?)\s*(.*)/i);

  const parseSection = (heading: RegExp) => {
    const startIndex = lines.findIndex((line) => heading.test(line));
    if (startIndex === -1) return [];
    const items: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line) break;
      if (/^(?:\*\*.+\*\*|##+\s*.+|[A-Za-z ]+\s*[:]?\s*)$/i.test(line) && !/^[-*]/.test(line)) {
        break;
      }
      const match = line.match(/^[-*]\s*(.+)$/);
      if (match) {
        items.push(match[1].trim());
      }
    }
    return items;
  };

  const actors = parseSection(/^(?:\*\*Actors\*\*|Actors\s*[:]?)/i);
  const modules = parseSection(/^(?:\*\*Modules\*\*|Modules\s*[:]?)/i);
  const nonFunctionalRequirements = parseSection(/^(?:\*\*Non-functional Requirements\*\*|Non-functional Requirements\s*[:]?)/i);
  const validationRequirements = parseSection(/^(?:\*\*Validation Requirements\*\*|Validation Requirements\s*[:]?)/i);

  const inferActors = () => {
    if (actors.length) return actors;
    const texta = text.toLowerCase();
    const inferred: string[] = [];
    if (texta.match(/\b(user|customer|client|member|subscriber)\b/)) inferred.push("Customer");
    if (texta.match(/\b(admin|administrator|superuser|operator)\b/)) inferred.push("Admin");
    if (texta.match(/\b(manager|lead|supervisor)\b/)) inferred.push("Manager");
    if (texta.match(/\b(agent|representative|sales|support)\b/)) inferred.push("Agent");
    if (texta.match(/\b(developer|engineer|technician)\b/)) inferred.push("Operator");
    return inferred.length ? [...new Set(inferred)] : ["User"];
  };

  const inferModules = () => {
    if (modules.length) return modules;
    const textLower = text.toLowerCase();
    const inferred: string[] = [];
    if (textLower.match(/\b(auth|login|signup|registration|password)\b/)) inferred.push("Authentication");
    if (textLower.match(/\b(contact|customer|client)\b/)) inferred.push("Contact Management");
    if (textLower.match(/\b(lead|opportunity|pipeline|sales)\b/)) inferred.push("Sales Pipeline");
    if (textLower.match(/\b(report|dashboard|analytics)\b/)) inferred.push("Reporting");
    if (textLower.match(/\b(order|inventory|stock|shipping|billing|invoice)\b/)) inferred.push("Operations");
    if (textLower.match(/\b(schedule|appointment|booking|reservation)\b/)) inferred.push("Scheduling");
    if (textLower.match(/\b(admin|access|permission|role|security|configuration)\b/)) inferred.push("Administration");
    if (textLower.match(/\b(project|task|workflow|process)\b/)) inferred.push("Workflow Management");
    return inferred.length ? [...new Set(inferred)] : ["General Operations"];
  };

  const inferNonFunctional = () => {
    if (nonFunctionalRequirements.length) return nonFunctionalRequirements;
    const match = text.match(/non-functional requirements?(?: such as|:)\s*([^;\.\n]*?)(?:;|\.|\n|$)/i);
    return match ? parseInlineList(/non-functional requirements?(?: such as|:)\s*([^;\.\n]*?)(?:;|\.|\n|$)/i) : [];
  };

  const inferValidations = () => {
    if (validationRequirements.length) return validationRequirements;
    const match = text.match(/validation requirements?(?: such as|:)\s*([^;\.\n]*?)(?:;|\.|\n|$)/i);
    return match ? parseInlineList(/validation requirements?(?: such as|:)\s*([^;\.\n]*?)(?:;|\.|\n|$)/i) : [];
  };

  return {
    projectName,
    projectObjective,
    actors: inferActors(),
    modules: inferModules(),
    functionalRequirements: [],
    nonFunctionalRequirements: inferNonFunctional(),
    businessRules: [],
    validations: inferValidations(),
    assumptions: [],
    dependencies: [],
    clarificationQuestions: [],
  };
}

function generateFunctionalRequirements(output: RequirementOutput): FunctionalRequirement[] {
  const requirements: FunctionalRequirement[] = [];

  const normalizeId = (module: string, index: number) => {
    const short = module
      .replace(/[^A-Za-z0-9]/g, " ")
      .split(/\s+/)
      .map((part) => part.slice(0, 3).toUpperCase())
      .filter(Boolean)
      .join("")
      .slice(0, 6);
    return `REQ-${short}-${String(index + 1).padStart(3, "0")}`;
  };

  const pickActor = (module: string): string => {
    const normalized = module.toLowerCase();
    const matches = output.actors.filter((actor) => {
      const actorText = actor.toLowerCase();
      return normalized.includes(actorText) || actorText.includes("admin") || actorText.includes("user") || actorText.includes("manager") || actorText.includes("customer") || actorText.includes("agent");
    });
    return matches[0] || output.actors[0] || "User";
  };

  const describeAction = (module: string): string => {
    const name = module.toLowerCase();
    if (name.match(/\b(auth|login|signup|registration|password)\b/)) {
      return "authenticate users and manage access";
    }
    if (name.match(/\b(contact|customer|client)\b/)) {
      return "store and manage contact details";
    }
    if (name.match(/\b(lead|opportunity|pipeline|sales)\b/)) {
      return "track opportunities through stages and manage pipeline progress";
    }
    if (name.match(/\b(report|dashboard|analytics)\b/)) {
      return "generate insights, reports, and visual summaries";
    }
    if (name.match(/\b(order|inventory|stock|shipping|billing|invoice)\b/)) {
      return "manage operational workflows and transaction data";
    }
    if (name.match(/\b(schedule|appointment|booking|reservation)\b/)) {
      return "handle scheduling, bookings, and availability management";
    }
    if (name.match(/\b(admin|access|permission|role|security|configuration)\b/)) {
      return "manage roles, permissions, and system configuration";
    }
    if (name.match(/\b(project|task|workflow|process)\b/)) {
      return "orchestrate work items and business processes";
    }
    return `support ${module.toLowerCase()} workflows`;
  };

  const generateTemplates = (module: string) => {
    const mainActor = pickActor(module);
    const supportActor = output.actors[1] || output.actors[0] || "User";
    const adminActor = output.actors.find((actor) => /admin|administrator|operator/i.test(actor)) || "Admin";
    const action = describeAction(module);
    return [
      {
        actor: mainActor,
        requirement: `Allow ${mainActor.toLowerCase()}s to ${action} within the ${module} module.`,
        acceptance: `${module} functionality is available and ${mainActor.toLowerCase()}s can complete the intended task successfully.`,
      },
      {
        actor: supportActor,
        requirement: `Provide reporting, status updates, or workflow visibility for ${module.toLowerCase()} activities.`,
        acceptance: `${module} information is visible and actionable for the intended users.`,
      },
      {
        actor: adminActor,
        requirement: `Allow ${adminActor.toLowerCase()}s to configure and maintain ${module.toLowerCase()} settings and permissions.`,
        acceptance: `${module} settings are manageable and changes are applied consistently for authorized users.`,
      },
    ];
  };

  let index = 0;
  output.modules.forEach((module) => {
    generateTemplates(module).forEach((template) => {
      requirements.push({
        id: normalizeId(module, index),
        module,
        actor: template.actor,
        requirement: template.requirement,
        acceptanceCriteria: template.acceptance,
      });
      index += 1;
    });
  });

  return requirements;
}

function App() {
  const [data, setData] = useState<RequirementOutput | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState(defaultSummary);
  const [generatedOutput, setGeneratedOutput] = useState<RequirementOutput | null>(null);

  useEffect(() => {
    async function loadReport() {
      setStatus("loading");
      try {
        const response = await fetch("/report.json");
        if (!response.ok) {
          throw new Error(`Failed to load report.json (${response.status})`);
        }
        const json = (await response.json()) as RequirementOutput;
        setData(json);
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    }

    loadReport();
  }, []);

  const parsedSummary = parseSummary(summaryText);
  const missingFields = [
    !parsedSummary.projectName ? "Project Name" : null,
    !parsedSummary.projectObjective ? "Objective" : null,
    !parsedSummary.actors.length ? "Actors" : null,
    !parsedSummary.modules.length ? "Modules" : null,
  ].filter(Boolean);

  const output = generatedOutput ?? emptyOutput;

  const renderList = (items: string[]) => {
    if (!items.length) {
      return <div className="empty">None</div>;
    }
    return <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (missingFields.length) {
      setError(`Please provide: ${missingFields.join(", ")}.`);
      setGeneratedOutput(null);
      return;
    }
    setError(null);
    const result: RequirementOutput = {
      ...parsedSummary,
      functionalRequirements: generateFunctionalRequirements(parsedSummary),
      nonFunctionalRequirements: [],
      businessRules: [],
      validations: [],
      assumptions: [],
      dependencies: [],
      clarificationQuestions: [],
    };
    setGeneratedOutput(result);
  };

  const handleReset = () => {
    setGeneratedOutput(null);
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <p className="eyebrow">Business Analyst Viewer</p>
          <h1>Project Summary Input</h1>
        </div>
        <div className="status-pill">{status}</div>
      </header>

      <section className="card">
        <h2>Enter Project Summary</h2>
        <form onSubmit={handleSubmit} className="input-form">
          <label htmlFor="summaryText">Paste your project summary in markdown-style format</label>
          <textarea
            id="summaryText"
            value={summaryText}
            onChange={(event) => setSummaryText(event.target.value)}
            rows={18}
            placeholder="Use headings like **Name**, **Objective**, **Actors**, and **Modules** for best parsing."
          />
          {missingFields.length ? (
            <div className="form-error">
              Please add the following fields for best results: {missingFields.join(", ")}.
            </div>
          ) : null}
          {error ? <div className="form-error">{error}</div> : null}
          <div className="form-actions">
            <button type="submit">Generate Functional Requirements</button>
            <button type="button" className="secondary" onClick={handleReset}>
              Clear Generated Output
            </button>
          </div>
        </form>
      </section>

      <section className="card summary-card">
        <h2>Parsed Summary</h2>
        <div className="grid-2">
          <div>
            <strong>Name</strong>
            <p>{parsedSummary.projectName || "—"}</p>
          </div>
          <div>
            <strong>Objective</strong>
            <p>{parsedSummary.projectObjective || "—"}</p>
          </div>
          <div>
            <strong>Actors</strong>
            {renderList(parsedSummary.actors)}
          </div>
          <div>
            <strong>Modules</strong>
            {renderList(parsedSummary.modules)}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Functional Requirements</h2>
        {output.functionalRequirements.length ? (
          <div className="table-wrap">
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
                {output.functionalRequirements.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.module}</td>
                    <td>{item.actor}</td>
                    <td>{item.requirement}</td>
                    <td>{item.acceptanceCriteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No functional requirements generated yet.</div>
        )}
      </section>

      <section className="card grid-card">
        <div>
          <h2>Non-functional Requirements</h2>
          {renderList(output.nonFunctionalRequirements)}
        </div>
        <div>
          <h2>Business Rules</h2>
          {renderList(output.businessRules)}
        </div>
      </section>

      <section className="card grid-card">
        <div>
          <h2>Validations</h2>
          {renderList(output.validations)}
        </div>
        <div>
          <h2>Assumptions</h2>
          {renderList(output.assumptions)}
        </div>
      </section>

      <section className="card grid-card">
        <div>
          <h2>Dependencies</h2>
          {renderList(output.dependencies)}
        </div>
        <div>
          <h2>Clarification Questions</h2>
          {renderList(output.clarificationQuestions)}
        </div>
      </section>
    </div>
  );
}

export default App;
