import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

  const form = await req.formData();
  const audio    = form.get("audio")    as File | null;
  const language = form.get("language") as string | null ?? "en";

  if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

  const groqForm = new FormData();
  groqForm.append("file", audio, "audio.webm");
  groqForm.append("model", "whisper-large-v3-turbo");
  groqForm.append("language", language.split("-")[0]);
  groqForm.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: groqForm,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[transcribe] Groq error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ text: data.text ?? "" });
}
