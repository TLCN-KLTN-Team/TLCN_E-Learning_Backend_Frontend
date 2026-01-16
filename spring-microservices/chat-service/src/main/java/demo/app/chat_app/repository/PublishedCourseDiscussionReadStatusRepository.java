package demo.app.chat_app.repository;

import demo.app.chat_app.model.PublishedDiscussionReadStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PublishedCourseDiscussionReadStatusRepository extends MongoRepository<PublishedDiscussionReadStatus, String> {
    
    Optional<PublishedDiscussionReadStatus> findByUserIdAndPublishedCourseIdAndQuizId(
            String userId,
            Integer publishedCourseId,
            Integer quizId
    );
    
    Optional<PublishedDiscussionReadStatus> findByUserIdAndPublishedCourseIdAndAssignmentId(
            String userId,
            Integer publishedCourseId,
            Integer assignmentId
    );
    
    Optional<PublishedDiscussionReadStatus> findByUserIdAndPublishedCourseIdAndLessonId(
            String userId,
            Integer publishedCourseId,
            Integer lessonId
    );
}
