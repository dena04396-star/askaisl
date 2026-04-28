import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    // TODO: validate token via OAuth provider / magic link
    return NextResponse.json({ message: "authenticated" });
  } catch (error) {
    console.error("[/api/auth]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
