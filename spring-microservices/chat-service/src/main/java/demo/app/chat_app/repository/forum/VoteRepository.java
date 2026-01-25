package demo.app.chat_app.repository.forum;

import demo.app.chat_app.model.forum.Vote;
import demo.app.chat_app.model.forum.VoteTargetType;
import demo.app.chat_app.model.forum.VoteType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteRepository extends MongoRepository<Vote, String> {
    Optional<Vote> findByUserIdAndTargetIdAndTargetType(String userId, String targetId, VoteTargetType targetType);
    
    long countByTargetIdAndTargetTypeAndType(String targetId, VoteTargetType targetType, VoteType type);
}
