import { NextResponse } from "next/server";
import { createFilingDirectory } from "@/lib/filing-directory/server";

export const runtime = "nodejs";

export async function GET() {
  const filing = createFilingDirectory();
  return NextResponse.json({ leaves: filing.listManualLeaves() });
}
