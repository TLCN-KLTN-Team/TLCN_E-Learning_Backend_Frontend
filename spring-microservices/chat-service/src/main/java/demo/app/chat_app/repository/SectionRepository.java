package demo.app.chat_app.repository;

import demo.app.chat_app.model.Section;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends MongoRepository<Section, String> {
    List<Section> findAllByWorkspaceId(String workspaceId);
}
