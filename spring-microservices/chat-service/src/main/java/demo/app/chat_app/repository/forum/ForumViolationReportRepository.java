package demo.app.chat_app.repository.forum;

import demo.app.chat_app.model.forum.ForumViolationReport;
import demo.app.chat_app.model.forum.ReportStatus;
import demo.app.chat_app.model.forum.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumViolationReportRepository extends MongoRepository<ForumViolationReport, String> {
    Page<ForumViolationReport> findByStatusAndDeletedFalse(ReportStatus status, Pageable pageable);
    
    List<ForumViolationReport> findByTargetIdAndDeletedFalse(String targetId);
    
    Page<ForumViolationReport> findByReporterIdAndDeletedFalse(String reporterId, Pageable pageable);
    
    Page<ForumViolationReport> findByTargetTypeAndDeletedFalse(ReportTargetType targetType, Pageable pageable);
    
    long countByStatusAndDeletedFalse(ReportStatus status);
    
    @Query("{'status': ?0, 'targetId': ?1, 'deleted': false}")
    List<ForumViolationReport> findPendingReportsByTargetId(ReportStatus status, String targetId);
}
