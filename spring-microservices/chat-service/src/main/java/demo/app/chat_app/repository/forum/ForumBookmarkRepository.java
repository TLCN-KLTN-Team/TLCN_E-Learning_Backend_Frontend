package demo.app.chat_app.repository.forum;

import demo.app.chat_app.model.forum.ForumBookmark;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ForumBookmarkRepository extends MongoRepository<ForumBookmark, String> {
    Optional<ForumBookmark> findByUserIdAndPost_Id(String userId, String postId);

    List<ForumBookmark> findByUserIdOrderByCreatedAtDesc(String userId);

    List<ForumBookmark> findByPost_Id(String postId);

    void deleteByPost_Id(String postId);
}
