import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/prisma/db";
import { ElevenLabsClient } from "elevenlabs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  
  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      voice_id: true
    }
  });
  
  if (!dbUser || !dbUser.voice_id) {
    return NextResponse.json("Voice ID not found for user", { status: 404 });
  }
  
  const { text } = await req.json();
  
  if (!text) {
    return NextResponse.json("Text is required", { status: 400 });
  }
  
  try {
    const client = new ElevenLabsClient({ 
      apiKey: process.env.ELEVENLABS_API_KEY 
    });
    
    const response = await client.textToSpeech.convert(dbUser.voice_id, {
      output_format: "mp3_44100_128",
      text,
      model_id: "eleven_multilingual_v2",
    });
    
    return NextResponse.json({ msg: "success", response });
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