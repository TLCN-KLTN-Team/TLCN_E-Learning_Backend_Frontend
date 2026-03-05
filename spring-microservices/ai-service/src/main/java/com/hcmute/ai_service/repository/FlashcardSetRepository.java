package com.hcmute.ai_service.repository;

import com.hcmute.ai_service.model.FlashcardSet;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardSetRepository extends MongoRepository<FlashcardSet, String> {
    
    /**
     * Tìm tất cả flashcard set theo authorId
     */
    List<FlashcardSet> findByAuthorId(String authorId);
}
