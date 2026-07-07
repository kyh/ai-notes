import { createGateway } from "ai";

/** Single model id used by every agent in the app. */
export const MODEL_ID = "openai/gpt-5.1-instant";

/** One place to construct models — agents import from here. */
export const createModel = (apiKey: string) => createGateway({ apiKey })(MODEL_ID);
