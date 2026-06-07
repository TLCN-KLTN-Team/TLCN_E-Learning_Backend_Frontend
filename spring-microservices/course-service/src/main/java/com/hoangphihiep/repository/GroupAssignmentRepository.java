package com.hoangphihiep.repository;

import com.hoangphihiep.entity.GroupAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupAssignmentRepository extends JpaRepository<GroupAssignment, Integer> {

    /** Một record / nhóm — khóa định danh để upsert idempotent theo (phiên, channel). */
    Optional<GroupAssignment> findBySessionIdAndChannelId(String sessionId, String channelId);

    /** Toàn bộ nhóm của một phiên. */
    List<GroupAssignment> findBySessionId(String sessionId);

    List<GroupAssignment> findByClassId(Integer classId);

    /** Bài tập nhóm của một sinh viên trong một lớp (mọi thành viên cùng nhóm cùng điểm). */
    @Query("SELECT ga FROM GroupAssignment ga JOIN ga.memberUserIds m WHERE ga.classId = :classId AND m = :userId")
    List<GroupAssignment> findByClassIdAndMemberUserId(@Param("classId") Integer classId,
                                                       @Param("userId") String userId);
}
