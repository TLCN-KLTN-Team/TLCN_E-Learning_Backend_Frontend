package demo.app.chat_app.service;

import demo.app.chat_app.dto.response.SectionResponse;
import demo.app.chat_app.model.workspace.Section;

import java.util.List;

public interface SectionService {
    List<SectionResponse> getSectionsByWorkspaceId(String workspaceId);
    List<Section> getSectionsByUserId(String userId);
    List<String> getWorkspaceIdsByUserId(String userId);
    List<String> getMemberIdsBySectionId(String sectionId);
    int getStudentCountBySectionId(String sectionId);

    Section getSectionById(String sectionId);
    SectionResponse getSectionResponseById(String sectionId);
}
