package demo.app.chat_app.service;

import demo.app.chat_app.model.workspace.Section;

import java.util.List;

public interface SectionService {
    List<Section> getSectionsByUserId(String userId);
    List<String> getWorkspaceIdsByUserId(String userId);

}
