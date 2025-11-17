import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createError } from "h3";
import { getSupabaseContext } from "../utils/supabaseApi";

export default defineEventHandler(async (event) => {
  await getSupabaseContext(event, { roles: ["librarian", "admin"] });

  const filePath = join(process.cwd(), "docs", "tests", "manual-testing-guidelines-2.md");

  try {
    const content = await readFile(filePath, "utf-8");
    return { content };
  } catch (error) {
    console.error("Failed to load manual testing guidelines", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Manual testing guide unavailable"
    });
  }
});
