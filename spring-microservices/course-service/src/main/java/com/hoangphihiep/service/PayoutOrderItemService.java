package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.AdminRevenueResponse;
import com.hoangphihiep.dto.response.SystemRevenueResponse;
import com.hoangphihiep.dto.response.TeacherRevenueResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.repository.PayoutOrderItemRepository;
import com.hoangphihiep.repository.RevenueShareConfigRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.utils.PaymentStatus;
import com.hoangphihiep.utils.PayoutOrderItemStatus;
import com.hoangphihiep.utils.RecipientType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
    private final RevenueService revenueService;
    private final TeacherRepository teacherRepository;

    @Value("${app.revenue.escrow-hold-days:0}")
    private int escrowHoldDays;

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public PayoutOrderItem createPayoutOrderItems(OrderItem orderItem) {
        
        try {
            BigDecimal totalAmount = orderItem.getFinishedFee();
            
            // Get SUPER_ADMIN config for escrow (cần có để satisfy nullable=false)
            RevenueShareConfig superAdminConfig = revenueShareConfigRepository
                    .findByRecipientTypeAndIsActiveTrue(RecipientType.SUPER_ADMIN)
                    .orElseThrow(() -> new RuntimeException("SUPER_ADMIN revenue config not found"));

            PayoutOrderItem escrowItem = PayoutOrderItem.builder()
                    .orderItem(orderItem)
                    .revenueShareConfig(superAdminConfig)  // Set config thay vì null
                    .recipientType(RecipientType.SUPER_ADMIN)
                    .recipientId("SYSTEM")
                    .amount(totalAmount)  // 100% tiền
                    .sharePercentageSnapshot(100.0)  // 100% trong escrow, sẽ chia sau
                    .status(PayoutOrderItemStatus.HELD)  // ⏳ Đang tạm giữ
                    .accruedAt(LocalDateTime.now())
                    .holdUntil(LocalDateTime.now().plusDays(escrowHoldDays))  // Config được, mặc định giữ 7 ngày
                    .canRefund(true)  // Cho phép refund trong 7 ngày
                    .build();
            
            PayoutOrderItem saved = payoutOrderItemRepository.save(escrowItem);
            
            return saved;
            
        } catch (Exception e) {
            throw e;
        }
    }

    @Transactional
    public boolean releaseEscrowAndSplitById(Integer escrowItemId) {
        PayoutOrderItem escrowItem = payoutOrderItemRepository.findById(escrowItemId)
                .orElseThrow(() -> new RuntimeException("Escrow item not found: " + escrowItemId));

        if (escrowItem.getStatus() != PayoutOrderItemStatus.HELD) {
            log.warn("Escrow item {} status is {}, skipping", escrowItemId, escrowItem.getStatus());
            return false;
        }

        OrderItem orderItem = escrowItem.getOrderItem();
        if (orderItem.getPaymentStatus() != PaymentStatus.PAID) {
            log.warn("OrderItem {} status is {}, skipping release",
                    orderItem.getId(),
                    orderItem.getPaymentStatus());
            return false;
        }

        if (!Boolean.TRUE.equals(escrowItem.getCanRefund())) {
            log.warn("Escrow item {} has canRefund=false, skipping", escrowItemId);
            return false;
        }

        releaseEscrowAndSplit(escrowItem);
        return true;
    }

    @Transactional
    public void releaseEscrowAndSplit(PayoutOrderItem escrowItem) {

        if (escrowItem.getStatus() == PayoutOrderItemStatus.RELEASED) {
            log.info("Escrow item {} already released, skipping...", escrowItem.getId());
            return;
        }

        OrderItem orderItem = escrowItem.getOrderItem();

        long existingAccruedCount = payoutOrderItemRepository.findByOrderItemId(orderItem.getId())
                .stream()
                .filter(item -> item.getStatus() == PayoutOrderItemStatus.ACCRUED)
                .count();
        
        if (existingAccruedCount >= 3) {
            log.warn("Payout items already created for order_item {}, marking escrow as RELEASED", orderItem.getId());
            escrowItem.setStatus(PayoutOrderItemStatus.RELEASED);
            escrowItem.setReleasedAt(LocalDateTime.now());
            escrowItem.setCanRefund(false);
            payoutOrderItemRepository.save(escrowItem);
            return;
        }
        
        PublishedCourse course = orderItem.getCourse();
        BigDecimal totalAmount = escrowItem.getAmount();
        
        // ⭐ LẤY THỜI GIAN MUA BAN ĐẦU từ escrow item thay vì dùng NOW
        LocalDateTime originalAccruedAt = escrowItem.getAccruedAt();
        
        // Get all active revenue share configs
        List<RevenueShareConfig> activeConfigs = revenueShareConfigRepository.findByIsActiveTrue();
        
        if (activeConfigs.isEmpty()) {
            log.warn("No active revenue share configs found!");
            return;
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
                    .accruedAt(originalAccruedAt)  // ⭐ Dùng thời điểm MUA, không phải NOW
                    .canRefund(false)  // Không thể refund sau khi đã release
                    .build();
            
            payoutOrderItemRepository.save(payoutOrderItem);
            
            log.info("Released to {} (ID: {}): {} VND ({}% of {}) - Original accrued: {}", 
                    config.getRecipientType(), 
                    recipientId, 
                    shareAmount, 
                    config.getSharePercentage(), 
                    totalAmount,
                    originalAccruedAt);
        }
        
        // Update escrow item to RELEASED
        escrowItem.setStatus(PayoutOrderItemStatus.RELEASED);
        escrowItem.setReleasedAt(LocalDateTime.now());
        escrowItem.setCanRefund(false);
        payoutOrderItemRepository.save(escrowItem);
        
        log.info("Successfully released escrow item {} and split revenue", escrowItem.getId());
    }

    private String determineRecipientId(RecipientType recipientType, PublishedCourse course) {
        return switch (recipientType) {
            case TEACHER -> teacherRepository.getTeacherByTeacherId(course.getCourse().getIdTeacher()).getResult().getId();
            case ADMIN -> getEducationalUnitAdminId(course); // Admin của educational unit
            case SUPER_ADMIN -> "SYSTEM"; // System revenue
        };
    }


    private String getEducationalUnitAdminId(PublishedCourse course) {
        if (course.getCourse().getEducationalUnit() != null) {
            return course.getCourse().getEducationalUnit().getIdAdmin();
        }
        return null;
    }

    public List<PayoutOrderItem> getPayoutItemsByOrderItem(Integer orderItemId) {
        return payoutOrderItemRepository.findByOrderItemId(orderItemId);
    }
    
    public PayoutOrderItemRepository getPayoutOrderItemRepository() {
        return payoutOrderItemRepository;
    }

    /**
     * Hoàn tác các khoản chia doanh thu của một OrderItem đã hoàn tiền
     */
    @Transactional
    public void refundPayoutItems(Integer orderItemId) {
        List<PayoutOrderItem> payoutItems = payoutOrderItemRepository.findByOrderItemId(orderItemId);

        for (PayoutOrderItem item : payoutItems) {
            // Only reverse if not already reversed or settled
            // Note: If SETTLED, we might need a different handling (e.g. REVERSED_AFTER_SETTLEMENT),
            // but for now assumming we catch it before settlement or simple REVERSED is enough.
            if (item.getStatus() != PayoutOrderItemStatus.REVERSED &&
                    item.getStatus() != PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT) {

                if(item.getStatus() == PayoutOrderItemStatus.SETTLED) {
                    item.setStatus(PayoutOrderItemStatus.REVERSED_AFTER_SETTLEMENT);
                } else {
                    item.setStatus(PayoutOrderItemStatus.REVERSED);
                }
                log.info("Reversed payout item {} (Recipient: {}) due to refund", item.getId(), item.getRecipientType());
            }
        }
        payoutOrderItemRepository.saveAll(payoutItems);
    }

    public TeacherRevenueResponse getTeacherRevenue() {
        return revenueService.getTeacherRevenue();
    }
    
    public TeacherRevenueResponse getTeacherRevenueByRange(String startDate, String endDate) {
        return revenueService.getTeacherRevenueByRange(startDate, endDate);
    }

    public AdminRevenueResponse getAdminRevenue() {
        return revenueService.getAdminRevenue();
    }
    
    public AdminRevenueResponse getAdminRevenueByRange(String startDate, String endDate) {
        return revenueService.getAdminRevenueByRange(startDate, endDate);
    }

    public SystemRevenueResponse getSystemRevenue() {
        return revenueService.getSystemRevenue();
    }
    
    public SystemRevenueResponse getSystemRevenueByRange(String startDate, String endDate) {
        return revenueService.getSystemRevenueByRange(startDate, endDate);
    }

    public List<TeacherRevenueResponse> getAllTeachersRevenue() {
        return revenueService.getAllTeachersRevenue();
    }

    public List<TeacherRevenueResponse> getAllTeachersRevenueByRange(String startDate, String endDate) {
        return revenueService.getAllTeachersRevenueByRange(startDate, endDate);
    }

    public List<AdminRevenueResponse> getAllAdminsRevenue() {
        return revenueService.getAllAdminsRevenue();
    }
}
