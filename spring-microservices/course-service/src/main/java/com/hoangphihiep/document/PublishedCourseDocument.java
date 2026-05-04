package com.hoangphihiep.document;

import com.hoangphihiep.helper.Indices;
import com.hoangphihiep.utils.PracticeType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.elasticsearch.annotations.*;
import org.springframework.data.elasticsearch.core.suggest.Completion;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(indexName = Indices.PUBLISHED_COURSE_INDEX)
public class PublishedCourseDocument {
    @Id
    @Field(type = FieldType.Keyword)
    private String id;

    @MultiField(
            mainField = @Field(type = FieldType.Text, analyzer = "standard"),
            otherFields = {
                    @InnerField(suffix = "keyword", type = FieldType.Keyword),
                    @InnerField(suffix = "raw", type = FieldType.Text, analyzer = "keyword")
            }
    )
    private String courseName;

    @MultiField(
            mainField = @Field(type = FieldType.Text),
            otherFields = @InnerField(suffix = "keyword", type = FieldType.Keyword)
    )
    private String description;

    @Field(type = FieldType.Text)
    private String courseIntroduction;

    @MultiField(
            mainField = @Field(type = FieldType.Text),
            otherFields = @InnerField(suffix = "keyword", type = FieldType.Keyword)
    )
    private String category;

    @Field(type = FieldType.Keyword)
    private String level;

    @Field(type = FieldType.Text)
    private String instructor;

    @Field(type = FieldType.Double)
    private BigDecimal price;

    @Field(type = FieldType.Double)
    private Double rating;

    @Field(type = FieldType.Integer)
    private Integer studentsCount;

    @Field(type = FieldType.Boolean)
    private Boolean isFree;

    @Field(type = FieldType.Keyword)
    private List<String> practiceTypes; // ["QUIZ", "CODING"] - 1 khóa có thể có nhiều loại

    @Field(type = FieldType.Date)
    private LocalDate createdAt;

    @Field(type = FieldType.Date)
    private LocalDate updatedAt;

    /**
     * Dùng cho autocomplete tên khóa học
     * VD: User gõ "java spr" → gợi ý "Java Spring Boot"
     */
    @CompletionField(maxInputLength = 100)
    private Completion titleSuggest;

    /**
     * Dùng cho autocomplete category
     * VD: User gõ "web" → gợi ý "Web Development"
     */
    @CompletionField(maxInputLength = 50)
    private Completion categorySuggest;

    public void buildDerivedFields() {
        this.buildFee();
        this.buildCompletionFields();
        this.buildPracticeTypes();
    }

    private void buildFee() {
        this.isFree = (this.price != null && this.price.compareTo(BigDecimal.ZERO) == 0);
    }

    private void buildPracticeTypes() {
        if (this.practiceTypes == null || this.practiceTypes.isEmpty()) return;

        this.practiceTypes = this.practiceTypes.stream()
                .map(this::normalizePracticeType)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private String normalizePracticeType(String value) {
        if (value == null) return null;
        return switch (value.toLowerCase().trim()) {
            case "quiz"          -> PracticeType.QUIZ.name();          // → "QUIZ"
            case "practice-test" -> PracticeType.PRACTICE_TEST.name(); // → "PRACTICE_TEST"
            case "coding"        -> PracticeType.CODING.name();        // → "CODING"
            default              -> null; // Bỏ qua giá trị không hợp lệ
        };
    }

    public void buildCompletionFields(){
        // Build course name suggestions
        if (this.courseName != null && !this.courseName.isEmpty()) {
            this.titleSuggest = new Completion(new String[]{this.courseName});

            // Weight cao hơn = xuất hiện trước trong suggestions
            if (this.rating != null && this.studentsCount != null) {
                int weight = calculateWeight(this.rating, this.studentsCount);
                this.titleSuggest.setWeight(weight);
            }
        }

        // Build category suggestions
        if (this.category != null && !this.category.isEmpty()) {
            this.categorySuggest = new Completion(new String[]{this.category});
        }
    }

    /**
     * Tính weight dựa trên rating và số học viên
     * Khóa học có rating cao + nhiều học viên = weight cao = xuất hiện trước
     */
    private int calculateWeight(Double rating, Integer studentsCount) {
        // Formula: weight = (rating * 10) + log10(studentsCount)
        double ratingScore = rating * 10; // 0-50 points
        double popularityScore = Math.log10(studentsCount + 1) * 5; // 0-25 points
        return (int) Math.min(ratingScore + popularityScore, 100);
    }

}
