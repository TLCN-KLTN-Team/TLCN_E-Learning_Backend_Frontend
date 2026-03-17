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

    // Find all sections where userId is in sectionMembers array
    List<Section> findAllBySectionMembersContaining(String userId);
}
