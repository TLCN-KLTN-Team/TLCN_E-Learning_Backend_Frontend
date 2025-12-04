package demo.app.chat_app.controller;

import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.service.impl.SectionServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/sections")
public class SectionController {
    private final SectionServiceImpl sectionService;

    @GetMapping("/{workspaceId}")
    public ApiResponse<?> getSectionsByWorkspaceId(@PathVariable String workspaceId) {
        return ApiResponse.builder()
                .result(sectionService.getSectionsByWorkspaceId(workspaceId))
                .message("Sections retrieved successfully")
                .build();
    }

}
