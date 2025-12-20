package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.UserResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.ChatMessage;
import demo.app.chat_app.model.enums.MessageType;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.MessageAttachmentRepository;
import demo.app.chat_app.repository.httpclient.GetUserClient;
import demo.app.chat_app.service.ChatMessageService;
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
import java.util.Arrays;
import java.util.List;
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
    private final ChatMessageRepository chatMessageRepository;

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

    // ======== NEW METHODS FOR SEPARATED ARCHITECTURE ========

    /**
     * Create a message is attachment type with parallel uploads
     */
    public List<ChatMessageResponse> uploadMultipleFilesToMessage(MultipartFile[] files,
                                                                  String channelId,
                                                                  Principal principal) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        String userId = principal.getName(); // Assuming user ID is the principal name

        // Lấy token từ HTTP request context
        String authToken = getAuthTokenFromContext();

        // using CompletableFuture to upload files in parallel. return futures object
        List<CompletableFuture<ChatMessageResponse>> futures = Arrays.stream(files)
                .map((file) -> CompletableFuture.supplyAsync(() -> uploadSingleFileAsync(
                        file, channelId, userId, authToken
                ))).toList();

        // get response from futures
        List<ChatMessageResponse> responses = futures.stream()
                .map(CompletableFuture::join)
                .toList();

        return responses;
    }

    private ChatMessageResponse uploadSingleFileAsync(MultipartFile file,
                                                           String channelId, String sender, String authToken) {
        try {
            // Set token vào ThreadLocal trước khi gọi Feign client
            if (StringUtils.hasText(authToken)) {
                WebSocketAuthInterceptor.setToken(authToken);
                log.debug("Token set in ThreadLocal for async task");
            }

            // Validate file
            if (!fileUtils.validateFile(file)) {
                return ChatMessageResponse.builder()
                        .uploadedFiles(false)
                        .content("File invalid")
                        .build();
            }

            // Determine attachment type
            MessageType messageType = fileUtils.getMessageType(file.getOriginalFilename());

            // Upload to cloudinary
            try {
                String fileUrl = cloudinaryService.uploadFile(file, messageType);
                // Create message record
                ChatMessage chatMessage = ChatMessage.builder()
                        .messageType(messageType)
                        .content(file.getOriginalFilename())
                        .fileUrl(fileUrl)
                        .channelId(channelId)
                        .sender(sender)
                        .createdDate(Instant.now())
                        .updatedDate(Instant.now())
                        .build();

                chatMessage = chatMessageRepository.save(chatMessage);

                return this.toChatMessageResponse(chatMessage,sender);
            } catch (AppException e) {
                log.error("Error uploading file {}: {}", file.getOriginalFilename(), e.getMessage());
                throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
            }

        } catch (Exception e) {
            throw new AppException(ErrorCode.SEND_MESSAGE_FAILED);
        } finally {
            // Clean up ThreadLocal sau khi xong
            WebSocketAuthInterceptor.clearToken();
        }
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        boolean isMe = chatMessage.getSender().equals(userId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());

        log.info("Mapping chat message to response for messageId: {}, isMe: {}", chatMessage.getId(), isMe);

        // get user profile info
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
     * Lấy token từ HTTP request context hoặc WebSocket ThreadLocal
     */
    private String getAuthTokenFromContext() {
        // 1) Ưu tiên lấy từ WebSocket ThreadLocal
        String authToken = WebSocketAuthInterceptor.getToken();
        
        // 2) Nếu không có, lấy từ HTTP request
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
