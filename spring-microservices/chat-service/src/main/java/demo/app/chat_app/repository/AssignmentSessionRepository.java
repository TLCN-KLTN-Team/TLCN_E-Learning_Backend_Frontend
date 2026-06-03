package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.AssignmentSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AssignmentSessionRepository extends MongoRepository<AssignmentSession, String> {
    List<AssignmentSession> findAllBySectionId(String sectionId);
}
