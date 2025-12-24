package com.hoangphihiep.document;

import com.hoangphihiep.helper.Indices;
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
