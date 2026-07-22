import { LineSchema, type LineDefinition } from "../core/models";

export const parseLineJson = (text: string): LineDefinition => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const result = LineSchema.safeParse(parsed);
  if (!result.success)
    throw new Error(
      `Invalid line definition: ${result.error.issues[0]?.message ?? "unknown schema error"}`,
    );
  return result.data;
};
