package com.hoangphihiep.controller.Expert;

import com.hoangphihiep.dto.request.EquivalentCourseRequest;
import com.hoangphihiep.dto.response.EquivalentCourseResponse;
import com.hoangphihiep.service.EquivalentCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expert/equivalent-courses")
@RequiredArgsConstructor
public class EquivalentCourseController {

    private final EquivalentCourseService equivalentCourseService;

    @GetMapping
    public ResponseEntity<Page<EquivalentCourseResponse>> getAllEquivalentCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer targetCourseId,
            @PageableDefault(sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(equivalentCourseService.getAllEquivalentCourses(keyword, targetCourseId, pageable));
    }

    @PostMapping
    public ResponseEntity<EquivalentCourseResponse> createEquivalentCourse(@Valid @RequestBody EquivalentCourseRequest request) {
        return ResponseEntity.ok(equivalentCourseService.createEquivalentCourse(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquivalentCourseResponse> updateEquivalentCourse(@PathVariable Integer id, @Valid @RequestBody EquivalentCourseRequest request) {
        return ResponseEntity.ok(equivalentCourseService.updateEquivalentCourse(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquivalentCourse(@PathVariable Integer id) {
        equivalentCourseService.deleteEquivalentCourse(id);
        return ResponseEntity.noContent().build();
    }
}
