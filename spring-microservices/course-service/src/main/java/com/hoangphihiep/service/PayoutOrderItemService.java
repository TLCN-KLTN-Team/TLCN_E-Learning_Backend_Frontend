package com.hoangphihiep.service;

import com.hoangphihiep.entity.*;
import com.hoangphihiep.repository.PayoutOrderItemRepository;
import com.hoangphihiep.repository.RevenueShareConfigRepository;
import com.hoangphihiep.utils.PayoutOrderItemStatus;
import com.hoangphihiep.utils.RecipientType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayoutOrderItemService {
    
    private final PayoutOrderItemRepository payoutOrderItemRepository;
    private final RevenueShareConfigRepository revenueShareConfigRepository;
    
    /**
     * Tính toán và tạo PayoutOrderItem cho tất cả recipients (Teacher, Admin, System)
     * dựa trên RevenueShareConfig khi OrderItem được thanh toán thành công
     */
    @Transactional
    public List<PayoutOrderItem> createPayoutOrderItems(OrderItem orderItem) {
        List<PayoutOrderItem> payoutOrderItems = new ArrayList<>();
        
        // Get course and related entities
        PublishedCourse course = orderItem.getCourse();
        BigDecimal totalAmount = BigDecimal.valueOf(orderItem.getFinishedFee());
        
        // Get all active revenue share configs
        List<RevenueShareConfig> activeConfigs = revenueShareConfigRepository.findByIsActiveTrue();
        
        if (activeConfigs.isEmpty()) {
            log.warn("No active revenue share configs found!");
            return payoutOrderItems;
        }
        
        // Tính toán phần tiền cho từng recipient
        for (RevenueShareConfig config : activeConfigs) {
            BigDecimal shareAmount = totalAmount
                    .multiply(BigDecimal.valueOf(config.getSharePercentage()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            
            String recipientId = determineRecipientId(config.getRecipientType(), course);
            
            if (recipientId == null) {
                log.warn("Cannot determine recipient ID for type: {}", config.getRecipientType());
                continue;
            }
            
            PayoutOrderItem payoutOrderItem = PayoutOrderItem.builder()
                    .orderItem(orderItem)
                    .revenueShareConfig(config)
                    .recipientType(config.getRecipientType())
                    .recipientId(recipientId)
                    .amount(shareAmount)
                    .sharePercentageSnapshot(config.getSharePercentage())
                    .status(PayoutOrderItemStatus.ACCRUED)
                    .accruedAt(LocalDateTime.now())
                    .build();
            
            payoutOrderItems.add(payoutOrderItem);
            
            log.info("Created payout for {} (ID: {}): {} ({}% of {})", 
                    config.getRecipientType(), 
                    recipientId, 
                    shareAmount, 
                    config.getSharePercentage(), 
                    totalAmount);
        }
        
        // Save all payout order items
        List<PayoutOrderItem> savedItems = payoutOrderItemRepository.saveAll(payoutOrderItems);
        
        log.info("Successfully created {} payout items for OrderItem ID: {}", 
                savedItems.size(), orderItem.getId());
        
        return savedItems;
    }
    
    /**
     * Xác định recipient ID dựa trên RecipientType
     */
    private String determineRecipientId(RecipientType recipientType, PublishedCourse course) {
        return switch (recipientType) {
            case TEACHER -> course.getCourse().getIdTeacher(); // Teacher của course
            case ADMIN -> getEducationalUnitAdminId(course); // Admin của educational unit
            case SUPER_ADMIN -> "SYSTEM"; // System revenue
        };
    }
    
    /**
     * Lấy admin ID của educational unit từ course
     */
    private String getEducationalUnitAdminId(PublishedCourse course) {
        // Giả sử educational unit có admin ID
        // Có thể cần điều chỉnh dựa trên cấu trúc entity thực tế
        if (course.getCourse().getEducationalUnit() != null) {
            return course.getCourse().getEducationalUnit().getIdAdmin();
        }
        return null;
    }
    
    /**
     * Get all payout items for an order item
     */
    public List<PayoutOrderItem> getPayoutItemsByOrderItem(Integer orderItemId) {
        return payoutOrderItemRepository.findByOrderItemId(orderItemId);
    }
}
