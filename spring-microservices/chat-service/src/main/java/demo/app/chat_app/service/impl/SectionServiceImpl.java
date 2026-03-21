package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.SectionResponse;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.Section;
import demo.app.chat_app.model.workspace.Workspace;
import demo.app.chat_app.repository.SectionRepository;
import demo.app.chat_app.repository.WorkspaceRepository;
import demo.app.chat_app.service.SectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SectionServiceImpl implements SectionService {
    private final SectionRepository sectionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ChannelServiceImpl channelService;

    public List<SectionResponse> getSectionsByWorkspaceId(String workspaceId) {
        List<Section> sections = sectionRepository.findAllByWorkspaceId(workspaceId);

        return sections.stream()
                .map(section -> SectionResponse.builder()
                        .id(section.getId())
                        .name(section.getName())
                        .isPublic(section.isPublic())
                        .build())
                .toList();
    }

    public void createGeneralSection(String teacherId, String workspaceId, Workspace workspace) {
        Section section = Section.builder()
                .name("Thông báo chung")
                .workspaceId(workspaceId)
                .isPublic(true)
                .build();
        section.addMember(teacherId);
        Section savedSection = sectionRepository.save(section);

        Channel channel = channelService.createGeneralChannel(savedSection.getId(), workspace);
    }

    public void createSectionWhenClassCreated(ClassCreatedEvent event){
        Workspace wEntity = workspaceRepository.findByCourseId(event.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        Section section = Section.builder()
                .workspaceId(wEntity.getId())
                .classId(event.getClassId())
                .name(event.getClassName())
                .description(event.getDescription())
                .sectionMembers(Collections.singletonList(wEntity.getOwnerId()))
                .studentCount(1) // Giá trị ban đầu, sẽ được cập nhật khi có SV enroll
                .build();

        sectionRepository.save(section);

        Channel channel = channelService.createFirstChannelInSectionWhenStudentsEnrolled(event);

    }

    public Section getGeneralSectionByClassId(Integer classId) {
        return sectionRepository.findByClassId(classId)
                .stream()
                .filter(Section::isPublic)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
    }

    @Override
    public List<Section> getSectionsByUserId(String userId) {
        return sectionRepository.findAllBySectionMembersContaining(userId);
    }

    @Override
    public List<String> getWorkspaceIdsByUserId(String userId) {
        log.debug("Finding workspaces for userId: {}", userId);

        // Find all sections where user is a member
        List<Section> sections = sectionRepository.findAllBySectionMembersContaining(userId);
        log.debug("Found {} sections containing user {}", sections.size(), userId);

        // Extract unique workspaceIds from sections
        List<String> workspaceIds = sections.stream()
                .map(Section::getWorkspaceId)
                .distinct()
                .toList();

        log.info("User {} belongs to {} unique workspaces", userId, workspaceIds.size());
        return workspaceIds;
    }
}
