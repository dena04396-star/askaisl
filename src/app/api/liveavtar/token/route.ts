export const runtime = "nodejs";

export async function POST() {
  try {
    const apiKey   = process.env.LIVEAVATAR_API_KEY;
    const avatarId = process.env.NEXT_PUBLIC_LIVEAVATAR_AVATAR_ID;

    if (!apiKey || !avatarId) {
      return new Response(
        JSON.stringify({ error: "LIVEAVATAR_API_KEY or NEXT_PUBLIC_LIVEAVATAR_AVATAR_ID not set in .env.local" }),
        { status: 500 }
      );
    }

    const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "FULL",           // FULL = ElevenLabs TTS included; LITE has no TTS engine
        avatar_id: avatarId,
        is_sandbox: false,
        avatar_persona: {},
        video_settings: { quality: "high" },
        max_session_duration: 1200,
      }),
    });

    const data = await res.json();
    console.log("LIVEAVATAR TOKEN:", res.status, JSON.stringify(data));

    if (!res.ok || !data?.data?.session_token) {
      return new Response(JSON.stringify({ error: data?.message || "Token request failed" }), { status: res.status });
    }

    return new Response(JSON.stringify({ session_token: data.data.session_token }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("LIVEAVATAR TOKEN ERROR:", err);
    return new Response("Internal error", { status: 500 });
  }
}
