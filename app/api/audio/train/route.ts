//api/audio/train/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";
import * as fs from "fs";
import prisma from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
export default async function Post(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  const { user } = session;
  if (req.method !== "POST") {
    return NextResponse.json("Method Not Allowed", { status: 405 });
  }
  const body = await req.json();
  const { audio } = body;
  try {
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
    const response = await client.voices.add({
      files: [fs.createReadStream(audio)],
      name : user.id
    });
    
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        voice_id: response.voice_id },
    });

    return NextResponse.json({ msg: "success", response });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { msg: "error", error: errorMessage },
      { status: 500 }
    );
  }
}
