package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Integer> {

    List<Answer> findByQuestionId(int questionId);

    List<Answer> findByQuestionIdAndIsCorrect(Integer questionId, Boolean isCorrect);
}
