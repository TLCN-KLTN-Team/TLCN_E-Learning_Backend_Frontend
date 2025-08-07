package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.ChatMessageResponse;
import demo.app.chat_app.model.ChatMessage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChatMessageMapper {
    @Mapping(target = "me", ignore = true) // Will be set in service layer
    ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage);
}
