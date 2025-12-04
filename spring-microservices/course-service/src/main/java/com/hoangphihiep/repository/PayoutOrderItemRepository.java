package com.hoangphihiep.repository;

import com.hoangphihiep.entity.PayoutOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutOrderItemRepository extends JpaRepository<PayoutOrderItem, Integer> {
    
    List<PayoutOrderItem> findByOrderItemId(Integer orderItemId);
    
    List<PayoutOrderItem> findByRecipientIdAndRecipientType(String recipientId, com.hoangphihiep.utils.RecipientType recipientType);
}
