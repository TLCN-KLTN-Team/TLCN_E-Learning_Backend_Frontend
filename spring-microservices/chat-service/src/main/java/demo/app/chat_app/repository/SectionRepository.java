package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.Section;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SectionRepository extends MongoRepository<Section, String> {
    List<Section> findAllByWorkspaceId(String workspaceId);

    Optional<Section> findByClassId(Integer classId);

    /**
     * Idempotent lookup khớp chính xác với compound unique index
     * `{workspaceId, classId}`. Dùng trước khi insert section cho một class
     * để tránh duplicate key khi Kafka event được replay.
     */
    Optional<Section> findByWorkspaceIdAndClassId(String workspaceId, Integer classId);

    /**
     * General section của workspace có classId = null. Dùng trước khi tạo
     * "Thông báo chung" để tránh duplicate khi COURSE_CREATED bị replay.
     */
    @Query("{ 'workspaceId': ?0, 'classId': null }")
    Optional<Section> findGeneralSectionByWorkspaceId(String workspaceId);

    // Find all sections where userId is in sectionMembers array
    List<Section> findAllBySectionMembersContaining(String userId);
}
