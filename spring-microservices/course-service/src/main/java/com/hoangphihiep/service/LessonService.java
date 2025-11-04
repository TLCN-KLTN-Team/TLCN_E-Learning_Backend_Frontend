package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.LessonResponse;
import com.hoangphihiep.entity.Lesson;
import com.hoangphihiep.mapper.LessonMapper;
import com.hoangphihiep.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {
    private final LessonRepository lessonRepository;
    private final LessonMapper lessonMapper;

    public List<LessonResponse> getLessonsBySectionId(Integer sectionId) {
        List<Lesson> lessons = lessonRepository.findBySectionId(sectionId);
        return lessonMapper.toListLessonResponse(lessons);
    }
}
