package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ChatMessageRequest;
import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.dto.response.PageResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ChatMessageMapper;
import demo.app.chat_app.mapper.MessageAttachmentMapper;
import demo.app.chat_app.model.*;
import demo.app.chat_app.model.enums.AttachmentType;
import demo.app.chat_app.repository.ChannelRepository;
import demo.app.chat_app.repository.ChatMessageRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.repository.httpclient.ProfileClient;
import demo.app.chat_app.service.ChatMessageService;
import demo.app.chat_app.service.util.CloudinaryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageServiceImpl implements ChatMessageService {
    ChatMessageRepository chatMessageRepository;
    ProfileClient profileClient;
    ChatMessageMapper chatMessageMapper;
    ChannelRepository channelRepository;
    WorkspaceRepository workspaceRepository;
    CloudinaryService cloudinaryService;
    MessageAttachmentMapper messageAttachmentMapper;

    @Override
    public boolean existsConversation(String conversationId) {
        return false;
    }

    @Override
    public ChatMessageResponse sendMessage(ChatMessageRequest request, Principal principal) {
        // Validate and get channel
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // Get current user
        String userId = principal.getName();

        // Find sender participant info
        Participant sender = channel.getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL));

        // Create and save message
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .channelId(request.getChannelId())
                .content(request.getContent())
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        message = chatMessageRepository.save(message);

        return this.toChatMessageResponse(message);
    }

    @Override
    public ChatMessageResponse sendMessageWithAttachments(ChatMessageRequest request, MultipartFile[] attachments, Principal principal) {
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
        String userId = principal.getName();
        Participant sender = channel.getParticipants().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL));

        List<MessageAttachment> messageAttachments = new ArrayList<>();

        Arrays.stream(attachments).forEach(attachment -> {
            // Validate attachment type and size
            if (attachment.isEmpty() || attachment.getSize() > 10 * 1024 *1024){
                throw new AppException(ErrorCode.FILE_SIZE_TOO_LARGE);
            }
            if (!isImage(attachment)) {
                throw new AppException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
            }
            // Handle file upload (e.g., to Cloudinary or local storage)
            if (isImage(attachment)) {
                try {
                    String url = cloudinaryService.uploadFile(attachment);
                    MessageAttachment messageAttachment = MessageAttachment.builder()
                            .fileName(attachment.getOriginalFilename())
                            .contentType(attachment.getContentType())
                            .fileSize(attachment.getSize())
                            .attachmentType(AttachmentType.IMAGE)
                            .thumbnail(url)
                            .build();
                    messageAttachments.add(messageAttachment);
                } catch (IOException e) {
                    throw new AppException(ErrorCode.CLOUDINARY_IO_EXCEPTION);
                }
            }
//            if (isFile(attachment)) {
//                try {
//                    String url = cloudinaryService.uploadFile(attachment);
//                    AttachmentResponse attachmentResponse = AttachmentResponse.builder()
//                            .fileName(attachment.getOriginalFilename())
//                            .contentType(attachment.getContentType())
//                            .fileSize(attachment.getSize())
//                            .attachmentType(AttachmentType.DOCUMENT)
//                            .fileUrl(url)
//                            .build();
//                    attachmentResponses.add(attachmentResponse);
//                } catch (IOException e) {
//                    throw new AppException(ErrorCode.CLOUDINARY_IO_EXCEPTION);
//                }
//            }
        });

        // Create message without attachments first
        ChatMessage chatMessage = ChatMessage.builder()
                .sender(sender)
                .channelId(request.getChannelId())
                .content(request.getContent())
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .attachments(messageAttachments)
                .build();

        chatMessage = chatMessageRepository.save(chatMessage);

        return ChatMessageResponse.builder()
                .id(chatMessage.getId())
                .channelId(chatMessage.getChannelId())
                .content(chatMessage.getContent())
                .sender(chatMessage.getSender())
                .createdDate(chatMessage.getCreatedDate())
                .attachments(messageAttachmentMapper.toAttachmentResponseList(messageAttachments))
                .build();
    }

    private boolean isImage(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType!=null && contentType.contains("image/");
    }

//    private boolean isFile(MultipartFile file) {
//        String contentType = file.getContentType();
//    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isMe = chatMessage.getSender().getUserId().equals(userId);
        chatMessageResponse.setMe(isMe);

        return chatMessageResponse;
    }

    @Override
    public List<ChatMessageResponse> getMessages(String channelId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify channel exists and user has access
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
                
        if (!channel.hasParticipant(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL);
        }

        // Use paginated query for better performance
        // For now, get first 50 messages - should be parameterized
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.ASC, "createdDate"));
        Page<ChatMessage> messagePage = chatMessageRepository.findByChannelIdAndNotDeleted(channelId, pageable);
        
        List<ChatMessageResponse> response = messagePage.getContent().stream()
                .map(this::toChatMessageResponse)
                .toList();

        return response;
    }
    
    // New method for paginated messages
    public PageResponse<ChatMessageResponse> getMessagesPaginated(String channelId, int page, int size) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Verify channel exists and user has access
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));
                
        if (!channel.hasParticipant(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND_IN_CHANNEL);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        Page<ChatMessage> messagePage = chatMessageRepository.findByChannelIdAndNotDeleted(channelId, pageable);
        
        List<ChatMessageResponse> responses = messagePage.getContent().stream()
                .map(this::toChatMessageResponse)
                .toList();

        return PageResponse.<ChatMessageResponse>builder()
                .content(responses)
                .pageNumber(messagePage.getNumber())
                .pageSize(messagePage.getSize())
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .last(messagePage.isLast())
                .build();
    }
}
