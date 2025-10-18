package com.devteria.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public class FacebookUserInfoResponse {
    String id;
    String name;
    String email;
    Picture picture;

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    @Builder
    public static class Picture {
        private Data data;

        public Data getData() {
            return data;
        }

        public void setData(Data data) {
            this.data = data;
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        @lombok.Data
        @Builder
        public static class Data {
            private int height;
            private int width;

            @JsonProperty("is_silhouette")
            private boolean isSilhouette;

            private String url;
        }
    }
}
