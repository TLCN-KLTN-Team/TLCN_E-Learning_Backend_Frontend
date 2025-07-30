package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.ConversationResponse;
import demo.app.chat_app.model.Conversation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConversationMapper {
    @Mapping(source = "createdAt", target = "createdDate")
    @Mapping(source = "modifiedAt", target = "modifiedDate")
    ConversationResponse toResponse(Conversation conversation);
}
