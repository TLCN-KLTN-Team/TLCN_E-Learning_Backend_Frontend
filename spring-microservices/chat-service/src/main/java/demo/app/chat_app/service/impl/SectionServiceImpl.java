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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SectionServiceImpl implements SectionService {
    private final SectionRepository sectionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ChannelServiceImpl channelService;

    @Override
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

    /**
     * Tạo general section (classId=null) + general channel cho workspace.
     * Idempotent: nếu đã có section, trả về và đảm bảo channel cũng được khởi tạo.
     */
    public void createGeneralSection(String workspaceId, Workspace workspace) {
        Section section = sectionRepository.findGeneralSectionByWorkspaceId(workspaceId)
                .orElseGet(() -> {
                    Section newSection = Section.builder()
                            .name("Thông báo chung")
                            .workspaceId(workspaceId)
                            .isPublic(true)
                            .build();
                    try {
                        return sectionRepository.save(newSection);
                    } catch (DuplicateKeyException dup) {
                        // Concurrent insert wins — đọc lại bản đã tồn tại.
                        log.warn("General section concurrent insert for workspace {}, reading existing", workspaceId);
                        return sectionRepository.findGeneralSectionByWorkspaceId(workspaceId)
                                .orElseThrow(() -> dup);
                    }
                });

        // Đảm bảo general channel tồn tại (channelService cũng idempotent).
        channelService.createGeneralChannelInGeneralSection(section.getId(), workspace);
    }

    /**
     * Section + first channel cho một class mới. Idempotent theo (workspaceId, classId)
     * — replay của CLASS_CREATED không gây DuplicateKeyException.
     */
    public void createSectionWhenClassCreated(ClassCreatedEvent event) {
        Workspace wEntity = workspaceRepository.findByCourseId(event.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.WORKSPACE_NOT_EXISTED));

        Section section = sectionRepository
                .findByWorkspaceIdAndClassId(wEntity.getId(), event.getClassId())
                .orElseGet(() -> {
                    Section newSection = Section.builder()
                            .workspaceId(wEntity.getId())
                            .classId(event.getClassId())
                            .name(event.getClassName())
                            .description(event.getDescription())
                            .studentCount(1) // sẽ được cập nhật khi STUDENTS_ENROLLED về
                            .build();
                    try {
                        return sectionRepository.save(newSection);
                    } catch (DuplicateKeyException dup) {
                        // Có thể có 2 instance/thread cùng insert ở giây thứ 0 — đọc lại
                        log.warn("Class section concurrent insert for workspace={}, classId={}, reading existing",
                                wEntity.getId(), event.getClassId());
                        return sectionRepository
                                .findByWorkspaceIdAndClassId(wEntity.getId(), event.getClassId())
                                .orElseThrow(() -> dup);
                    }
                });

        // Channel creation cũng idempotent.
        Channel channel = channelService.createFirstChannelInSectionWhenStudentsEnrolled(event);
        log.info("Section {} & channel {} ready for class {}", section.getId(), channel.getId(), event.getClassId());
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

        // Find all workspace where user is owner
        List<String> workspaceIds = workspaceRepository.findAllByOwnerId(userId)
                .stream()
                .map(Workspace::getId)
                .toList();

        if (workspaceIds.isEmpty()) {
            // Find all sections where user is a member
            List<Section> sections = sectionRepository.findAllBySectionMembersContaining(userId);
            log.debug("Found {} sections containing user {}", sections.size(), userId);

            // Extract unique workspaceIds from sections
            workspaceIds = sections.stream()
                    .map(Section::getWorkspaceId)
                    .distinct()
                    .toList();
        }
        log.info("User {} belongs to {} unique workspaces", userId, workspaceIds.size());
        return workspaceIds;
    }

    @Override
    public List<String> getMemberIdsBySectionId(String sectionId) {
        Section section = this.getSectionById(sectionId);
        return section.getSectionMembers();
    }

    @Override
    public int getStudentCountBySectionId(String sectionId) {
        Section section = this.getSectionById(sectionId);
        return section.getStudentCount();
    }

    @Override
    public Section getSectionById(String sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_EXISTED));
    }

    @Override
    public SectionResponse getSectionResponseById(String sectionId) {
        Section section = this.getSectionById(sectionId);
        return SectionResponse.builder()
                .id(section.getId())
                .name(section.getName())
                .isPublic(section.isPublic())
                .build();
    }
}
