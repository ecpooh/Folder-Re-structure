import { NextResponse } from "next/server";
import { createFilingDirectory } from "@/lib/filing-directory/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const filing = createFilingDirectory();
  const entries = q != null && q !== "" ? await filing.search(q) : await filing.listEntries();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    file?: string;
    home?: string;
    note?: string;
  };
  if (!body.file?.trim() || !body.home?.trim()) {
    return NextResponse.json(
      { error: "file and home are required" },
      { status: 400 },
    );
  }
  const filing = createFilingDirectory();
  const result = await filing.confirmAdd({
    file: body.file,
    home: body.home,
    note: body.note,
  });
  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    file?: string;
    home?: string;
    note?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const filing = createFilingDirectory();
  try {
    const entry = await filing.update(body.id, {
      file: body.file,
      home: body.home,
      note: body.note,
    });
    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "update failed" },
      { status: 404 },
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const filing = createFilingDirectory();
  try {
    await filing.remove(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "delete failed" },
      { status: 404 },
    );
  }
}
