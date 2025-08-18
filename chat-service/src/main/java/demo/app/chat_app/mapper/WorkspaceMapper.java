package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.WorkspaceResponse;
import demo.app.chat_app.model.Workspace;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WorkspaceMapper {
    WorkspaceResponse toResponse(Workspace workspace);
}
