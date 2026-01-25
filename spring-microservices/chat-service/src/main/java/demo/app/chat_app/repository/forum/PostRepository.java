package demo.app.chat_app.repository.forum;

import demo.app.chat_app.model.forum.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    Page<Post> findByCategoryId(String categoryId, Pageable pageable);
    
    Page<Post> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content, Pageable pageable);
    
    Page<Post> findByTagsIn(List<String> tags, Pageable pageable);
    
    // For "trending" or similar features, we might use sort in PageRequests, but custom queries can support more complex logic
    
    List<Post> findByUserId(String userId);
}
