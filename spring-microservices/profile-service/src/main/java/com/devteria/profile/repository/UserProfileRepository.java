package com.devteria.profile.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import com.devteria.profile.entity.UserProfile;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends Neo4jRepository<UserProfile, String> {
    
    @Query("""
        MATCH (userProfile:user_profile) 
        WHERE userProfile.userId = $userId 
        RETURN userProfile {
            .id, .userId, .avatar, .username, .email, 
            .firstName, .lastName, .dob, .city
        }
        """)
    Optional<UserProfile> findByUserId(String userId);
    
    @Query("""
        MATCH (userProfile:user_profile) 
        WHERE userProfile.username CONTAINS $username 
        RETURN userProfile {
            .id, .userId, .avatar, .username, .email, 
            .firstName, .lastName, .dob, .city
        }
        """)
    List<UserProfile> findAllByUsernameLike(String username);
    
    @Query("""
        MATCH (userProfile:user_profile) 
        WHERE userProfile.id = $id 
        RETURN userProfile {
            .id, .userId, .avatar, .username, .email, 
            .firstName, .lastName, .dob, .city
        }
        """)
    Optional<UserProfile> findById(String id);
    
    @Query("""
        MATCH (userProfile:user_profile) 
        RETURN userProfile {
            .id, .userId, .avatar, .username, .email, 
            .firstName, .lastName, .dob, .city
        }
        """)
    List<UserProfile> findAll();
}
