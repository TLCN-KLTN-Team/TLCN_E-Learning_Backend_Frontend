package com.hcmute.ai_service.repository;

import com.hcmute.ai_service.model.QuizSet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizSetRepository extends MongoRepository<QuizSet, String> {

    List<QuizSet> findByAuthorId(String authorId);

    Optional<QuizSet> findByQuizSetId(String quizSetId);
}
