package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.GroupFinalScore;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GroupFinalScoreRepository extends MongoRepository<GroupFinalScore, String> {

    List<GroupFinalScore> findAllByAssignmentSessionId(String assignmentSessionId);

    Optional<GroupFinalScore> findByAssignmentSessionIdAndChannelId(
            String assignmentSessionId, String channelId);

    List<GroupFinalScore> findAllBySectionId(String sectionId);
}
