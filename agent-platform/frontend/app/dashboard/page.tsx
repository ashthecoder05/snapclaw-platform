"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Deployment {
  deployment_id: string;
  user_id: string;
  website_name: string;
  deployed_at: string;
  preview_url: string;
  status: string;
}

export default function Dashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      const response = await fetch("http://localhost:8000/deployments");
      const data = await response.json();
      setDeployments(data.deployments);
    } catch (error) {
      console.error("Failed to fetch deployments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeploymentDetails = async (deploymentId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/deployments/${deploymentId}`);
      const data = await response.json();
      setSelectedDeployment(data);
    } catch (error) {
      console.error("Failed to fetch deployment details:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Deployment Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your deployed websites</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Deployment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deployments List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Deployments ({deployments.length})
              </h2>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : deployments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No deployments</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new deployment.</p>
                  <button
                    onClick={() => router.push("/")}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Deployment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {deployments.map((deployment) => (
                    <div
                      key={deployment.deployment_id}
                      onClick={() => fetchDeploymentDetails(deployment.deployment_id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedDeployment?.deployment_id === deployment.deployment_id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{deployment.website_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: <code className="bg-gray-100 px-1 rounded">{deployment.deployment_id}</code>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            User: {deployment.user_id}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Deployed: {formatDate(deployment.deployed_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            deployment.status === "deployed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {deployment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deployment Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Deployment Details</h2>

              {selectedDeployment ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Website Name</label>
                    <p className="text-gray-900 font-semibold">{selectedDeployment.website_name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Deployment ID</label>
                    <p className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-2 rounded">
                      {selectedDeployment.deployment_id}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">User</label>
                    <p className="text-gray-900">{selectedDeployment.user_id}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {selectedDeployment.status}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Public IP</label>
                    <p className="text-gray-900 font-mono">{selectedDeployment.public_ip}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Deployed At</label>
                    <p className="text-gray-900">{formatDate(selectedDeployment.deployed_at)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">SSH Access</label>
                    <p className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded break-all">
                      {selectedDeployment.ssh_access}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <a
                      href={selectedDeployment.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Preview Website →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="mt-2 text-sm">Select a deployment to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deployments</p>
                <p className="text-2xl font-semibold text-gray-900">{deployments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Websites</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {deployments.filter(d => d.status === "deployed").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Deploy Time</p>
                <p className="text-2xl font-semibold text-gray-900">~20s</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Uptime</p>
                <p className="text-2xl font-semibold text-gray-900">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}