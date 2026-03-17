package demo.app.chat_app.mapper;

import demo.app.chat_app.dto.response.WorkspaceResponse;
import demo.app.chat_app.model.workspace.Workspace;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface WorkspaceMapper {
    WorkspaceResponse toResponse(Workspace workspace);
}
