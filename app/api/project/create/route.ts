// app/api/project/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/prisma/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, script, keywords = [] } = await req.json();
    
    if (!title || !script) {
      return NextResponse.json({ 
        error: "Title and script are required" 
      }, { status: 400 });
    }

    // Create new project with keywords
    const project = await prisma.project.create({
      data: {
        title,
        script,
        keywords: keywords,
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