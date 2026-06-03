package com.hcmute.ai_service.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/ai/parser")
@RequiredArgsConstructor
@Slf4j
public class DocumentParserController {

    private final WebClient documentParserWebClient;

    @PostMapping(value = "/summary", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamingSummarize(@RequestPart("file") MultipartFile file) throws java.io.IOException {

        log.info("Received file: name={}, size={}", file.getOriginalFilename(), file.getSize());

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(file.getBytes()))
                .filename(file.getOriginalFilename())
                .contentType(MediaType.parseMediaType(
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream"));

        return documentParserWebClient.post()
                .uri("/summarize")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .accept(MediaType.TEXT_EVENT_STREAM, MediaType.TEXT_PLAIN, MediaType.ALL)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, response -> response.bodyToMono(String.class)
                        .flatMap(body -> {
                            log.error("Python parser 4xx: {}", body);
                            return Mono.error(new RuntimeException("Parser service error: " + body));
                        }))
                .onStatus(HttpStatusCode::is5xxServerError, response -> response.bodyToMono(String.class)
                        .flatMap(body -> {
                            log.error("Python parser 5xx: {}", body);
                            return Mono.error(new RuntimeException("Parser service unavailable: " + body));
                        }))
                .bodyToFlux(String.class)
                .onErrorResume(e -> {
                    log.error("Stream error: {}", e.getMessage(), e);
                    return Flux.just("ERROR:" + e.getMessage());
                });
    }
}
