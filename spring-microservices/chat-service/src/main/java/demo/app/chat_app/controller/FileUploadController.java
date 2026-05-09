package demo.app.chat_app.controller;

import demo.app.chat_app.dto.event.MessageEvent;
import demo.app.chat_app.dto.event.MessageUpdatePayload;
import demo.app.chat_app.dto.response.ApiResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.service.impl.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {
    private final FileUploadService fileUploadService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Post-attach upload: upload files and attach them to an existing message.
     * 
     * Flow:
     * 1. Frontend sends text message via WebSocket (gets clientMessageId)
     * 2. Frontend calls this endpoint with clientMessageId to attach files
     * 3. This endpoint uploads files, updates the message, and broadcasts MESSAGE_UPDATED
     */
    @PostMapping("/upload-multiple")
    public ApiResponse<MessageUpdatePayload> uploadMultipleFilesToMessage(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("channelId") String channelId,
            @RequestParam("clientMessageId") String clientMessageId,
            @RequestParam(value = "category", required = false) AttachmentCategory category,
            Principal principal) {
        try {
            log.info("Post-attach upload: channelId={}, clientMessageId={}, fileCount={}, category={}",
                    channelId, clientMessageId, files.length, category);

            MessageUpdatePayload payload = fileUploadService.uploadAndAttachFiles(
                files, channelId, clientMessageId, category, principal
            );

            // Broadcast MESSAGE_UPDATED event to channel subscribers
            MessageEvent event = MessageEvent.messageUpdated(payload);
            messagingTemplate.convertAndSend(
                "/topic/channel/" + channelId + "/attachment-updates",
                event
            );

            log.info("MESSAGE_UPDATED event broadcast for clientMessageId: {}", clientMessageId);

            return ApiResponse.<MessageUpdatePayload>builder()
                    .result(payload)
                    .message("Files uploaded and attached successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error uploading files for clientMessageId {}: {}", clientMessageId, e.getMessage());
            throw e;
        }
    }

    /**
     * File-only upload: create a new message with only file attachments (no text content).
     * 
     * Flow:
     * 1. Frontend has files but no text content
     * 2. Frontend calls this endpoint directly (no prior WebSocket message needed)
     * 3. This endpoint creates a new ChatMessage, uploads files, attaches them,
     *    and broadcasts NEW_MESSAGE event via WebSocket
     * 
     * @param files       The files to upload
     * @param channelId   The channel to send the message to
     * @param clientMessageId  UUID from frontend for optimistic UI tracking
     * @param principal   The authenticated user
     */
    @PostMapping("/upload-file-only")
    public ApiResponse<ChatMessageResponse> uploadFileOnlyMessage(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("channelId") String channelId,
            @RequestParam("clientMessageId") String clientMessageId,
            @RequestParam(value = "category", required = false) AttachmentCategory category,
            Principal principal) {
        try {
            log.info("File-only upload: channelId={}, clientMessageId={}, fileCount={}, category={}",
                    channelId, clientMessageId, files.length, category);

            ChatMessageResponse response = fileUploadService.createFileOnlyMessage(
                files, channelId, clientMessageId, category, principal
            );

            // Broadcast NEW_MESSAGE event to channel subscribers
            MessageEvent event = MessageEvent.newMessage(response);
            messagingTemplate.convertAndSend(
                "/topic/channel/" + channelId,
                event
            );

            log.info("NEW_MESSAGE (file-only) broadcast for clientMessageId: {}", clientMessageId);

            return ApiResponse.<ChatMessageResponse>builder()
                    .result(response)
                    .message("File-only message sent successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error creating file-only message for clientMessageId {}: {}",
                    clientMessageId, e.getMessage());
            throw e;
        }
    }

    /**
     * Legacy upload: upload files as separate messages (no clientMessageId).
     * Kept for backward compatibility.
     */
    @PostMapping("/upload-multiple-legacy")
    public ApiResponse<List<ChatMessageResponse>> uploadMultipleFilesLegacy(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("channelId") String channelId,
            Principal principal) {
        try {
            List<ChatMessageResponse> responses = fileUploadService.uploadMultipleFilesToMessage(
                files, channelId, principal
            );

            return ApiResponse.<List<ChatMessageResponse>>builder()
                    .result(responses)
                    .message("Files upload completed")
                    .build();

        } catch (Exception e) {
            log.error("Error uploading files (legacy): {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Get upload progress for a specific message
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
