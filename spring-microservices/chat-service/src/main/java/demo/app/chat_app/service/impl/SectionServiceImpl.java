package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.SectionResponse;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.Channel;
import demo.app.chat_app.model.Section;
import demo.app.chat_app.model.Workspace;
import demo.app.chat_app.repository.SectionRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SectionServiceImpl {
    private final SectionRepository sectionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ChannelServiceImpl channelService;

    public List<SectionResponse> getSectionsByWorkspaceId(String workspaceId) {
        List<Section> sections = sectionRepository.findAllByWorkspaceId(workspaceId);


        return sections.stream()
                .map(section -> SectionResponse.builder()
                        .id(section.getId())
                        .title(section.getTitle())
                        .isPublic(section.isPublic())
                        .channels(channelService.getChannelsForSection(section.getChannelIds()))
                        .build())
                .toList();
    }

    public Section createGeneralSection(List<String> members, String workspaceId, Workspace workspace) {
        Section section = Section.builder()
                .title("Thông báo chung")
                .workspaceId(workspaceId)
                .isPublic(true)
                .isGeneral(true)
                .build();
        Section savedSection = sectionRepository.save(section);

        Channel channel = channelService.createGeneralChannel(section.getId(), members, workspace);

        savedSection.addChannelId(channel.getId());

        return sectionRepository.save(savedSection);
    }

    public void createSectionWhenClassCreated(ClassCreatedEvent event){
        Workspace w = workspaceRepository.findByCourseId(event.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        Channel channel = channelService.createFirstChannelInSectionWhenStudentsEnrolled(event);

        Section section = Section.builder()
                .title(event.getClassName())
                .workspaceId(w.getId())
                .classId(event.getClassId())
                .isPublic(true)
                .build();

        section.addChannelId(channel.getId());

        sectionRepository.save(section);
    }

    public Section getGeneralSectionByClassId(Integer classId) {
        return sectionRepository.findByClassId(classId)
                .stream()
                .filter(Section::isPublic)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
    }
}
