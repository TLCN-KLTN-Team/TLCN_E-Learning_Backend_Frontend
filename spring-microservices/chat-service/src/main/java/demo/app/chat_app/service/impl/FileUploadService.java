package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.event.MessageUpdatePayload;
import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.enums.AttachmentCategory;
import demo.app.chat_app.model.enums.AttachmentType;
import demo.app.chat_app.model.enums.MessageStatus;
import demo.app.chat_app.model.enums.MessageType;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChatMessage;
import demo.app.chat_app.model.workspace.MessageAttachment;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.MessageAttachmentRepository;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.ChatMessageService;
import demo.app.chat_app.service.util.ChannelPhase;
import demo.app.chat_app.service.util.ChatMessageUtils;
import demo.app.chat_app.service.util.CloudinaryService;
import demo.app.chat_app.utils.FileUtils;
import demo.app.chat_app.websocket.WebSocketAuthInterceptor;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileUploadService {
    MessageAttachmentRepository messageAttachmentRepository;
    CloudinaryService cloudinaryService;
    FileUtils fileUtils;
    ChatMessageService chatMessageService;
    ChannelRepository channelRepository;
    ChatMessageMapper chatMessageMapper;
    ChatMessageUtils chatMessageUtils;
    GetUserClient getUserClient;

    // Track upload status for messages
    ConcurrentHashMap<String, String> uploadStatusMap = new ConcurrentHashMap<>();
    ChatMessageRepository chatMessageRepository;

    public boolean softDeleteFile(String fileId) {
        // Logic to soft delete a file by marking it as inactive
        return messageAttachmentRepository.findById(fileId)
                .map(attachment -> {
                    attachment.setActive(false);
                    messageAttachmentRepository.save(attachment);
                    return true;
                })
                .orElse(false);
    }

    // ======== FILE-ONLY MESSAGE ========

    /**
     * Create a new message with file attachments only (no text content).
     * Unlike uploadAndAttachFiles, this doesn't require a prior WebSocket message.
     * 
     * Flow:
     * 1. Create a new ChatMessage with FILE_ONLY type and PENDING status
     * 2. Upload each file to Cloudinary in parallel
     * 3. Create & save MessageAttachment documents
     * 4. Update ChatMessage: push attachments, set status=SENT
     * 5. Return full ChatMessageResponse for WebSocket broadcast as NEW_MESSAGE
     */
    public ChatMessageResponse createFileOnlyMessage(MultipartFile[] files,
                                                      String channelId,
                                                      String clientMessageId,
                                                      AttachmentCategory category,
                                                      Principal principal) {
        // Validate channel
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // UC-41: chặn upload khi channel đã qua phase OPEN (member không upload thêm được)
        ChannelPhase.assertOpenForMember(channel);
        AttachmentCategory effectiveCategory = category != null ? category : AttachmentCategory.GENERAL;

        String userId = principal.getName();
        String authToken = getAuthTokenFromContext();

        // Create a new ChatMessage placeholder with PENDING status
        ChatMessage chatMessage = ChatMessage.builder()
                .clientMessageId(clientMessageId)
                .sender(userId)
                .channelId(channelId)
                .content(null) // No text content for file-only messages
                .messageType(MessageType.FILE_ONLY)
                .status(MessageStatus.PENDING)
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        chatMessage = chatMessageRepository.save(chatMessage);
        log.info("File-only message placeholder created with ID: {} and clientMessageId: {}",
                chatMessage.getId(), clientMessageId);

        // Track upload status
        uploadStatusMap.put(chatMessage.getId(), "UPLOADING");

        try {
            // Upload files in parallel
            final String messageId = chatMessage.getId();
            List<CompletableFuture<MessageAttachment>> futures = Arrays.stream(files)
                    .map(file -> CompletableFuture.supplyAsync(() ->
                            uploadSingleFile(file, messageId, channelId, effectiveCategory, authToken)))
                    .toList();

            // Wait for all uploads to complete
            List<MessageAttachment> uploadedAttachments = futures.stream()
                    .map(CompletableFuture::join)
                    .toList();

            // Save all attachments to the attachment collection
            List<MessageAttachment> savedAttachments = messageAttachmentRepository.saveAll(uploadedAttachments);

            // Update ChatMessage with attachments and mark as SENT
            chatMessage.setAttachments(new ArrayList<>(savedAttachments));
            chatMessage.setStatus(MessageStatus.SENT);
            chatMessage.setUpdatedDate(Instant.now());
            chatMessageRepository.save(chatMessage);

            // Update status
            uploadStatusMap.put(chatMessage.getId(), "COMPLETED");

            log.info("File-only message completed: messageId={}, attachmentCount={}",
                    chatMessage.getId(), savedAttachments.size());

            return toChatMessageResponse(chatMessage, userId);

        } catch (Exception e) {
            // Mark message as FAILED on error
            chatMessage.setStatus(MessageStatus.FAILED);
            chatMessage.setUpdatedDate(Instant.now());
            chatMessageRepository.save(chatMessage);
            uploadStatusMap.put(chatMessage.getId(), "FAILED");

            log.error("Failed to create file-only message for clientMessageId: {}", clientMessageId, e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        } finally {
            // Clean up status after a delay
            final String msgId = chatMessage.getId();
            CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(60_000);
                    uploadStatusMap.remove(msgId);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            });
        }
    }

    // ======== POST-ATTACH PATTERN ========

    /**
     * Upload multiple files and attach them to an existing message (identified by clientMessageId).
     * 
     * Flow:
     * 1. Find the ChatMessage by clientMessageId
     * 2. Upload each file to Cloudinary in parallel
     * 3. Create & save MessageAttachment documents
     * 4. Update ChatMessage: push attachments, set status=SENT, determine messageType
     * 5. Return MessageUpdatePayload for WebSocket broadcast
     */
    public MessageUpdatePayload uploadAndAttachFiles(MultipartFile[] files,
                                                      String channelId,
                                                      String clientMessageId,
                                                      AttachmentCategory category,
                                                      Principal principal) {
        // Validate channel
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // UC-41: chặn upload khi channel đã qua phase OPEN
        ChannelPhase.assertOpenForMember(channel);
        AttachmentCategory effectiveCategory = category != null ? category : AttachmentCategory.GENERAL;

        String userId = principal.getName();

        // Find existing message by clientMessageId
        ChatMessage chatMessage = chatMessageRepository.findByClientMessageId(clientMessageId)
                .orElseThrow(() -> {
                    log.error("Message not found for clientMessageId: {}", clientMessageId);
                    return new AppException(ErrorCode.MESSAGE_NOT_FOUND);
                });

        // Verify the message belongs to the correct channel
        if (!chatMessage.getChannelId().equals(channelId)) {
            log.error("Channel mismatch: message channelId={}, request channelId={}",
                    chatMessage.getChannelId(), channelId);
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String authToken = getAuthTokenFromContext();

        // Update status to UPLOADING
        uploadStatusMap.put(chatMessage.getId(), "UPLOADING");

        try {
            // Upload files in parallel
            List<CompletableFuture<MessageAttachment>> futures = Arrays.stream(files)
                    .map(file -> CompletableFuture.supplyAsync(() ->
                            uploadSingleFile(file, chatMessage.getId(), channelId, effectiveCategory, authToken)))
                    .toList();

            // Wait for all uploads to complete
            List<MessageAttachment> uploadedAttachments = futures.stream()
                    .map(CompletableFuture::join)
                    .toList();

            // Save all attachments to the attachment collection
            List<MessageAttachment> savedAttachments = messageAttachmentRepository.saveAll(uploadedAttachments);

            // Update ChatMessage: push attachments, set status and type
            List<MessageAttachment> existingAttachments = chatMessage.getAttachments();
            if (existingAttachments == null) {
                existingAttachments = new ArrayList<>();
            }
            existingAttachments.addAll(savedAttachments);
            chatMessage.setAttachments(existingAttachments);

            // Determine message type
            boolean hasContent = StringUtils.hasText(chatMessage.getContent());
            chatMessage.setMessageType(hasContent ? MessageType.MIXED : MessageType.FILE_ONLY);
            chatMessage.setStatus(MessageStatus.SENT);
            chatMessage.setUpdatedDate(Instant.now());

            chatMessageRepository.save(chatMessage);

            // Update status
            uploadStatusMap.put(chatMessage.getId(), "COMPLETED");

            // Build response
            List<AttachmentResponse> attachmentResponses = chatMessageMapper.toAttachmentResponseList(savedAttachments);

            return MessageUpdatePayload.builder()
                    .clientMessageId(clientMessageId)
                    .messageId(chatMessage.getId())
                    .status(MessageStatus.SENT)
                    .messageType(chatMessage.getMessageType())
                    .attachments(attachmentResponses)
                    .build();

        } catch (Exception e) {
            // Mark message as FAILED on error
            chatMessage.setStatus(MessageStatus.FAILED);
            chatMessage.setUpdatedDate(Instant.now());
            chatMessageRepository.save(chatMessage);
            uploadStatusMap.put(chatMessage.getId(), "FAILED");

            log.error("Failed to upload and attach files for clientMessageId: {}", clientMessageId, e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        } finally {
            // Clean up status after a delay (could use scheduled task)
            CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(60_000); // Keep status for 1 minute
                    uploadStatusMap.remove(chatMessage.getId());
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            });
        }
    }

    /**
     * Legacy upload method: creates a new message per file (kept for backward compatibility).
     */
    public List<ChatMessageResponse> uploadMultipleFilesToMessage(MultipartFile[] files,
                                                                  String channelId,
                                                                  Principal principal) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // UC-41: chặn upload khi channel đã qua phase OPEN
        ChannelPhase.assertOpenForMember(channel);

        String userId = principal.getName();
        String authToken = getAuthTokenFromContext();

        List<CompletableFuture<ChatMessageResponse>> futures = Arrays.stream(files)
                .map((file) -> CompletableFuture.supplyAsync(() -> uploadSingleFileAsLegacyMessage(
                        file, channelId, userId, authToken
                ))).toList();

        return futures.stream()
                .map(CompletableFuture::join)
                .toList();
    }

    /**
     * Upload a single file and create a MessageAttachment (without creating a new ChatMessage).
     */
    private MessageAttachment uploadSingleFile(MultipartFile file, String messageId,
                                                String channelId, AttachmentCategory category, String authToken) {
        try {
            if (StringUtils.hasText(authToken)) {
                WebSocketAuthInterceptor.setToken(authToken);
            }

            if (!fileUtils.validateFile(file)) {
                throw new AppException(ErrorCode.FILE_EMPTY);
            }

            AttachmentType attachmentType = fileUtils.getAttachmentType(file.getOriginalFilename());
            String fileUrl = cloudinaryService.uploadFile(file, attachmentType);

            return MessageAttachment.builder()
                    .messageId(messageId)
                    .channelId(channelId)
                    .fileName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .fileUrl(fileUrl)
                    .attachmentType(attachmentType)
                    .category(category)
                    .uploadedAt(Instant.now())
                    .build();

        } catch (Exception e) {
            log.error("Error uploading file {}: {}", file.getOriginalFilename(), e.getMessage());
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        } finally {
            WebSocketAuthInterceptor.clearToken();
        }
    }

    /**
     * Legacy: upload a single file and create a new ChatMessage for it.
     */
    private ChatMessageResponse uploadSingleFileAsLegacyMessage(MultipartFile file,
                                                                 String channelId,
                                                                 String sender,
                                                                 String authToken) {
        try {
            if (StringUtils.hasText(authToken)) {
                WebSocketAuthInterceptor.setToken(authToken);
            }

            if (!fileUtils.validateFile(file)) {
                return ChatMessageResponse.builder()
                        .uploadedFiles(false)
                        .content("File invalid")
                        .build();
            }

            try {
                AttachmentType attachmentType = fileUtils.getAttachmentType(file.getOriginalFilename());

                MessageAttachment attachment = MessageAttachment.builder()
                        .fileName(file.getOriginalFilename())
                        .contentType(file.getContentType())
                        .fileSize(file.getSize())
                        .fileUrl(cloudinaryService.uploadFile(file, attachmentType))
                        .uploadedAt(Instant.now())
                        .build();

                ChatMessage chatMessage = ChatMessage.builder()
                        .content(file.getOriginalFilename())
                        .channelId(channelId)
                        .sender(sender)
                        .createdDate(Instant.now())
                        .updatedDate(Instant.now())
                        .build();

                chatMessage = chatMessageRepository.save(chatMessage);
                return this.toChatMessageResponse(chatMessage, sender);
            } catch (AppException e) {
                log.error("Error uploading file {}: {}", file.getOriginalFilename(), e.getMessage());
                throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.SEND_MESSAGE_FAILED);
        } finally {
            WebSocketAuthInterceptor.clearToken();
        }
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        boolean isMe = chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());
        chatMessageResponse.setClientMessageId(chatMessage.getClientMessageId());
        chatMessageResponse.setStatus(chatMessage.getStatus());
        chatMessageResponse.setChannelId(chatMessage.getChannelId());

        // Map attachments
        if (chatMessage.getAttachments() != null && !chatMessage.getAttachments().isEmpty()) {
            chatMessageResponse.setAttachments(
                    chatMessageMapper.toAttachmentResponseList(chatMessage.getAttachments())
            );
        } else {
            chatMessageResponse.setAttachments(Collections.emptyList());
        }

        log.info("Mapping chat message to response for messageId: {}, isMe: {}", chatMessage.getId(), isMe);

        try {
            UserResponse senderProfile = getUserClient.getUser(chatMessage.getSender()).getResult();
            chatMessageResponse.setSender(senderProfile);
        } catch (Exception e) {
            throw new AppException(ErrorCode.GET_USER_PROFILE_FAILED);
        }

        return chatMessageResponse;
    }

    /**
     * Get upload status for a message
     */
    public String getUploadStatus(String messageId) {
        return uploadStatusMap.getOrDefault(messageId, "UNKNOWN");
    }

    /**
     * Clear upload status after completion
     */
    public void clearUploadStatus(String messageId) {
        uploadStatusMap.remove(messageId);
    }

    /**
     * Get auth token from HTTP request context or WebSocket ThreadLocal
     */
    private String getAuthTokenFromContext() {
        String authToken = WebSocketAuthInterceptor.getToken();
        
        if (!StringUtils.hasText(authToken)) {
            ServletRequestAttributes servletRequestAttributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            
            if (servletRequestAttributes != null && servletRequestAttributes.getRequest() != null) {
                authToken = servletRequestAttributes.getRequest().getHeader("Authorization");
                log.debug("Token retrieved from HTTP request context");
            }
        } else {
            log.debug("Token retrieved from WebSocket ThreadLocal");
        }
        
        return authToken;
    }
}
