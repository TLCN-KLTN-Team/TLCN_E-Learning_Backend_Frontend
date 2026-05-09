package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.AttachmentResponse;
import demo.app.chat_app.model.workspace.MessageAttachment;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MessageAttachmentMapper {
    List<AttachmentResponse> toAttachmentResponseList(List<MessageAttachment> attachments);
    AttachmentResponse toAttachmentResponse(MessageAttachment attachment);
}
