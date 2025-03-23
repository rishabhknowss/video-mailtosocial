// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Clock, CheckCircle, XCircle, Video, FileText, Trash } from "lucide-react";
import Link from "next/link";

interface Project {
  id: number;
  title: string;
  status: string;
  outputUrl: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    hasVideo: false,
    hasVoice: false,
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch projects and user info
    if (session) {
      const fetchData = async () => {
        try {
          // This would be replaced with actual API calls
          const response = await fetch("/api/projects");
          const data = await response.json();
          
          if (data.success) {
            setProjects(data.projects);
          }
          
          // Check user setup status
          const userResponse = await fetch("/api/user");
          const userData = await userResponse.json();
          
          if (userData.success) {
            setUserInfo({
              hasVideo: !!userData.videoUrl,
              hasVoice: !!userData.voice_id,
            });
          }
          
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [session]);

  // For demo purposes only - replace with actual data
  const demoProjects = [
    {
      id: 1,
      title: "Welcome Video",
      status: "COMPLETED",
      outputUrl: "https://example.com/video1.mp4",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Product Demo",
      status: "PROCESSING",
      outputUrl: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      title: "Tutorial Introduction",
      status: "DRAFT",
      outputUrl: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "PROCESSING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Setup Progress */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Setup Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 border rounded-md ${userInfo.hasVideo ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
            <div className="flex items-center mb-2">
              <Video className={`h-5 w-5 mr-2 ${userInfo.hasVideo ? 'text-green-500' : 'text-gray-500'}`} />
              <h3 className="font-medium">Upload Video</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {userInfo.hasVideo 
                ? "You've uploaded your video avatar!" 
                : "Upload a short video to create your digital avatar."}
            </p>
            <Link 
              href="/upload" 
              className={`text-sm px-3 py-1 rounded-md inline-block ${userInfo.hasVideo 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              {userInfo.hasVideo ? "Change Video" : "Upload Now"}
            </Link>
          </div>
          
          <div className={`p-4 border rounded-md ${userInfo.hasVoice ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
            <div className="flex items-center mb-2">
              <FileText className={`h-5 w-5 mr-2 ${userInfo.hasVoice ? 'text-green-500' : 'text-gray-500'}`} />
              <h3 className="font-medium">Train Voice Model</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {userInfo.hasVoice 
                ? "Your voice has been trained!" 
                : "Record your voice to create a custom voice model."}
            </p>
            <Link 
              href="/voice" 
              className={`text-sm px-3 py-1 rounded-md inline-block ${userInfo.hasVoice 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              {userInfo.hasVoice ? "Update Voice" : "Train Voice"}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Projects Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link 
            href="/create" 
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Create New
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your projects...</p>
          </div>
        ) : demoProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {demoProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(project.status)}
                        <span className="ml-2 text-sm text-gray-700">{project.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {project.status === "COMPLETED" && (
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        )}
                        <button
                          className="text-red-600 hover:text-red-900 flex items-center"
                          onClick={() => {
                            // Delete project logic
                            confirm("Are you sure you want to delete this project?");
                          }}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You don't have any projects yet.</p>
            <Link
              href="/create"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Create Your First Video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}