package demo.app.chat_app.repository;

import demo.app.chat_app.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    Optional<Conversation> findConversationByParticipantsHash(String hash);

    @Query("{ 'participant_infos.userId': ?0 }")
    List<Conversation> findAllByParticipantsIn(String userId);
}
