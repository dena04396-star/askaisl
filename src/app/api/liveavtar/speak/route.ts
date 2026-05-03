export const runtime = "nodejs";

const HEYGEN_KEY    = () => process.env.HEYGEN_API_KEY!;
const AVATAR_ID     = () => process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID!;
const VOICE_ID      = () => process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID || "";

const POLL_INTERVAL = 2000;   // ms between polls
const POLL_TIMEOUT  = 45000;  // max wait 45 s

/* POST { text: string } → { video_url: string } */
export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "No text" }), { status: 400 });
    }

    const voiceId = VOICE_ID();
    if (!voiceId) {
      return new Response(
        JSON.stringify({ error: "NEXT_PUBLIC_HEYGEN_VOICE_ID is not set in .env.local. Get a voice ID from https://app.heygen.com/voices" }),
        { status: 500 }
      );
    }

    /* Step 1: Create video generation job */
    const createRes = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": HEYGEN_KEY(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: AVATAR_ID(),
              avatar_style: "normal",
            },
            voice: {
              type: "text",
              voice_id: voiceId,
              input_text: text,
              speed: 1.0,
            },
            background: {
              type: "color",
              value: "#1a1a2e",
            },
          },
        ],
        dimension: { width: 720, height: 720 },
      }),
    });

    const createData = await createRes.json();
    console.log("HEYGEN CREATE:", JSON.stringify(createData));

    if (!createRes.ok || !createData?.data?.video_id) {
      return new Response(JSON.stringify({ error: createData?.message || "HeyGen video creation failed", detail: createData }), {
        status: createRes.status,
      });
    }

    const videoId = createData.data.video_id;

    /* Step 2: Poll until completed */
    const deadline = Date.now() + POLL_TIMEOUT;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL));

      const statusRes = await fetch(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        { headers: { "X-Api-Key": HEYGEN_KEY() } }
      );
      const statusData = await statusRes.json();
      console.log("HEYGEN STATUS:", statusData?.data?.status);

      if (statusData?.data?.status === "completed" && statusData.data.video_url) {
        return new Response(
          JSON.stringify({ video_url: statusData.data.video_url }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (statusData?.data?.status === "failed") {
        return new Response(
          JSON.stringify({ error: "HeyGen video generation failed", detail: statusData.data.error }),
          { status: 500 }
        );
      }
    }

    return new Response(JSON.stringify({ error: "HeyGen video generation timed out" }), { status: 504 });
  } catch (err) {
    console.error("HEYGEN ERROR:", err);
    return new Response("Internal error", { status: 500 });
  }
}
