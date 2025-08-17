package demo.app.chat_app.controller;

import demo.app.chat_app.dto.request.WorkspaceCreationRequest;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.PageResponse;
import demo.app.chat_app.dto.response.WorkspaceResponse;
import demo.app.chat_app.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {
    private final WorkspaceService workspaceService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(@RequestBody WorkspaceCreationRequest request) {

        ApiResponse<WorkspaceResponse> response = ApiResponse.<WorkspaceResponse>builder()
                .result(workspaceService.createWorkspace(request))
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkspaceById(@PathVariable String id) {
        ApiResponse<WorkspaceResponse> response = ApiResponse.<WorkspaceResponse>builder()
                .result(workspaceService.getWorkspaceById(id))
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<?> getWorkspaces(@RequestParam(value = "page", defaultValue = "0") int page,
                                           @RequestParam(value = "size", defaultValue = "5") int size) {
        ApiResponse<PageResponse<WorkspaceResponse>> response = ApiResponse.<PageResponse<WorkspaceResponse>>builder()
                .result(workspaceService.getWorkspaces(page, size))
                .build();

        return ResponseEntity.ok(response);
    }
}
