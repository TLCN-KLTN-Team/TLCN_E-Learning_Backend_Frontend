package demo.app.chat_app.repository;

import demo.app.chat_app.model.workspace.Workspace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends MongoRepository<Workspace, String> {

    // Find workspaces by user access (owner or member)
    Page<Workspace> findAllByIdIn(Collection<String> ids, Pageable pageable);
    
    // Find workspace by course and owner
    @Query("{ 'courseId': ?0, 'ownerId': ?1, 'isActive': true }")
    Optional<Workspace> findByCourseIdAndOwnerIdAndIsActive(String courseId, String ownerId);

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

    Optional<Workspace> findByCourseId(Integer courseId);


}
