"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Play, 
  Download, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Loader2,
  Film,
  Image as ImageIcon,
  Copy,
  Video as VideoIcon,
  Plus,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  Trash
} from "lucide-react";

interface Project {
  id: number;
  title: string;
  script: string;
  status: string;
  keywords?: string[];
  brollImages?: string[];
  brollVideoUrl?: string;
  outputUrl?: string;
  finalVideoUrl?: string;
}

interface MergeSettings {
  personSize: number;
  personPosition: 'bottom' | 'bottom_left' | 'bottom_right';
}

export default function VideoGenerator({ projectId }: { projectId?: number }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingBroll, setGeneratingBroll] = useState(false);
  const [generatingBrollVideo, setGeneratingBrollVideo] = useState(false);
  const [mergingVideos, setMergingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<string | null>(null);
  const [brollImages, setBrollImages] = useState<string[]>([]);
  const [brollVideoUrl, setBrollVideoUrl] = useState<string | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  
  // Additional functionality for keywords and settings
  const [newKeyword, setNewKeyword] = useState("");
  const [additionalKeywords, setAdditionalKeywords] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [mergeSettings, setMergeSettings] = useState<MergeSettings>({
    personSize: 0.4,
    personPosition: 'bottom'
  });
  
  const keywordInputRef = useRef<HTMLInputElement>(null);

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
      
      if (data.brollImages && data.brollImages.length > 0) {
        setBrollImages(data.brollImages);
      }
      
      if (data.brollVideoUrl) {
        setBrollVideoUrl(data.brollVideoUrl);
      }
      
      if (data.outputUrl) {
        setVideoOutput(data.outputUrl);
      }
      
      if (data.finalVideoUrl) {
        setMergedVideoUrl(data.finalVideoUrl);
      }
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

  const handleGenerateBroll = async () => {
    if (!session?.user?.id || !project?.id) {
      setError("You must be logged in and have a project selected");
      return;
    }

    setError(null);
    setMessage("Generating B-roll images from keywords...");
    setGeneratingBroll(true);

    try {
      // Combine project keywords with any additional keywords
      const allKeywords = [
        ...(project.keywords || []),
        ...additionalKeywords
      ];
      
      const response = await fetch("/api/broll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          keywords: allKeywords
        }),
      });
      
      const data = await response.json();
      console.log("B-roll generation response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate B-roll images");
      }
      
      setBrollImages(data.imageUrls || []);
      setMessage(`Generated ${data.imageCount} B-roll images successfully!`);
      
      // Refresh project data to get updated broll images
      fetchProject(project.id);
      
    } catch (err) {
      console.error("B-roll generation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setGeneratingBroll(false);
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleGenerateBrollVideo = async () => {
    if (!session?.user?.id || !project?.id || !brollImages.length) {
      setError("You need B-roll images first");
      return;
    }

    setError(null);
    setMessage("Creating B-roll video from images...");
    setGeneratingBrollVideo(true);

    try {
      const response = await fetch("/api/broll/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id
        }),
      });
      
      const data = await response.json();
      console.log("B-roll video generation response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate B-roll video");
      }
      
      setBrollVideoUrl(data.brollVideoUrl);
      setMessage("B-roll video created successfully!");
      
      // Refresh project data to get updated broll video URL
      fetchProject(project.id);
      
    } catch (err) {
      console.error("B-roll video generation error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setGeneratingBrollVideo(false);
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };
  
  const handleMergeVideos = async () => {
    if (!session?.user?.id || !project?.id || !videoOutput || !brollVideoUrl) {
      setError("You need both main video and B-roll video before merging");
      return;
    }

    setError(null);
    setMessage("Creating portrait video with B-roll background...");
    setMergingVideos(true);

    try {
      // Log request details for debugging
      console.log("Sending merge request with projectId:", project.id);
      console.log("Merge settings:", mergeSettings);
      console.log("Additional keywords:", additionalKeywords);

      const response = await fetch("/api/broll/video/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          personSize: mergeSettings.personSize,
          personPosition: mergeSettings.personPosition,
          additionalKeywords: additionalKeywords
        }),
      });
      
      // If response is not OK, try to get error details
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          // Handle JSON error response
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } else {
          // Handle non-JSON error response
          const errorText = await response.text();
          console.error("Non-JSON error response:", errorText);
          throw new Error(`Server error: ${response.status}`);
        }
      }
      
      // Parse JSON response
      const data = await response.json();
      console.log("Video merge response:", data);
      
      setMergedVideoUrl(data.mergedVideoUrl);
      setMessage("Portrait video created successfully!");
      
      // Refresh project data to get updated URL
      fetchProject(project.id);
      
    } catch (err) {
      console.error("Video merge error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setMergingVideos(false);
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };
  
  // Handle adding a new keyword
  const handleAddKeyword = () => {
    if (newKeyword.trim() !== "") {
      setAdditionalKeywords([...additionalKeywords, newKeyword.trim()]);
      setNewKeyword("");
      if (keywordInputRef.current) {
        keywordInputRef.current.focus();
      }
    }
  };
  
  // Handle removing a keyword
  const handleRemoveKeyword = (index: number) => {
    const updatedKeywords = [...additionalKeywords];
    updatedKeywords.splice(index, 1);
    setAdditionalKeywords(updatedKeywords);
  };
  
  // Handle Enter key in keyword input
  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  // Handle deleting resources (B-roll images, B-roll video, or merged video)
  const handleDeleteResource = async (resourceType: 'brollImages' | 'brollVideo' | 'mergedVideo') => {
    if (!project?.id) return;
    
    setDeletingResource(resourceType);
    
    try {
      const response = await fetch(`/api/project/${project.id}/resource`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resourceType
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }
      
      // Update local state based on what was deleted
      if (resourceType === 'brollImages') {
        setBrollImages([]);
      } else if (resourceType === 'brollVideo') {
        setBrollVideoUrl(null);
      } else if (resourceType === 'mergedVideo') {
        setMergedVideoUrl(null);
      }
      
      // Refresh project data
      fetchProject(project.id);
      
    } catch (err) {
      console.error("Delete resource error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setDeletingResource(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Only show B-roll section if we're on the create page, not in the projects gallery
  const showBrollSection = location.pathname.includes('/create');

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
          
          {/* Keywords display */}
          {project.keywords && project.keywords.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Keywords for B-roll:</p>
              <div className="flex flex-wrap gap-2">
                {project.keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
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

      {/* Main Video Section */}
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

      {/* B-roll Generation Section - only show on create page, not in projects */}
      {project && showBrollSection && (
        <div className="border border-gray-200 rounded-md p-4 mb-6">
          <h3 className="font-medium text-gray-700 mb-3">B-roll Generation</h3>
          
          {/* Additional Keywords UI */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Additional Keywords:</p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {additionalKeywords.map((keyword, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs flex items-center"
                >
                  {keyword}
                  <button 
                    onClick={() => handleRemoveKeyword(index)}
                    className="ml-1 text-indigo-600 hover:text-indigo-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              
              {additionalKeywords.length === 0 && (
                <span className="text-xs text-gray-500 italic">Add custom keywords to enhance B-roll generation</span>
              )}
            </div>
            
            <div className="flex">
              <input
                ref={keywordInputRef}
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Enter new keyword"
                className="flex-1 px-3 py-1 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                className={`px-3 py-1 rounded-r-md flex items-center ${
                  !newKeyword.trim() 
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* B-roll Images */}
          {brollImages.length > 0 ? (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Generated Images ({brollImages.length})</p>
                <button
                  onClick={() => handleDeleteResource('brollImages')}
                  disabled={deletingResource === 'brollImages'}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center"
                >
                  {deletingResource === 'brollImages' ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash className="h-3 w-3 mr-1" />
                  )}
                  Delete
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {brollImages.slice(0, 6).map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-100 rounded overflow-hidden">
                    <img src={image} alt={`B-roll ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-3">
              No B-roll images generated yet. Generate images from the keywords extracted from your script.
            </p>
          )}
          
          {/* B-roll Video */}
          {brollVideoUrl && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">B-roll Video</p>
                <button
                  onClick={() => handleDeleteResource('brollVideo')}
                  disabled={deletingResource === 'brollVideo'}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center"
                >
                  {deletingResource === 'brollVideo' ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash className="h-3 w-3 mr-1" />
                  )}
                  Delete
                </button>
              </div>
              <div className="aspect-video bg-black rounded-md overflow-hidden mb-3">
                <video 
                  src={brollVideoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Merge Settings */}
          {videoOutput && brollVideoUrl && !mergedVideoUrl && (
            <div className="mb-4 border border-gray-200 rounded-md p-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex justify-between items-center w-full font-medium text-gray-800"
              >
                <span className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Portrait Video Settings
                </span>
                {showSettings ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {showSettings && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Person Size: {Math.round(mergeSettings.personSize * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.2"
                      max="0.6"
                      step="0.05"
                      value={mergeSettings.personSize}
                      onChange={(e) => setMergeSettings({
                        ...mergeSettings,
                        personSize: parseFloat(e.target.value)
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Person Position
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['bottom_left', 'bottom', 'bottom_right'] as const).map((position) => (
                        <button
                          key={position}
                          onClick={() => setMergeSettings({
                            ...mergeSettings,
                            personPosition: position
                          })}
                          className={`p-2 border text-sm text-center rounded ${
                            mergeSettings.personPosition === position
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {position.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Merge Button - Show when both videos are available */}
          {videoOutput && brollVideoUrl && !mergedVideoUrl && (
            <button
              onClick={handleMergeVideos}
              disabled={mergingVideos}
              className={`w-full mb-3 py-2 px-4 rounded-md font-medium ${
                mergingVideos
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}
            >
              {mergingVideos ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating Portrait Video...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Copy className="h-4 w-4 mr-2" />
                  Create Portrait Video with B-roll Background
                </span>
              )}
            </button>
          )}
          
          {/* Merged Final Video */}
          {mergedVideoUrl && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-yellow-800">Final Portrait Video</h4>
                <button
                  onClick={() => handleDeleteResource('mergedVideo')}
                  disabled={deletingResource === 'mergedVideo'}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center"
                >
                  {deletingResource === 'mergedVideo' ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash className="h-3 w-3 mr-1" />
                  )}
                  Delete
                </button>
              </div>
              <div className="aspect-[9/16] bg-black rounded-md overflow-hidden mb-3 mx-auto max-w-xs">
                <video 
                  src={mergedVideoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                />
              </div>
              <a 
                href={mergedVideoUrl} 
                download 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Portrait Video
              </a>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGenerateBroll}
              disabled={!project || generatingBroll || (!project.keywords?.length && additionalKeywords.length === 0)}
              className={`py-2 px-4 rounded-md font-medium flex-1 ${
                !project || generatingBroll || (!project.keywords?.length && additionalKeywords.length === 0)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {generatingBroll ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Generating Images...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Generate B-roll Images
                </span>
              )}
            </button>
            
            <button
              onClick={handleGenerateBrollVideo}
              disabled={!project || generatingBrollVideo || brollImages.length === 0}
              className={`py-2 px-4 rounded-md font-medium flex-1 ${
                !project || generatingBrollVideo || brollImages.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {generatingBrollVideo ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating Video...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <VideoIcon className="h-4 w-4 mr-2" />
                  Create B-roll Video
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Generate Video Button - Main functionality */}
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