import { useRef, useState } from "react";
import type { FormEvent } from "react";

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

type LoadState =
  | "idle"
  | "loading"
  | "success"
  | "error";

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

function App() {

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [
    clientRequirement,
    setClientRequirement
  ] = useState("");
  const [transcriptLength, setTranscriptLength] = useState(0);
  const MAX_TRANSCRIPT_LENGTH = 25000;

  // Generated BA Agent response
  const [
    generatedOutput,
    setGeneratedOutput
  ] = useState<RequirementOutput | null>(null);

  const [
    status,
    setStatus
  ] = useState<LoadState>("idle");

  const [
    error,
    setError
  ] = useState<string | null>(null);

  const output =
    generatedOutput ?? emptyOutput;


  // -----------------------------
  // Render normal string lists
  // -----------------------------

  const renderList = (
    items: string[]
  ) => {

    if (!items || items.length === 0) {

      return (
        <div className="empty">
          None
        </div>
      );
    }

    return (
      <ul>
        {items.map(
          (item, index) => (

            <li
              key={`${item}-${index}`}
            >
              {item}
            </li>

          )
        )}
      </ul>
    );
  };


  // -----------------------------
  // Submit Requirement
  // -----------------------------

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    // Validate transcript
    if (!clientRequirement.trim()) {

      setError(
        "Please enter the client requirement or transcript."
      );

      return;
    }

    try {

      setStatus("loading");

      setError(null);

      setGeneratedOutput(null);


      // Call backend BA Agent API

      const response = await fetch(
        "/api/requirements",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            clientRequirement,
          }),
        }
      );


      // Handle backend error

      if (!response.ok) {

        let message =
          `Requirement generation failed (${response.status})`;

        try {

          const errorBody =
            await response.json();

          if (errorBody?.error) {
            message = errorBody.error;
          }

        } catch {
          // Keep default message
        }

        throw new Error(message);
      }


      // Receive BA Agent JSON

      const result: RequirementOutput =
        await response.json();

      setGeneratedOutput(result);

      setStatus("success");

    } catch (err) {

      console.error(
        "Requirement generation error:",
        err
      );

      setStatus("error");

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating requirements."
      );
    }
  };


  // -----------------------------
  // Clear Generated Output
  // -----------------------------

  const handleClearOutput = () => {

    setGeneratedOutput(null);

    setError(null);

    setStatus("idle");
  };


  // -----------------------------
  // Clear Everything
  // -----------------------------

  const handleClearAll = () => {

    setClientRequirement("");

    setGeneratedOutput(null);

    setError(null);

    setStatus("idle");
  };


  return (

    <div className="app-shell">

      {/* HEADER */}

      <header className="header">

        <div>

          <p className="eyebrow">
            Business Analyst Agent
          </p>

          <h1>
            Software Requirement Analyzer
          </h1>

        </div>

        <div
          className={`status-pill ${status === "loading" ? "loading" : ""} ${status === "error" ? "error" : ""}`}
        >

          {status === "idle" &&
            "Ready"}

          {status === "loading" &&
            "Analyzing..."}

          {status === "success" &&
            "Completed"}

          {status === "error" &&
            "Error"}

        </div>

      </header>


      {/* CLIENT REQUIREMENT INPUT */}

      <section className="card">

        <h2>
          Client Requirement / Transcript
        </h2>

        <p>
          Paste the complete raw client
          requirement, meeting notes,
          objective, or transcription below.
          The BA Agent will analyze it and
          generate the requirement document.
        </p>


        <form
          onSubmit={handleSubmit}
          className="input-form"
        >

          <label
            htmlFor="clientRequirement"
          >
            Raw Client Requirement
          </label>


          <textarea
            id="clientRequirement"
            ref={textAreaRef}
            defaultValue={clientRequirement}
            onChange={(event) => {
              const value = event.target.value;
              setTranscriptLength(value.length);
              if (value.length <= MAX_TRANSCRIPT_LENGTH) {
                setClientRequirement(value);
              }
            }}
            rows={25}
            placeholder={`Example:

We want to develop a CRM called SmartCRM 360.

The CRM should allow Admin, Sales Manager and Sales Executives to manage leads, customers, follow-ups, meetings and opportunities.

Admin should create and deactivate users.

Sales Executives should create leads.

Email must be valid.

Expected budget cannot be negative.

We do not know whether duplicate leads should be checked using mobile number, email or both.

The system should support 500 concurrent users.

Website leads should automatically enter the CRM.

Website API documentation has not yet been provided.

...paste the complete client transcript here.`}
          />
          <div className="transcript-info">
            {transcriptLength > 0 && (
              <p>
                Transcript length: {transcriptLength} / {MAX_TRANSCRIPT_LENGTH}
              </p>
            )}
            {transcriptLength > MAX_TRANSCRIPT_LENGTH && (
              <p className="form-error">
                Transcript is too long. Please shorten it to {MAX_TRANSCRIPT_LENGTH} characters.
              </p>
            )}
          </div>


          {error && (

            <div className="form-error">

              {error}

            </div>

          )}


          <div className="form-actions">

            <button
              type="submit"
              disabled={
                status === "loading"
              }
            >

              {status === "loading"
                ? "Analyzing Requirement..."
                : "Analyze Requirements"}

            </button>


            <button
              type="button"
              className="secondary"
              onClick={
                handleClearOutput
              }
            >
              Clear Output
            </button>


            <button
              type="button"
              className="secondary"
              onClick={
                handleClearAll
              }
            >
              Clear All
            </button>

          </div>

        </form>

      </section>


      {/* SHOW MESSAGE BEFORE GENERATION */}

      {!generatedOutput && (
        <section className="card">
          {status === "loading" ? (
            <div className="loading-card">
              <div className="spinner" />
              <div>
                <h3>Analyzing your requirement...</h3>
                <p>This may take a few seconds while the BA agent generates the output.</p>
              </div>
            </div>
          ) : (
            <div className="empty">
              Paste a client requirement above and click "Analyze Requirements".
            </div>
          )}
        </section>
      )}


      {/* PROJECT SUMMARY */}

      {generatedOutput && (

        <>

          <section
            className="card summary-card"
          >

            <h2>
              Project Summary
            </h2>


            <div className="grid-2">

              <div>

                <strong>
                  Project Name
                </strong>

                <p>
                  {output.projectName ||
                    "—"}
                </p>

              </div>


              <div>

                <strong>
                  Project Objective
                </strong>

                <p>
                  {output.projectObjective ||
                    "—"}
                </p>

              </div>


              <div>

                <strong>
                  Actors
                </strong>

                {renderList(
                  output.actors
                )}

              </div>


              <div>

                <strong>
                  Modules
                </strong>

                {renderList(
                  output.modules
                )}

              </div>

            </div>

          </section>


          {/* FUNCTIONAL REQUIREMENTS */}

          <section className="card">

            <h2>
              Functional Requirements
            </h2>


            {output
              .functionalRequirements
              .length ? (

              <div className="table-wrap">

                <table>

                  <thead>

                    <tr>

                      <th>
                        ID
                      </th>

                      <th>
                        Module
                      </th>

                      <th>
                        Actor
                      </th>

                      <th>
                        Requirement
                      </th>

                      <th>
                        Acceptance Criteria
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {output
                      .functionalRequirements
                      .map((item) => (

                        <tr key={item.id}>

                          <td>
                            {item.id}
                          </td>

                          <td>
                            {item.module}
                          </td>

                          <td>
                            {item.actor}
                          </td>

                          <td>
                            {item.requirement}
                          </td>

                          <td>
                            {
                              item.acceptanceCriteria
                            }
                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="empty">

                No functional requirements
                generated.

              </div>

            )}

          </section>


          {/* NFR + BUSINESS RULES */}

          <section
            className="card grid-card"
          >

            <div>

              <h2>
                Non-Functional Requirements
              </h2>

              {renderList(
                output
                  .nonFunctionalRequirements
              )}

            </div>


            <div>

              <h2>
                Business Rules
              </h2>

              {renderList(
                output.businessRules
              )}

            </div>

          </section>


          {/* VALIDATIONS + ASSUMPTIONS */}

          <section
            className="card grid-card"
          >

            <div>

              <h2>
                Validations
              </h2>

              {renderList(
                output.validations
              )}

            </div>


            <div>

              <h2>
                Assumptions
              </h2>

              {renderList(
                output.assumptions
              )}

            </div>

          </section>


          {/* DEPENDENCIES + QUESTIONS */}

          <section
            className="card grid-card"
          >

            <div>

              <h2>
                Dependencies
              </h2>

              {renderList(
                output.dependencies
              )}

            </div>


            <div>

              <h2>
                Clarification Questions
              </h2>

              {renderList(
                output
                  .clarificationQuestions
              )}

            </div>

          </section>

        </>

      )}

    </div>

  );
}

export default App;