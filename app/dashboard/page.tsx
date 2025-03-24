// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Clock, CheckCircle, XCircle, Video, FileText, Trash, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Project {
  id: number;
  title: string;
  status: string;
  outputUrl: string | null;
  createdAt: string;
}

interface UserInfo {
  videoUrl: string | null;
  voice_id: string | null;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    videoUrl: null,
    voice_id: null,
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch projects and user info
    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          // Fetch projects
          const projectsResponse = await fetch("/api/projects");
          const projectsData = await projectsResponse.json();
          
          if (projectsData.success) {
            setProjects(projectsData.projects);
          }
          
          // Check user setup status
          const userResponse = await fetch("/api/user");
          const userData = await userResponse.json();
          
          if (userData.success) {
            setUserInfo({
              videoUrl: userData.videoUrl,
              voice_id: userData.voice_id,
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
  }, [status]);

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Remove project from state
        setProjects(projects.filter(project => project.id !== projectId));
      } else {
        const errorData = await response.json();
        console.error("Error deleting project:", errorData.error);
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("An error occurred while deleting the project");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "PROCESSING":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            {getStatusIcon(status)}
            <span className="ml-1.5">Completed</span>
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {getStatusIcon(status)}
            <span className="ml-1.5">Processing</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            {getStatusIcon(status)}
            <span className="ml-1.5">Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {getStatusIcon(status)}
            <span className="ml-1.5">{status}</span>
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
        <Link 
          href="/create" 
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Create New Video
        </Link>
      </div>
      
      {/* Setup Progress */}
      <div className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-5 text-gray-800 flex items-center">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
          Setup Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-5 rounded-lg transition-all duration-300 ${userInfo.videoUrl 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-emerald-200' 
            : 'bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-md'}`}>
            <div className="flex items-center mb-3">
              <div className={`p-2 rounded-full ${userInfo.videoUrl ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                <Video className={`h-5 w-5 ${userInfo.videoUrl ? 'text-emerald-600' : 'text-indigo-600'}`} />
              </div>
              <h3 className="font-medium ml-3 text-gray-800">Upload Video Avatar</h3>
              {userInfo.videoUrl && <CheckCircle className="h-5 w-5 text-emerald-500 ml-auto" />}
            </div>
            <p className="text-sm text-gray-600 mb-4 ml-11">
              {userInfo.videoUrl 
                ? "You've successfully uploaded your video avatar!" 
                : "Upload a short video clip to create your personalized digital avatar."}
            </p>
            <div className="ml-11">
              <Link 
                href="/upload" 
                className={`text-sm px-4 py-2 rounded-md inline-flex items-center transition-colors ${userInfo.videoUrl 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
              >
                {userInfo.videoUrl ? "Change Video" : "Upload Now"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
          
          <div className={`p-5 rounded-lg transition-all duration-300 ${userInfo.voice_id 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-emerald-200' 
            : 'bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-md'}`}>
            <div className="flex items-center mb-3">
              <div className={`p-2 rounded-full ${userInfo.voice_id ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                <FileText className={`h-5 w-5 ${userInfo.voice_id ? 'text-emerald-600' : 'text-indigo-600'}`} />
              </div>
              <h3 className="font-medium ml-3 text-gray-800">Voice Model Training</h3>
              {userInfo.voice_id && <CheckCircle className="h-5 w-5 text-emerald-500 ml-auto" />}
            </div>
            <p className="text-sm text-gray-600 mb-4 ml-11">
              {userInfo.voice_id 
                ? "Your voice model has been successfully trained!" 
                : "Record sample audio to create your custom voice model for synthetic speech generation."}
            </p>
            <div className="ml-11">
              <Link 
                href="/voice" 
                className={`text-sm px-4 py-2 rounded-md inline-flex items-center transition-colors ${userInfo.voice_id 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
              >
                {userInfo.voice_id ? "Update Voice" : "Train Voice"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Projects Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
            Your Projects
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading your projects...</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
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
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center transition-colors"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <button
                          className="text-rose-600 hover:text-rose-900 flex items-center transition-colors"
                          onClick={() => handleDeleteProject(project.id)}
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
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Create your first video project to get started with your digital avatar.</p>
            <Link
              href="/create"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Your First Video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}