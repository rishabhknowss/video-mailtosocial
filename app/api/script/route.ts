// app/api/script/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    try {
        // Parse and validate the prompt
        const { prompt } = await req.json();
        
        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "Valid prompt is required" }, { status: 400 });
        }
        
        // Check for API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }
        
        // Initialize the Gemini client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        // Generate content
        const result = await model.generateContent(prompt);
        
        return NextResponse.json({ 
            success: true, 
            text: result.response.text 
        });
        
    } catch (error) {
        console.error("Script generation error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}