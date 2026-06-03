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
import demo.app.chat_app.model.workspace.ChannelMember;
import demo.app.chat_app.model.workspace.ChannelRole;
import demo.app.chat_app.model.workspace.ChatMessage;
import demo.app.chat_app.model.workspace.MessageAttachment;
import demo.app.chat_app.model.workspace.AssignmentSession;
import demo.app.chat_app.repository.AssignmentSessionRepository;
import demo.app.chat_app.repository.ChannelMemberRepository;
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
    AssignmentSessionRepository assignmentSessionRepository;
    CloudinaryService cloudinaryService;
    FileUtils fileUtils;
    ChatMessageService chatMessageService;
    ChannelRepository channelRepository;
    ChannelMemberRepository channelMemberRepository;
    ChatMessageMapper chatMessageMapper;
    ChatMessageUtils chatMessageUtils;
    GetUserClient getUserClient;

    // Track upload status for messages
    ConcurrentHashMap<String, String> uploadStatusMap = new ConcurrentHashMap<>();
    ChatMessageRepository chatMessageRepository;

    public boolean softDeleteFile(String fileId) {
        return messageAttachmentRepository.findById(fileId)
                .map(attachment -> {
                    attachment.setActive(false);
                    messageAttachmentRepository.save(attachment);
                    return true;
                })
                .orElse(false);
    }

    // ======== FILE-ONLY MESSAGE ========

    public ChatMessageResponse createFileOnlyMessage(MultipartFile[] files,
                                                      String channelId,
                                                      String clientMessageId,
                                                      AttachmentCategory category,
                                                      Principal principal) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        ChannelPhase.assertOpenForMember(channel);
        AttachmentCategory effectiveCategory = category != null ? category : AttachmentCategory.GENERAL;

        String userId = principal.getName();
        String authToken = getAuthTokenFromContext();

        ChatMessage chatMessage = ChatMessage.builder()
                .clientMessageId(clientMessageId)
                .sender(userId)
                .channelId(channelId)
                .content(null)
                .messageType(MessageType.FILE_ONLY)
                .status(MessageStatus.PENDING)
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        chatMessage = chatMessageRepository.save(chatMessage);
        log.info("File-only message placeholder created with ID: {} and clientMessageId: {}",
                chatMessage.getId(), clientMessageId);

        uploadStatusMap.put(chatMessage.getId(), "UPLOADING");

        try {
            final String messageId = chatMessage.getId();
            List<CompletableFuture<MessageAttachment>> futures = Arrays.stream(files)
                    .map(file -> CompletableFuture.supplyAsync(() ->
                            uploadSingleFile(file, messageId, channelId, effectiveCategory, authToken)))
                    .toList();

            List<MessageAttachment> uploadedAttachments = futures.stream()
                    .map(CompletableFuture::join)
                    .toList();

            List<MessageAttachment> savedAttachments = messageAttachmentRepository.saveAll(uploadedAttachments);

            chatMessage.setStatus(MessageStatus.SENT);
            chatMessage.setUpdatedDate(Instant.now());
            chatMessageRepository.save(chatMessage);

            // UC-41: track SUBMISSION messageId trong AssignmentSession
            if (effectiveCategory == AttachmentCategory.SUBMISSION && channel.getAssignmentSessionId() != null) {
                trackSubmissionInSession(channel.getAssignmentSessionId(), chatMessage.getId());
            }

            uploadStatusMap.put(chatMessage.getId(), "COMPLETED");

            log.info("File-only message completed: messageId={}, attachmentCount={}",
                    chatMessage.getId(), savedAttachments.size());

            return toChatMessageResponse(chatMessage, userId, savedAttachments);

        } catch (Exception e) {
            chatMessage.setStatus(MessageStatus.FAILED);
            chatMessage.setUpdatedDate(Instant.now());
            chatMessageRepository.save(chatMessage);
            uploadStatusMap.put(chatMessage.getId(), "FAILED");

            log.error("Failed to create file-only message for clientMessageId: {}", clientMessageId, e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        } finally {
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

    public MessageUpdatePayload uploadAndAttachFiles(MultipartFile[] files,
                                                      String channelId,
                                                      String clientMessageId,
                                                      AttachmentCategory category,
                                                      Principal principal) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        ChannelPhase.assertOpenForMember(channel);
        AttachmentCategory effectiveCategory = category != null ? category : AttachmentCategory.GENERAL;

        ChatMessage chatMessage = chatMessageRepository.findByClientMessageId(clientMessageId)
                .orElseThrow(() -> {
                    log.error("Message not found for clientMessageId: {}", clientMessageId);
                    return new AppException(ErrorCode.MESSAGE_NOT_FOUND);
                });

        if (!chatMessage.getChannelId().equals(channelId)) {
            log.error("Channel mismatch: message channelId={}, request channelId={}",
                    chatMessage.getChannelId(), channelId);
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String authToken = getAuthTokenFromContext();

        uploadStatusMap.put(chatMessage.getId(), "UPLOADING");

        try {
            List<CompletableFuture<MessageAttachment>> futures = Arrays.stream(files)
                    .map(file -> CompletableFuture.supplyAsync(() ->
                            uploadSingleFile(file, chatMessage.getId(), channelId, effectiveCategory, authToken)))
                    .toList();

            List<MessageAttachment> uploadedAttachments = futures.stream()
                    .map(CompletableFuture::join)
                    .toList();

            List<MessageAttachment> savedAttachments = messageAttachmentRepository.saveAll(uploadedAttachments);

            boolean hasContent = StringUtils.hasText(chatMessage.getContent());
            chatMessage.setMessageType(hasContent ? MessageType.MIXED : MessageType.FILE_ONLY);
            chatMessage.setStatus(MessageStatus.SENT);
            chatMessage.setUpdatedDate(Instant.now());

            chatMessageRepository.save(chatMessage);

            // UC-41: track SUBMISSION messageId trong AssignmentSession
            if (effectiveCategory == AttachmentCategory.SUBMISSION && channel.getAssignmentSessionId() != null) {
                trackSubmissionInSession(channel.getAssignmentSessionId(), chatMessage.getId());
            }

            uploadStatusMap.put(chatMessage.getId(), "COMPLETED");

            List<AttachmentResponse> attachmentResponses = chatMessageMapper.toAttachmentResponseList(savedAttachments);

            return MessageUpdatePayload.builder()
                    .clientMessageId(clientMessageId)
                    .messageId(chatMessage.getId())
                    .status(MessageStatus.SENT)
                    .messageType(chatMessage.getMessageType())
                    .attachments(attachmentResponses)
                    .build();

        } catch (Exception e) {
            chatMessage.setStatus(MessageStatus.FAILED);
            chatMessage.setUpdatedDate(Instant.now());
            chatMessageRepository.save(chatMessage);
            uploadStatusMap.put(chatMessage.getId(), "FAILED");

            log.error("Failed to upload and attach files for clientMessageId: {}", clientMessageId, e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        } finally {
            CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(60_000);
                    uploadStatusMap.remove(chatMessage.getId());
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            });
        }
    }

    /**
     * Legacy upload method: creates a new message per file.
     */
    public List<ChatMessageResponse> uploadMultipleFilesToMessage(MultipartFile[] files,
                                                                  String channelId,
                                                                  Principal principal) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

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

                ChatMessage chatMessage = ChatMessage.builder()
                        .content(file.getOriginalFilename())
                        .channelId(channelId)
                        .sender(sender)
                        .messageType(MessageType.FILE_ONLY)
                        .status(MessageStatus.SENT)
                        .createdDate(Instant.now())
                        .updatedDate(Instant.now())
                        .build();

                chatMessage = chatMessageRepository.save(chatMessage);

                MessageAttachment attachment = MessageAttachment.builder()
                        .messageId(chatMessage.getId())
                        .channelId(channelId)
                        .fileName(file.getOriginalFilename())
                        .contentType(file.getContentType())
                        .fileSize(file.getSize())
                        .fileUrl(cloudinaryService.uploadFile(file, attachmentType))
                        .attachmentType(attachmentType)
                        .category(AttachmentCategory.GENERAL)
                        .uploadedAt(Instant.now())
                        .build();
                attachment = messageAttachmentRepository.save(attachment);

                return this.toChatMessageResponse(chatMessage, sender, List.of(attachment));
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

    /**
     * Build a ChatMessageResponse. Attachments are passed in explicitly (caller
     * has them in hand from the upload pipeline) to avoid an extra DB roundtrip.
     * Sender info is resolved from ChannelMember first (denormalized), then
     * falls back to user-service, then to "Anonymous" — never throws.
     */
    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage,
                                                       String currentUserId,
                                                       List<MessageAttachment> attachments) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        boolean isMe = chatMessage.getSender() != null && chatMessage.getSender().equals(currentUserId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());
        chatMessageResponse.setClientMessageId(chatMessage.getClientMessageId());
        chatMessageResponse.setStatus(chatMessage.getStatus());
        chatMessageResponse.setChannelId(chatMessage.getChannelId());

        chatMessageResponse.setAttachments(
                attachments == null || attachments.isEmpty()
                        ? Collections.emptyList()
                        : chatMessageMapper.toAttachmentResponseList(attachments));

        chatMessageResponse.setSender(resolveSender(chatMessage.getChannelId(), chatMessage.getSender()));

        return chatMessageResponse;
    }

    private UserResponse resolveSender(String channelId, String senderUserId) {
        if (senderUserId == null || senderUserId.isBlank()) {
            return anonymousUser(null);
        }
        try {
            ChannelMember member = channelMemberRepository
                    .findByChannelIdAndUserId(channelId, senderUserId)
                    .orElse(null);
            if (member != null && member.getNickname() != null && !member.getNickname().isBlank()) {
                return UserResponse.builder()
                        .id(member.getUserId())
                        .nickname(member.getNickname())
                        .studentId(member.getStudentId())
                        .avatarUrl(member.getAvatarUrl())
                        .isOwner(member.getRole() == ChannelRole.TEACHER)
                        .build();
            }
        } catch (Exception e) {
            log.debug("ChannelMember lookup failed for userId={}, channelId={}", senderUserId, channelId, e);
        }
        try {
            UserResponse profile = getUserClient.getUser(senderUserId).getResult();
            if (profile != null) {
                return profile;
            }
        } catch (Exception e) {
            log.info("Failed to fetch user profile for userId: {}", senderUserId);
        }
        return anonymousUser(senderUserId);
    }

    private UserResponse anonymousUser(String userId) {
        return UserResponse.builder()
                .id(userId)
                .nickname("Anonymous")
                .build();
    }

    public String getUploadStatus(String messageId) {
        return uploadStatusMap.getOrDefault(messageId, "UNKNOWN");
    }

    public void clearUploadStatus(String messageId) {
        uploadStatusMap.remove(messageId);
    }

    /**
     * UC-41: thêm messageId vào danh sách submittedFileMessageIds của session.
     * Idempotent — không thêm trùng. Gọi sau khi lưu message SUBMISSION thành công.
     */
    private void trackSubmissionInSession(String sessionId, String messageId) {
        assignmentSessionRepository.findById(sessionId).ifPresent(session -> {
            List<String> ids = session.getSubmittedFileMessageIds();
            if (ids == null) {
                ids = new ArrayList<>();
                session.setSubmittedFileMessageIds(ids);
            }
            if (!ids.contains(messageId)) {
                ids.add(messageId);
                session.setUpdatedAt(Instant.now());
                assignmentSessionRepository.save(session);
                log.info("UC-41: tracked submission messageId={} in session={}", messageId, sessionId);
            }
        });
    }

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
