package com.hoangphihiep.scheduler;

import com.hoangphihiep.entity.OrderItem;
import com.hoangphihiep.entity.PayoutOrderItem;
import com.hoangphihiep.repository.PayoutOrderItemRepository;
import com.hoangphihiep.service.PayoutOrderItemService;
import com.hoangphihiep.utils.PaymentStatus;
import com.hoangphihiep.utils.PayoutOrderItemStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Batch Job để tự động release tiền từ escrow sau 7 ngày
 * Chạy mỗi ngày lúc 2:00 AM
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RevenueReleaseScheduler {
    
    private final PayoutOrderItemRepository payoutOrderItemRepository;
    private final PayoutOrderItemService payoutOrderItemService;
    
    /**
     * Chạy mỗi ngày lúc 2:00 AM
     * Cron format: second minute hour day month weekday
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void releaseHeldRevenue() {
        log.info("======================================");
        log.info("Starting revenue release batch job...");
        log.info("======================================");
        
        LocalDateTime now = LocalDateTime.now();
        int totalReleased = 0;
        int totalFailed = 0;
        
        try {
            // 1. Tìm các item HELD đã hết thời gian giữ
            List<PayoutOrderItem> heldItems = payoutOrderItemRepository
                    .findByStatusAndHoldUntilBefore(
                        PayoutOrderItemStatus.HELD, 
                        now
                    );
            
            log.info("Found {} escrow items ready to release", heldItems.size());
            
            // 2. Xử lý từng item
            for (PayoutOrderItem escrowItem : heldItems) {
                try {
                    // Kiểm tra OrderItem không bị refund
                    OrderItem orderItem = escrowItem.getOrderItem();
                    
                    if (orderItem.getPaymentStatus() != PaymentStatus.PAID) {
                        log.warn("OrderItem {} status is {}, skipping release", 
                                orderItem.getId(), 
                                orderItem.getPaymentStatus());
                        totalFailed++;
                        continue;
                    }
                    
                    // Kiểm tra canRefund
                    if (!escrowItem.getCanRefund()) {
                        log.warn("Escrow item {} has canRefund=false, skipping", 
                                escrowItem.getId());
                        totalFailed++;
                        continue;
                    }
                    
                    // Release và chia tiền
                    log.info("Releasing escrow item {} - Amount: {} VND", 
                            escrowItem.getId(), 
                            escrowItem.getAmount());
                    
                    payoutOrderItemService.releaseEscrowAndSplit(escrowItem);
                    
                    totalReleased++;
                    log.info("Successfully released escrow item {}", escrowItem.getId());
                    
                } catch (Exception e) {
                    totalFailed++;
                    log.error("Error releasing escrow item {}: {}", 
                            escrowItem.getId(), 
                            e.getMessage(), 
                            e);
                }
            }
            
        } catch (Exception e) {
            log.error("Fatal error in revenue release batch job", e);
        }
        
        log.info("======================================");
        log.info("Revenue release batch job completed");
        log.info("Total released: {}", totalReleased);
        log.info("Total failed: {}", totalFailed);
        log.info("======================================");
    }
    
    /**
     * TEST: Manual trigger để test (gọi qua API hoặc actuator)
     * Có thể expose qua REST endpoint cho admin trigger thủ công
     */
    public void manualTriggerRelease() {
        log.info("Manual trigger: Revenue release started");
        releaseHeldRevenue();
    }
}
