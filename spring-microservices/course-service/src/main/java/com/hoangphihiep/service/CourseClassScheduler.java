package com.hoangphihiep.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CourseClassScheduler {

    private final CourseClassService courseClassService;

    @Scheduled(cron = "0 0 0 * * *")
    public void autoArchiveExpiredClasses() {
        try {
            log.info("Starting auto-archive task for expired classes...");
            courseClassService.autoArchiveExpiredClasses();
            log.info("Auto-archive task completed successfully");
        } catch (Exception e) {
            log.error("Error during auto-archive task", e);
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            log.info("Application started. Running auto-archive check on startup...");
            courseClassService.autoArchiveExpiredClasses();
            log.info("Startup auto-archive check completed");
        } catch (Exception e) {
            log.error("Error during startup auto-archive check", e);
        }
    }
}
