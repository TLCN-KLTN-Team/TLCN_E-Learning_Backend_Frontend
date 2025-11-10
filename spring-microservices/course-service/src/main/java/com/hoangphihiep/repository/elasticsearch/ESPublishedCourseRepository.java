package com.hoangphihiep.repository.elasticsearch;

import com.hoangphihiep.document.PublishedCourseDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface ESPublishedCourseRepository extends ElasticsearchRepository<PublishedCourseDocument, Integer> {

}
