// app/api/script/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

// Define the scene structure
interface Scene {
  content: string;
  imagePrompt: string;
}

// Define the response structure
interface ScriptResponse {
  scenes: Scene[];
}

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
        
        // Request scene-based content and image prompts in a single request
        const scenePrompt = `
        Create a short, engaging video script about "${prompt}" divided into 4-6 distinct scenes.
        
        For each scene, provide:
        1. Content: A short paragraph of spoken text in first-person perspective, conversational yet professional tone. The complete script should be 30-60 seconds when spoken.
        2. Image Prompt: A detailed image generation prompt that would create a beautiful, relevant visual to accompany this scene.
        
        Format your response as valid JSON with this structure:
        {
          "scenes": [
            {
              "content": "The spoken text for scene 1",
              "imagePrompt": "Detailed image generation prompt for scene 1"
            },
            {
              "content": "The spoken text for scene 2",
              "imagePrompt": "Detailed image generation prompt for scene 2"
            },
            ... and so on
          ]
        }
        
        Make sure each image prompt is specific, detailed and would generate a high-quality, professional image directly with an AI model.
        Keep the entire script cohesive, with a clear beginning, middle, and end.
        `;
        
        console.log("Sending scene-based prompt to Gemini");
        
        const result = await model.generateContent(scenePrompt);
        const responseText = result.response.text();
        
        if (!responseText) {
            console.error("Gemini returned empty response");
            return NextResponse.json({ error: "AI generated empty content" }, { status: 500 });
        }
        
        try {
            // Parse the JSON response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Could not extract JSON from response");
            }
            
            const jsonText = jsonMatch[0];
            const parsedResponse: ScriptResponse = JSON.parse(jsonText);
            
            // Validate response structure
            if (!parsedResponse.scenes || !Array.isArray(parsedResponse.scenes)) {
                throw new Error("Invalid response format: missing scenes array");
            }
            
            // Get the full script by combining all scene content
            const fullScript = parsedResponse.scenes.map(scene => scene.content).join("\n\n");
            
            // Log for debugging
            console.log("Generated scenes:", parsedResponse.scenes.length);
            console.log("Full script:", fullScript.substring(0, 100) + "...");
            
            // Return the structured response
            return NextResponse.json({ 
                success: true, 
                scenes: parsedResponse.scenes,
                fullScript: fullScript
            });
        } catch (parseError) {
            console.error("Error parsing Gemini JSON response:", parseError);
            console.log("Raw response:", responseText);
            
            return NextResponse.json({ 
                error: "Failed to parse AI response", 
                details: parseError instanceof Error ? parseError.message : "Unknown error"
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Script generation error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}