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
            console.error("Gemini API key is missing");
            return NextResponse.json({ error: "Server configuration error - API key missing" }, { status: 500 });
        }
        
        // Initialize the Gemini client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        // Generate script content
        const scriptPrompt = `Write a short, engaging script about ${prompt} from a first-person perspective. Only one person should be speaking. The script should feel natural, like someone sharing their thoughts or expertise in a conversational yet professional tone. Keep it concise and suited for a 30-60 second video. No greetings, introductions, or sign-offs—just straight into the topic.`;
        console.log("Sending script prompt to Gemini:", scriptPrompt);
        
        const scriptResult = await model.generateContent(scriptPrompt);
        const scriptText = scriptResult.response.text();
        
        if (!scriptText) {
            console.error("Gemini returned empty response for script");
            return NextResponse.json({ error: "AI generated empty content" }, { status: 500 });
        }
        
        // Generate keywords for broll images
        const keywordsPrompt = `Based on this script about ${prompt}, generate 5-8 specific keywords or short phrases that would make good visual B-roll images to accompany the video. Each keyword should represent a clear, concrete visual that relates to the script's topic. Format your response as a comma-separated list with no additional text or explanation.

Script:
${scriptText}`;
        
        console.log("Sending keywords prompt to Gemini:", keywordsPrompt);
        
        const keywordsResult = await model.generateContent(keywordsPrompt);
        const keywordsText = keywordsResult.response.text();
        
        // Parse keywords into array
        const keywords = keywordsText
            ? keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0)
            : [];
        
        console.log("Generated script:", scriptText.substring(0, 100) + "...");
        console.log("Generated keywords:", keywords);
        
        // Return with consistent structure
        return NextResponse.json({ 
            success: true, 
            text: scriptText,
            keywords: keywords
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