import { NextResponse } from "next/server";
import { createFilingDirectory } from "@/lib/filing-directory/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    description?: string;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const filing = createFilingDirectory();
  const result = await filing.suggest({
    name: body.name,
    description: body.description,
  });
  return NextResponse.json(result);
}
