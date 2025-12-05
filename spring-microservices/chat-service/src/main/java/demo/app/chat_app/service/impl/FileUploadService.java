package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.AttachmentUploadResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.FileUploadResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.ChatMessage;
import demo.app.chat_app.model.MessageAttachment;
import demo.app.chat_app.model.Participant;
import demo.app.chat_app.model.enums.AttachmentType;
import demo.app.chat_app.model.enums.MessageStatus;
import demo.app.chat_app.model.enums.MessageType;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.MessageAttachmentRepository;
import demo.app.chat_app.service.ChannelService;
import demo.app.chat_app.service.ChatMessageService;
import demo.app.chat_app.service.util.CloudinaryService;
import demo.app.chat_app.utils.FileUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import java.util.ArrayList;
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
//    public List<ChatMessageResponse> uploadMultipleFilesToMessage(MultipartFile[] files,
//                                                                  String channelId,
//                                                                  Principal principal) {
//        Channel channel = channelRepository.findById(channelId)
//                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
//
//        String userId = principal.getName(); // Assuming user ID is the principal name
//
//        Participant sender = channel.getMemberIds().stream()
//                .filter(p -> p.getUserId().equals(userId))
//                .findFirst()
//                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL));
//
//        // using CompletableFuture to upload files in parallel. return futures object
//        List<CompletableFuture<ChatMessageResponse>> futures = Arrays.stream(files)
//                .map((file) -> CompletableFuture.supplyAsync(() -> uploadSingleFileAsync(
//                        file, channelId, sender
//                ))).toList();
//
//        // get response from futures
//        List<ChatMessageResponse> responses = futures.stream()
//                .map(CompletableFuture::join)
//                .toList();
//
//        return responses;
//    }

    private ChatMessageResponse uploadSingleFileAsync(MultipartFile file,
                                                           String channelId, Participant sender) {
        try {

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

            return this.toChatMessageResponse(chatMessage, sender.getUserId());

        } catch (Exception e) {
            log.error("Failed to upload file {} for message {}", file.getOriginalFilename(), e);
            throw new AppException(ErrorCode.SEND_MESSAGE_FAILED);
        }
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        boolean isMe = chatMessage.getSender().getUserId().equals(userId);
        chatMessageResponse.setMe(isMe);
        chatMessageResponse.setMessageType(chatMessage.getMessageType());

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
}
