// app/api/project/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/prisma/db";

// Define the scene structure
interface Scene {
  content: string;
  imagePrompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, script, scenes = [] } = await req.json();
    
    if (!title || !script) {
      return NextResponse.json({ 
        error: "Title and script are required" 
      }, { status: 400 });
    }

    // Extract image prompts from scenes
    const imagePrompts = scenes.map((scene: Scene) => scene.imagePrompt);

    // Create new project with scenes data
    const project = await prisma.project.create({
      data: {
        title,
        script,
        scenes: JSON.stringify(scenes), // Store scenes as a JSON string
        imagePrompts: imagePrompts, // Store image prompts separately for easier access
        userId: session.user.id,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ 
      success: true, 
      project 
    });
    
  } catch (error) {
    console.error("Error creating project:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}