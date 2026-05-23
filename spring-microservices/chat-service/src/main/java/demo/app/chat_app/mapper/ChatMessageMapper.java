package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.model.workspace.ChatMessage;
import demo.app.chat_app.model.workspace.MessageAttachment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChatMessageMapper {
    @Mapping(target = "me", ignore = true)          // Set in service layer
    @Mapping(target = "sender", ignore = true)      // Enriched in service layer
    @Mapping(target = "attachments", ignore = true) // Fetched separately by messageId
    ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage);

    AttachmentResponse toAttachmentResponse(MessageAttachment attachment);

    List<AttachmentResponse> toAttachmentResponseList(List<MessageAttachment> attachments);
}
