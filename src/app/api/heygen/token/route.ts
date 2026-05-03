export const runtime = "nodejs";

export async function POST() {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "HEYGEN_API_KEY not set" }), { status: 500 });
    }

    const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
    });

    const data = await res.json();
    console.log("HEYGEN TOKEN:", res.status, JSON.stringify(data));

    if (!res.ok || !data?.data?.token) {
      return new Response(JSON.stringify({ error: data?.message || "Token request failed" }), { status: res.status });
    }

    return new Response(JSON.stringify({ token: data.data.token }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("HEYGEN TOKEN ERROR:", err);
    return new Response("Internal error", { status: 500 });
  }
}
