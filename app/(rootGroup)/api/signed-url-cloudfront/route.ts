// app/api/signed-url/route.ts
import { NextResponse } from "next/server";
import { generateSignedUrl } from "@/lib/cloudfront";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing `key` query parameter" }, { status: 400 });
  }
  const url = generateSignedUrl(key);
  return NextResponse.json({ url });
}
