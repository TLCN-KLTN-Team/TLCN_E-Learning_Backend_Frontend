package demo.app.chat_app.config;

import demo.app.chat_app.websocket.WebSocketAuthInterceptor;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign Request Interceptor với Client Credentials pattern
 *
 * Ưu tiên token:
 * 1. Service Token (nếu context được đánh dấu)
 * 2. WebSocket User Token
 * 3. HTTP Request User Token
 * 4. Fallback Service Token (cho background tasks)
 */
@Slf4j
@Component
public class AuthenticationRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        // 1) Ưu tiên lấy token từ WebSocket ThreadLocal
        String authHeader = WebSocketAuthInterceptor.getToken();

        // 2) Nếu không có, fallback sang HTTP request
        if (!StringUtils.hasText(authHeader)) {
            ServletRequestAttributes servletRequestAttributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (servletRequestAttributes != null && servletRequestAttributes.getRequest() != null) {
                authHeader = servletRequestAttributes.getRequest().getHeader("Authorization");
                log.debug("Token retrieved from HTTP request: {}", authHeader);
            }
        } else {
            log.debug("Token retrieved from WebSocket ThreadLocal");
        }

        // 3) Gán token nếu có
        if (StringUtils.hasText(authHeader)) {
            template.header("Authorization", authHeader);
            log.debug("Authorization header added to Feign request: {} {}", template.method(), template.url());
        } else {
            log.warn("No authorization token available for Feign request: {} {}", template.method(), template.url());
        }
    }
}
