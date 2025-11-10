package com.hoangphihiep.document;

import com.hoangphihiep.helper.Indices;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.math.BigDecimal;

@Data
@Document(indexName = Indices.PUBLISHED_COURSE_INDEX)
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PublishedCourseDocument {
    @Id
    @Field(type = FieldType.Keyword)
    private String id;

    @Field(type = FieldType.Text) // analyzed for full-text search
    private String courseName;

    @Field(type = FieldType.Text)
    private String description;

    @Field(type = FieldType.Keyword) // not analyzed. used for filtering
    private String category;

    @Field(type = FieldType.Keyword)
    private String level;

    @Field(type = FieldType.Double)
    private BigDecimal price;

    @Field(type = FieldType.Double)
    private Double rating;

    @Field(type = FieldType.Integer)
    private Integer studentsCount;
}
