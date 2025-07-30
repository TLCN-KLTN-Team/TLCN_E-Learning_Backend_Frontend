package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.request.ConversationRequest;
import demo.app.chat_app.dto.response.ConversationResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.mapper.ConversationMapper;
import demo.app.chat_app.model.Conversation;
import demo.app.chat_app.model.ParticipantInfo;
import demo.app.chat_app.repository.ConversationRepository;
import demo.app.chat_app.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.StringJoiner;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationService {
    ConversationRepository conversationRepo;
    ConversationMapper conversationMapper;
    ProfileClient profileClient;

//    public String getCurrentConversationId(){
//        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
//        List<Conversation> myConversations = conversationRepo.findAllByParticipantsIn(userId);
//        String conversationId =
//    }

    public List<ConversationResponse> myConversations() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Conversation> conversations = conversationRepo.findAllByParticipantsIn(userId);
        return conversations.stream().map(this::toConversationResponse).toList();
    }

    public ConversationResponse create(ConversationRequest request) {
        // fetch user infos
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        var currentUserInfoRes = profileClient.getUserProfile(currentUserId);
        
        // Get first participant ID (should be different from current user)
        String participantId = request.getParticipantIds().getFirst();
        var participantInfoRes = profileClient.getUserProfile(participantId);
        
        if (ObjectUtils.isEmpty(currentUserInfoRes) || ObjectUtils.isEmpty(participantInfoRes)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        var currentUserInfo = currentUserInfoRes.getResult();
        var participantInfo = participantInfoRes.getResult();

        // Build participant list with different users
        List<String> userIds = new ArrayList<>();
        userIds.add(currentUserId);
        userIds.add(participantId);  // Use participantId instead of participantInfo.getUserId()
        var sortedIds = userIds.stream().sorted().toList();
        String hashed = generateParticipantHash(sortedIds);

        var conversation = conversationRepo.findConversationByParticipantsHash(hashed).
                orElseGet(() -> {
                    // build conversation info
                    List<ParticipantInfo> participantInfos = List.of(
                            ParticipantInfo.builder()
                                    .userId(currentUserInfo.getUserId())
                                    .username(currentUserInfo.getUsername())
                                    .firstName(currentUserInfo.getFirstName())
                                    .lastName(currentUserInfo.getLastName())
                                    .avatarUrl(currentUserInfo.getAvatar())
                                    .build(),
                            ParticipantInfo.builder()
                                    .userId(participantInfo.getUserId())
                                    .username(participantInfo.getUsername())
                                    .firstName(participantInfo.getFirstName())
                                    .lastName(participantInfo.getLastName())
                                    .avatarUrl(participantInfo.getAvatar())
                                    .build()
                    );

                    Conversation newConversation = Conversation.builder()
                            .type(request.getType())
                            .participantsHash(hashed)
                            .createdAt(Instant.now())
                            .modifiedAt(Instant.now())
                            .participants(participantInfos)
                            .build();
                    return conversationRepo.save(newConversation);
                });

        return toConversationResponse(conversation);
    }

    private String generateParticipantHash(List<String> ids) {
        StringJoiner stringJoiner = new StringJoiner("_");
        ids.forEach(stringJoiner::add);
        return stringJoiner.toString();
    }

    private ConversationResponse toConversationResponse(Conversation conversation) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        ConversationResponse conversationResponse = conversationMapper.toResponse(conversation);

        // Find the other participant (not the current user)
        var otherParticipant = conversation.getParticipants().stream()
                .filter(participantInfo -> !participantInfo.getUserId().equals(currentUserId))
                .findFirst();

        if (otherParticipant.isPresent()) {
            ParticipantInfo participant = otherParticipant.get();
            conversationResponse.setConversationName(
                    participant.getFirstName() + " " + participant.getLastName());
            conversationResponse.setConversationAvatar(participant.getAvatarUrl());
        } else {
            // Fallback: nếu không tìm thấy participant khác, có thể là group chat hoặc bug
            conversationResponse.setConversationName("Unknown Conversation");
            conversationResponse.setConversationAvatar(null);
        }

        return conversationResponse;
    }
}
