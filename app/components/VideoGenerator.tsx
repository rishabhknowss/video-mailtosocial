"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Play, 
  Download, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Loader2,
  Film
} from "lucide-react";

interface Project {
  id: number;
  title: string;
  script: string;
  status: string;
}

export default function VideoGenerator({ projectId }: { projectId?: number }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  const fetchProject = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/project/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      
      const data = await response.json();
      console.log("Fetched project:", data);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!project?.script) {
      setError("No script available to generate audio");
      return null;
    }

    try {
      setMessage("Generating audio from script...");
      
      const response = await fetch("/api/audio/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: project.script,
        }),
      });
      
      const data = await response.json();
      console.log("Audio generation response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || data.msg || "Failed to generate audio");
      }
      
      if (!data.response || typeof data.response !== 'string') {
        console.error("Invalid audio URL in response:", data);
        throw new Error("No valid audio URL was generated");
      }
      
      setAudioUrl(data.response);
      setMessage("Audio generated successfully! Now creating lip-synced video...");
      
      return data.response;
    } catch (err) {
      console.error("Audio generation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      return null;
    }
  };

  const generateVideo = async (audioUrlParam: string) => {
    try {
      // Get user's video URL
      const userResponse = await fetch("/api/user/profile");
      
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      const userData = await userResponse.json();
      console.log("User profile:", userData);
      
      if (!userData.videoUrl) {
        throw new Error("You need to upload a video first");
      }
      
      console.log("Sending video generation request with:");
      console.log("Audio URL:", audioUrlParam);
      console.log("Video URL:", userData.videoUrl);
      
      // Generate lip-synced video
      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: audioUrlParam,
          video_url: userData.videoUrl,
          projectId: project?.id,
          title: project?.title || "New Video"
        }),
      });
      
      const data = await response.json();
      console.log("Video generation response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video");
      }
      
      setVideoOutput(data.outputUrl);
      setMessage(null);
      
      // Refresh project data to get updated status
      if (project?.id) {
        fetchProject(project.id);
      }
    } catch (err) {
      console.error("Video generation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!session?.user?.id) {
      setError("You must be logged in to generate a video");
      return;
    }

    setError(null);
    setMessage(null);
    setGenerating(true);

    try {
      // First generate audio from text
      const generatedAudioUrl = await generateAudio();
      
      // Only proceed with video generation if we have a valid audio URL
      if (generatedAudioUrl && typeof generatedAudioUrl === 'string') {
        await generateVideo(generatedAudioUrl);
      } else {
        throw new Error("Failed to generate audio - cannot proceed with video creation");
      }
    } catch (err) {
      console.error("Video generation process error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Generate Video</h2>
      
      {project ? (
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">Project: {project.title}</h3>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 mb-4">
            <p className="text-sm text-gray-500 mb-1">Script:</p>
            <p className="whitespace-pre-wrap text-gray-800">{project.script}</p>
          </div>
          
          <div className="flex items-center mb-4">
            <div className="text-sm text-gray-700 flex items-center">
              Status: 
              {project.status === "COMPLETED" ? (
                <span className="ml-2 flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </span>
              ) : project.status === "PROCESSING" ? (
                <span className="ml-2 flex items-center text-yellow-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Processing
                </span>
              ) : (
                <span className="ml-2 flex items-center text-gray-600">
                  <Film className="h-4 w-4 mr-1" />
                  Ready to generate
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 mb-4">
          Select a project first to generate a video.
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center mb-4">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {message}
        </div>
      )}

      {videoOutput && project?.status === "COMPLETED" && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">Generated Video</h3>
          <div className="aspect-video bg-black rounded-md overflow-hidden mb-3">
            <video 
              src={videoOutput} 
              controls 
              className="w-full h-full object-contain"
            />
          </div>
          <a 
            href={videoOutput} 
            download 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Video
          </a>
        </div>
      )}

      <button
        onClick={handleGenerateVideo}
        disabled={!project || generating || project.status === "PROCESSING" || project.status === "COMPLETED"}
        className={`w-full py-2 px-4 rounded-md font-medium ${
          !project || generating || project.status === "PROCESSING" || project.status === "COMPLETED"
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {generating ? (
          <span className="flex items-center justify-center">
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Generating Video...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Play className="h-4 w-4 mr-2" />
            Generate Video
          </span>
        )}
      </button>
    </div>
  );
}