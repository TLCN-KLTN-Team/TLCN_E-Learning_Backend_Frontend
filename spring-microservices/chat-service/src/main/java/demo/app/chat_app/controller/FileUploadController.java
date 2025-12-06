package demo.app.chat_app.controller;

import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.AttachmentUploadResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.service.impl.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {
    private final FileUploadService fileUploadService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Upload multiple files in parallel to existing message
     * Each file is processed independently
     */
    @PostMapping("/upload-multiple")
    public ApiResponse<List<ChatMessageResponse>> uploadMultipleFilesToMessage(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("channelId") String channelId,
            Principal principal) {
        try {
            List<ChatMessageResponse> responses = fileUploadService.uploadMultipleFilesToMessage(
                files, channelId, principal
            );

            // Notify about each upload completion
            CompletableFuture.runAsync(() -> {
                responses.forEach(response -> {
                    try {
                        messagingTemplate.convertAndSend(
                            "/topic/channel/" + channelId + "/attachments",
                            response
                        );
                    } catch (Exception e) {
                        log.error("Failed to notify attachment upload", e);
                    }
                });
            });

            return ApiResponse.<List<ChatMessageResponse>>builder()
                    .result(responses)
                    .message("Files upload completed")
                    .build();

        } catch (Exception e) {
            log.error("Error uploading files to message {}", e);
            throw e;
        }
    }

    /**
     * Get upload progress for a specific message
     * This can be used to track upload status
     */
    @GetMapping("/upload-status/{messageId}")
    public ApiResponse<String> getUploadStatus(
            @PathVariable String messageId,
            Principal principal) {
        
        try {
            String status = fileUploadService.getUploadStatus(messageId);
            return ApiResponse.<String>builder()
                    .result(status)
                    .message("Upload status retrieved")
                    .build();
        } catch (Exception e) {
            log.error("Error getting upload status for message {}", messageId, e);
            throw e;
        }
    }
}
