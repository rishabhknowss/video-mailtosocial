import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export default async function Post(req: NextRequest) {
  const body = await req.json();
  const { audio_url, video_url } = body;

  try {
    const result = await fal.subscribe("fal-ai/sync-lipsync", {
      input: {
        video_url,
        audio_url
      },
      logs: true, 
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    console.log(result.data);
    console.log(result.requestId);
    return NextResponse.json({ msg: "success", result });
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { msg: "error", error: errorMessage },
      { status: 500 }
    );
  }
}
