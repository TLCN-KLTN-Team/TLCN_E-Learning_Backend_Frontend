package com.hoangphihiep.repository;

import com.hoangphihiep.entity.PayoutOrderItem;
import com.hoangphihiep.utils.PayoutOrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayoutOrderItemRepository extends JpaRepository<PayoutOrderItem, Integer> {
    
    List<PayoutOrderItem> findByOrderItemId(Integer orderItemId);
    
    List<PayoutOrderItem> findByRecipientIdAndRecipientType(String recipientId, com.hoangphihiep.utils.RecipientType recipientType);
    
    // For Escrow mechanism
    List<PayoutOrderItem> findByStatusAndHoldUntilBefore(PayoutOrderItemStatus status, LocalDateTime dateTime);

        @Query("""
                        SELECT p
                        FROM PayoutOrderItem p
                        WHERE p.status = :status
                            AND p.holdUntil IS NOT NULL
                            AND p.holdUntil <= CURRENT_TIMESTAMP
                        """)
        List<PayoutOrderItem> findReadyToReleaseByDbTime(@Param("status") PayoutOrderItemStatus status);
    
    Optional<PayoutOrderItem> findByOrderItemIdAndStatus(Integer orderItemId, PayoutOrderItemStatus status);
}
