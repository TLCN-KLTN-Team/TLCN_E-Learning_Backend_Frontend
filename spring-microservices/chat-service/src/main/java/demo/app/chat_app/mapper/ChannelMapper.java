package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.BasicChannelResponse;
import demo.app.chat_app.dto.response.ChannelResponse;
import demo.app.chat_app.model.workspace.Channel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChannelMapper {
    @Mapping(target = "messages", ignore = true) // Messages are fetched separately for performance
    @Mapping(source = "public", target = "isPublic")
    @Mapping(source = "readOnly", target = "isReadOnly")
    ChannelResponse toResponse(Channel channel);

    List<ChannelResponse> toResponseList(List<Channel> channels);

    @Mapping(source = "public", target = "isPublic")
    BasicChannelResponse toBasicChannelResponse(Channel channel);
}
