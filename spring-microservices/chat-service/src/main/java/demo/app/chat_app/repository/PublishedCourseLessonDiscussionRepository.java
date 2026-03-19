package demo.app.chat_app.repository;

import demo.app.chat_app.model.PublishedLessonMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PublishedCourseLessonDiscussionRepository extends MongoRepository<PublishedLessonMessage, String> {
    Page<PublishedLessonMessage> findByPublishedCourseIdAndLessonId(Integer publishedCourseId, Integer lessonId, Pageable pageable);
    Long countByPublishedCourseIdAndLessonId(Integer publishedCourseId, Integer lessonId);
    Long countByPublishedCourseIdAndLessonIdAndCreatedAtAfter(Integer publishedCourseId, Integer lessonId, LocalDateTime createdAt);
}
