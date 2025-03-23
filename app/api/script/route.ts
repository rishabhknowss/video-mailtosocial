//api/script/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

export default async  function POST(req:NextRequest){
    const session = await getServerSession(authOptions);
    if(!session){
        return NextResponse.json("Unauthorized", { status: 401 });
    }
    if(req.method !== "POST"){
        return NextResponse.json("Method Not Allowed", { status: 405 });
    }
    const prompt = await req.json();
   
   try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        return NextResponse.json({ msg: "success", text: result.response.text });
   }catch(error){
       console.error(error);
       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
       return NextResponse.json({ msg: "error", error: errorMessage }, { status: 500 });
   }
}
