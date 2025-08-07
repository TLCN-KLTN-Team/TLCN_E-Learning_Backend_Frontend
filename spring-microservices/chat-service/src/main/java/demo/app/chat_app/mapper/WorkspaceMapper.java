package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.WorkspaceResponse;
import demo.app.chat_app.model.Workspace;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WorkspaceMapper {
    @Mapping(target = "channels", ignore = true) // Will be populated separately via service layer
    WorkspaceResponse toResponse(Workspace workspace);
}
