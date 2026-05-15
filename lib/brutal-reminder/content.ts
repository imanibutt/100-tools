import type { ReminderTone } from "./types";

export function generateFirstStep(goal: string) {
  const normalized = goal.toLowerCase();

  if (normalized.includes("build")) {
    return "Open the project and create the first page or file.";
  }

  if (normalized.includes("learn")) {
    return "Study for 20 minutes and write 3 notes.";
  }

  if (
    normalized.includes("fitness") ||
    normalized.includes("gym") ||
    normalized.includes("weight") ||
    normalized.includes("health")
  ) {
    return "Put on shoes and move for 10 minutes.";
  }

  if (normalized.includes("job")) {
    return "Improve one CV bullet or send one application.";
  }

  if (normalized.includes("business")) {
    return "Write one offer, send one message, or complete one small business task.";
  }

  return "Spend 10 minutes doing the smallest visible action connected to this goal.";
}

export function getReminderSubject(tone: ReminderTone) {
  if (tone === "brutal") {
    return "Your goal does not care how you feel today";
  }

  return "Your next small step is ready";
}

export function getPreviewText(tone: ReminderTone, goal: string, firstStep: string, excuse?: string) {
  const safeGoal = goal || "[goal]";
  const safeStep = firstStep || "[first_small_step]";
  const safeExcuse = excuse || "[excuse]";

  if (tone === "brutal") {
    return [
      "You said you wanted this:",
      safeGoal,
      "",
      "Today's move:",
      safeStep,
      "",
      "Reality check:",
      `${safeExcuse} is not the enemy. Repeating it without action is.`,
      "",
      "Do not romanticize the big outcome.",
      "Do this one step for 10 minutes.",
      "",
      "Did you do it?",
    ].join("\n");
  }

  return [
    "Your goal:",
    safeGoal,
    "",
    "Today's step:",
    safeStep,
    "",
    "You do not need to finish everything today.",
    "You only need to complete this one small action.",
    "",
    "Did you do it?",
  ].join("\n");
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
