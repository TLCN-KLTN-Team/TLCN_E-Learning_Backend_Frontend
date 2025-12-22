"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Trash2,
  AlertCircle,
  Loader2,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useSelectedClass } from "@/context/teacher/SelectedClassContext";

interface ClassWorkspace {
  id: number;
  classId: string;
  className: string;
  workspaceName: string;
  description: string;
  createdAt: string;
  participantCount: number;
  status: "active" | "inactive";
}

interface ClassWorkspaceManagerProps {
  courseId: string;
}

const ClassWorkspaceManager: React.FC<ClassWorkspaceManagerProps> = ({
  courseId,
}) => {
  const { selectedClass } = useSelectedClass();
  const [workspaces, setWorkspaces] = useState<ClassWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    workspaceName: "",
    description: "",
  });

  useEffect(() => {
    if (!selectedClass) {
      setLoading(false);
      return;
    }
    // TODO: Fetch workspaces từ API với classId
    // const fetchWorkspaces = async () => {
    //   const data = await getClassWorkspaces(courseId, selectedClass.id)
    //   setWorkspaces(data)
    // }
    // fetchWorkspaces()
    setLoading(false);
  }, [courseId, selectedClass]);

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Workspace Lớp</h2>
          <p className="text-gray-600">
            Quản lý không gian cho lớp học, hỗ trợ học viên tương tác
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">Vui lòng chọn một lớp học</p>
            <p className="text-sm text-gray-500 mb-4">
              Đi tới Quản Lý Lớp Học để chọn một lớp trước khi quản lý
              workspace.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowRight className="h-4 w-4" />
              Quản Lý Lớp Học <ArrowRight className="h-4 w-4" /> Chọn Lớp
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.workspaceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddWorkspace = async () => {
    if (!newWorkspace.workspaceName) return;
    // TODO: Create workspace via API với classId
    console.log("Creating workspace:", {
      ...newWorkspace,
      classId: selectedClass.id,
    });
    setNewWorkspace({ workspaceName: "", description: "" });
    setShowAddForm(false);
  };

  const handleDeleteWorkspace = async (workspaceId: number) => {
    // TODO: Delete workspace via API
    console.log("Deleting workspace:", workspaceId);
    setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Workspace Lớp</h2>
        <p className="text-gray-600">
          Lớp:{" "}
          <span className="font-semibold text-gray-900">
            {selectedClass.className}
          </span>
        </p>
      </div>

      {/* Add New Workspace */}
      {!showAddForm ? (
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo Workspace Mới
        </Button>
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tên Workspace
              </label>
              <Input
                placeholder="VD: Workspace Lớp A1"
                value={newWorkspace.workspaceName}
                onChange={(e) =>
                  setNewWorkspace({
                    ...newWorkspace,
                    workspaceName: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mô Tả (Tùy Chọn)
              </label>
              <textarea
                placeholder="Nhập mô tả workspace..."
                value={newWorkspace.description}
                onChange={(e) =>
                  setNewWorkspace({
                    ...newWorkspace,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddWorkspace}>Tạo Workspace</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm workspace..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Workspaces List */}
      <div className="grid gap-4">
        {filteredWorkspaces.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Không có workspace nào</p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkspaces.map((ws) => (
            <Card key={ws.id} className="hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {ws.workspaceName}
                      </h3>
                      <Badge
                        className={
                          ws.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {ws.status === "active"
                          ? "Hoạt Động"
                          : "Không Hoạt Động"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <p className="font-medium">Số Thành Viên</p>
                        <p>{ws.participantCount} người</p>
                      </div>
                      <div>
                        <p className="font-medium">Tạo Vào</p>
                        <p>
                          {new Date(ws.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    {ws.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {ws.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWorkspace(ws.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassWorkspaceManager;
