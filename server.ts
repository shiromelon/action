import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI Client
// Always use GEMINI_API_KEY from environment variables
// Lazy-initialize Google GenAI Client only during endpoint request, avoiding start-up crash if GEMINI_API_KEY is missing
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Keep server running safely.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

app.use(express.json());

// API: Generate additional detailed design documentation, code structures or prompts using Gemini API
app.post("/api/gemini/generate-spec", async (req, res) => {
  const { part, customDirectives, stageConfig } = req.body;

  try {
    const ai = getAI();
    let prompt = "";
    if (part === "physics") {
      prompt = `Create a highly professional and mathematically detailed physical implementation guide for a "physics-based cloud deformation system" in a 2D Action Game.
The target is a modern game engine (HTML5 Canvas 2D, PixiJS, or custom 2D math, but focus on web-friendly math or 2D vertex manipulation).
The specification must include:
1. Dynamic density equation & viscoelastic lattice displacement algorithm for a custom 2D Canvas rendering loop.
2. Collision mechanics (how a player character collides with elastic soft clouds using Verlet integration, spring-damper mechanisms, or distance fields).
3. Cloud cutting/absorption physics (how wind or energy beams divide the contour into distinct sub-blobs or change local density).
4. Interactive parameters like Humidty (${stageConfig?.humidity || 50}%), Wind Speed (${stageConfig?.windSpeed || 10} m/s), Cloud Type (${stageConfig?.weatherType || "Cumulus"}).
Please formulate this as a highly detailed, dry, extremely comprehensive engineering doc with clear code examples in TypeScript. Avoid pleasantries, output clean markdown layout with lists. Include exact instructions a coder AI can follow to write the code.`;
    } else if (part === "movement") {
      prompt = `Create an absolute master-class specification for "fluid, responsive 2D aerial flight mechanics" (Direct Kinetic Aerial Movement).
Movement theme: Gliding, dynamic wind lifts, thermals, and cloud interaction.
The specification must include:
1. Complete formula for aerodynamic coefficients (lift, drag, thrust, gravity) and how they adapt based on speed and tilt (pitch/angle).
2. Dynamic wind-force reactions: how to handle wind sheer and thermal draft vectors from warm low-altitude clouds (Stage configuration: Wind speed ${stageConfig?.windSpeed || 10}m/s, wind direction ${stageConfig?.windDirection || "North-East"}).
3. Control scheme: detailed response curve mappings, deceleration/braking in dense clouds, and "Cloud Surf" momentum-transfer boost rules.
4. Clean boilerplate code / control state machine in TypeScript detailing physics tick update function.
Please design this for other developer AIs to parse easily and write the actual implementation without ambiguity.`;
    } else if (part === "gimmick") {
      prompt = `Design a comprehensive level-gimmick & weather-interaction matrix for Stage: "${stageConfig?.name || "Nimbus Haven"}".
Environmental Context: Weather: ${stageConfig?.weatherType || "Heavy Rain"}, Wind: ${stageConfig?.windSpeed || 15}m/s, Humidity: ${stageConfig?.humidity || 80}%, Difficulty Level: ${stageConfig?.difficulty || "Medium"}.
Please define:
1. Interactive weather-changing system details (how player triggers condensation, evaporation, or lightning charging).
2. Exactly 3 distinct physical cloud-state puzzles (e.g., Freezing clouds to create ice slide pathways, charging clouds with electricity to power floating engines, or dissolving clouds with heat to drop key anchors).
3. Level design layout, stage goals, safe spots, and danger zones under these current weather conditions.
4. Steps, formulas, and exact logic flows for creating the state managers. Write a solid UML-style textual scheme and state transition logic we can feed directly into another AI model.`;
    } else if (part === "ai-prompt") {
      prompt = `Draft a state-of-the-art developer prompt that can be handed directly to a coding AI (like Claude, Gemini, or ChatGPT) to program the game module for "${stageConfig?.name || "Stage 1"}" based on the following custom directives:
${customDirectives || "Create realistic cloud physical interaction with standard controls."}.
The prompt should enforce:
1. Complete imports (e.g., importing Lucide, HTML5 Canvas 2D structures cleanly).
2. Exact responsive controls, target tracking, and proper delta-time physics.
3. Specific step-by-step assembly of the scene and custom asset procedural representations.
Ensure this is a highly optimized "system prompt" format that guarantees a flawless single-turn boilerplate completion.`;
    } else {
      prompt = `Create a general expansion to the cloud action game specification. Directives: ${customDirectives || "Default specification extension"}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, veteran Lead Game Programmer and Technical Director with decades of experience in physics engine optimization and AAA locomotion design. You write precise, beautiful, mathematically sound, implementable development documents that other coding AIs can parse and code instantly with absolute precision. Use clean Markdown.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Spec Generation Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate design specification." });
  }
});

// Serve Vite dev server or static contents
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted on http://0.0.0.0:${PORT}`);
  });
}

startServer();
