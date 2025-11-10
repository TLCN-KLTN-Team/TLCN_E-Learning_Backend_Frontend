package com.hoangphihiep.controller;

import com.hoangphihiep.utils.DataSeeder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/data-seeder")
@RequiredArgsConstructor
public class DataSeederController {

    private final DataSeeder dataSeeder;

    @PostMapping("/seed-courses")
    public ResponseEntity<String> seedCourses() {
        try {
            dataSeeder.seedCourses();
            return ResponseEntity.ok("Successfully created 100 published courses!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating courses: " + e.getMessage());
        }
    }
}
