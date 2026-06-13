package demo.app.chat_app.repository.forum;

import demo.app.chat_app.model.forum.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(String postId);

    /** Only return non-deleted comments (for user-facing queries) */
    List<Comment> findByPostIdAndDeletedFalseOrderByCreatedAtAsc(String postId);

    /** Count only non-deleted comments */
    long countByPostIdAndDeletedFalse(String postId);

    long countByPostId(String postId);
}
