// app/api/audio/train/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";
import prisma from "@/prisma/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { audio } = body;
    
    // Validate audio file path
    if (!audio || typeof audio !== "string") {
      return NextResponse.json({ error: "Valid audio file path is required" }, { status: 400 });
    }
    
    // Verify the file exists
    if (!fs.existsSync(audio)) {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
    }
    
    // Basic file type validation by checking extension
    const fileExt = path.extname(audio).toLowerCase();
    if (!['.mp3', '.wav', '.m4a'].includes(fileExt)) {
      return NextResponse.json({ error: "Unsupported audio format" }, { status: 400 });
    }

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
    
    // Send to ElevenLabs
    const response = await client.voices.add({
      files: [fs.createReadStream(audio)],
      name: session.user.id
    });
    
    // Update user in database
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        voice_id: response.voice_id 
      },
    });

    return NextResponse.json({ 
      success: true, 
      voice_id: response.voice_id 
    });
    
  } catch (error) {
    console.error("Voice training error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}