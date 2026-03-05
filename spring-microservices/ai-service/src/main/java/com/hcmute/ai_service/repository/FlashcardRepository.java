package com.hcmute.ai_service.repository;

import com.hcmute.ai_service.model.Flashcard;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FlashcardRepository extends MongoRepository<Flashcard, String> {
}
