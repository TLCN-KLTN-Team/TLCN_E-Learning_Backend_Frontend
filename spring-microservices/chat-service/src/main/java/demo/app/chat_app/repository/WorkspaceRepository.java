package demo.app.chat_app.repository;

import demo.app.chat_app.model.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends MongoRepository<Workspace, String> {
    
    // Find workspaces by owner
    @Query("{ 'ownerId': ?0, 'isActive': true }")
    Page<Workspace> findByOwnerIdAndIsActive(String ownerId, Pageable pageable);
    
    // Find workspaces where user is member
    @Query("{ 'members.userId': ?0, 'isActive': true }")
    Page<Workspace> findByMemberUserIdAndIsActive(String userId, Pageable pageable);
    
    // Find all workspaces for user (as owner or member)
    @Query("{ $or: [ { 'ownerId': ?0 }, { 'members.userId': ?0 } ], 'isActive': true }")
    Page<Workspace> findByOwnerIdOrMemberUserIdAndIsActive(String userId, Pageable pageable);
    
    // Find workspaces by course
    @Query("{ 'courseId': ?0, 'isActive': true }")
    List<Workspace> findByCourseIdAndIsActive(String courseId);
    
    // Find workspace by course and owner
    @Query("{ 'courseId': ?0, 'ownerId': ?1, 'isActive': true }")
    Optional<Workspace> findByCourseIdAndOwnerIdAndIsActive(String courseId, String ownerId);
    
    // Check if user has access to workspace
    @Query(value = "{ 'id': ?0, $or: [ { 'ownerId': ?1 }, { 'members.userId': ?1 } ], 'isActive': true }", exists = true)
    boolean existsByIdAndUserHasAccess(String workspaceId, String userId);

    boolean existsByCourseId(Integer courseId);
    
    // Search workspaces by name
    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'isActive': true }")
    Page<Workspace> findByNameContainingIgnoreCaseAndIsActive(String name, Pageable pageable);
    
    // Search workspaces by name where user has access
    @Query("{ 'name': { $regex: ?0, $options: 'i' }, $or: [ { 'ownerId': ?1 }, { 'members.userId': ?1 } ], 'isActive': true }")
    Page<Workspace> findByNameContainingAndUserHasAccessAndIsActive(String name, String userId, Pageable pageable);
    
    // Count workspaces by owner
    @Query(value = "{ 'ownerId': ?0, 'isActive': true }", count = true)
    long countByOwnerIdAndIsActive(String ownerId);
    
    // Soft delete workspace
    @Query("{ 'id': ?0 }")
    @org.springframework.data.mongodb.repository.Update("{ $set: { 'isActive': false, 'updatedAt': ?1 } }")
    void softDeleteWorkspace(String workspaceId, java.time.Instant deletedAt);

    Optional<Workspace> findByCourseId(Integer courseId);
}
