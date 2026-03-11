package com.hcmute.ai_service.controller;

import com.hcmute.ai_service.config.WebClientConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/ai/parser")
@RequiredArgsConstructor
public class DocumentParserController {

    private final WebClientConfig clientConfig;

    @PostMapping(value = "/summary", produces = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Flux<String> streamingSummarize(@RequestPart("file") MultipartFile file) {

        return clientConfig.documentParserWebClient().post()
                .uri("/summarize")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData("file", file.getResource()))
                .retrieve()
                .bodyToFlux(String.class);
    }




}
