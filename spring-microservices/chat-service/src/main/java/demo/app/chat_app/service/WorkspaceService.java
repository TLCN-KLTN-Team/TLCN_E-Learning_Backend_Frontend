package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.CreateWorkspacesRequest;
import demo.app.chat_app.dto.request.WorkspaceCreationRequest;
import demo.app.chat_app.dto.response.PageResponse;
import demo.app.chat_app.dto.response.WorkspaceResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface WorkspaceService {
    WorkspaceResponse createWorkspace(WorkspaceCreationRequest request);
    WorkspaceResponse updateWorkspace(WorkspaceCreationRequest request);
    void deleteWorkspace(String id);
    PageResponse<WorkspaceResponse> getWorkspacesWhenUserAccess(int page, int size);
    WorkspaceResponse getWorkspaceById(String id);

    List<WorkspaceResponse> getWorkspacesByUser(int page, int size);
}
