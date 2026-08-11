import "dotenv/config";

import express from "express";
import cors from "cors";
import OpenAI from "openai";

import {
  Runner,
  setDefaultOpenAIClient,
  setOpenAIAPI,
} from "@openai/agents";

import {
  requirementAgent
} from "./agents/requirementAgent";

import {
  requirementSchema
} from "./schemas/requirementSchema";

function extractJsonObject(text: string): string {
  const candidateStarts: number[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString && char === "{") {
      candidateStarts.push(i);
    }
  }

  for (const start of candidateStarts) {
    let braceCount = 0;
    inString = false;
    escape = false;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === "\\") {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;

          if (braceCount === 0) {
            const candidate = text.slice(start, i + 1);
            try {
              JSON.parse(candidate);
              return candidate;
            } catch {
              break;
            }
          }
        }
      }
    }
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const fallback = text.slice(firstBrace, lastBrace + 1);
      JSON.parse(fallback);
      return fallback;
    } catch {
      // fallback continues to error below
    }
  }

  throw new Error(
    "Could not extract a complete JSON object from agent output"
  );
}


// --------------------------------
// OpenRouter Configuration
// --------------------------------

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

setDefaultOpenAIClient(openrouter);

setOpenAIAPI("chat_completions");


// --------------------------------
// Runner
// --------------------------------

const runner = new Runner();


// --------------------------------
// Express App
// --------------------------------

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "5mb",
  })
);


// --------------------------------
// Test Route
// --------------------------------

app.get("/api/test", (req, res) => {

  res.json({
    message: "BA Agent API is working",
  });

});


// --------------------------------
// BA Requirement API
// --------------------------------

app.post(
  "/api/requirements",
  async (req, res) => {

    try {

      const {
        clientRequirement
      } = req.body;


      // Validate input

      if (
        !clientRequirement ||
        !clientRequirement.trim()
      ) {

        return res
          .status(400)
          .json({
            error:
              "Client requirement is required",
          });

      }


      console.log(
        "\nClient Requirement Received\n"
      );

      console.log(
        clientRequirement
      );


      // --------------------------------
      // Run BA Agent
      // --------------------------------

      const result =
        await runner.run(
          requirementAgent,
          clientRequirement
        );


      console.log(
        "\nRaw BA Agent Output:\n"
      );

      console.log(
        result.finalOutput
      );


      // --------------------------------
      // Convert output to string
      // --------------------------------

      const rawOutput =
        String(
          result.finalOutput
        );

      console.log(
        "\nRaw BA Agent Output:\n"
      );
      console.log(rawOutput);


      // --------------------------------
      // Extract valid JSON
      // --------------------------------

      const jsonText =
        extractJsonObject(rawOutput);

      const parsedOutput =
        JSON.parse(
          jsonText
        );


      // --------------------------------
      // Zod Validation
      // --------------------------------

      const validatedOutput =
        requirementSchema.parse(
          parsedOutput
        );


      console.log(
        "\nValidated BA Output:\n"
      );

      console.dir(
        validatedOutput,
        {
          depth: null,
        }
      );


      // --------------------------------
      // Return response to React
      // --------------------------------

      return res.json(
        validatedOutput
      );


    } catch (error) {

      console.error(
        "\nBA Agent Error:\n"
      );

      console.error(
        error
      );


      return res
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to analyze requirement",
        });

    }

  }
);


// --------------------------------
// Start Server
// --------------------------------

const PORT = 3001;

app.listen(
  PORT,
  () => {

    console.log(
      `BA Agent API running at http://localhost:${PORT}`
    );

  }
);