"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Wand2, AlertCircle, CheckCircle } from "lucide-react";

export default function ScriptGenerator() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string>("");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setError(null);
  };

// app/components/ScriptGenerator.tsx (relevant part of the handleGenerateScript function)
const handleGenerateScript = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for script generation");
      return;
    }

    if (!session?.user?.id) {
      setError("You must be logged in to generate a script");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      console.log("Sending script generation request for prompt:", prompt);
      
      // Generate script with Gemini API
      const response = await fetch("/api/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      console.log("Script API response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate script");
      }

      if (!data || !data.text) {
        console.error("Invalid response format:", data);
        throw new Error("Script data not found in response");
      }
      
      setScript(data.text);
      setGenerated(true);
    } catch (err) {
      console.error("Script generation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setGenerating(false);
    }
};

  const handleSave = async () => {
    try {
      // Save script to a new project
      const response = await fetch("/api/project/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt,
          script,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save project");
      }

      // Success - project saved!
      const data = await response.json();
      console.log("Project saved:", data); // Debug logging
      
      // Add confirmation message or redirect logic here if needed
      alert("Project saved successfully!");
      
      // Optionally refresh the page or redirect to projects
      // window.location.href = "/dashboard";
    } catch (err) {
      console.error("Save project error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Generate Script</h2>
      <p className="text-gray-600 mb-4">
        Enter a topic or idea, and we'll generate a script for your video.
      </p>

      <div className="mb-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          What do you want your video to be about?
        </label>
        <textarea
          id="prompt"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="E.g., The benefits of meditation, An introduction to my business, etc."
          value={prompt}
          onChange={handlePromptChange}
          disabled={generating}
        ></textarea>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <button
        onClick={handleGenerateScript}
        disabled={!prompt.trim() || generating}
        className={`w-full py-2 px-4 rounded-md font-medium mb-4 ${
          !prompt.trim() || generating
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {generating ? (
          <span className="flex items-center justify-center">
            <Wand2 className="animate-spin h-4 w-4 mr-2" />
            Generating...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Script
          </span>
        )}
      </button>

      {generated && script && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-700">Generated Script</h3>
            <button
              onClick={handleSave}
              className="text-sm px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md flex items-center"
            >
              <FileText className="h-3 w-3 mr-1" />
              Save to Project
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="whitespace-pre-wrap text-gray-800">{script}</p>
          </div>
        </div>
      )}
    </div>
  );
}