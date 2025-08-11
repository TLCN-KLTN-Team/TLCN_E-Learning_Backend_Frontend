package demo.app.chat_app.websocket;

import demo.app.chat_app.config.CustomJwtDecoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthenticationInterceptor implements HandshakeInterceptor {
    private final CustomJwtDecoder jwtDecoder;
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        log.info("WebSocket handshake intercepted: {}", request.getURI());

        // Skip authentication for SockJS info endpoints
        String path = request.getURI().getPath();
        if (path.contains("/info/")) {
            log.info("Skipping authentication for SockJS info endpoint: {}", path);
            return true;
        }

        try {
            // Extract token from query parameter
            String token = extractTokenFromRequest(request);

            if (token == null || token.isEmpty()) {
                log.error("No token found in WebSocket handshake request");
                return false;
            }

            // Validate token
            Jwt jwt = jwtDecoder.decode(token);

            if (jwt == null) {
                log.error("Invalid JWT token");
                return false;
            }

            // Store user information in WebSocket session attributes
            attributes.put("userId", jwt.getSubject());
            attributes.put("scope", jwt.getClaimAsString("scope"));
            attributes.put("jwt", jwt);
            String userId = jwt.getSubject();
            String scope = jwt.getClaimAsString("scope");
            List<? extends GrantedAuthority> listAuth = AuthorityUtils.commaSeparatedStringToAuthorityList(scope);

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null, // No credentials needed for WebSocket
                    listAuth
            );
            // Gắn Authentication vào attributes
            attributes.put("auth", authentication);

            log.info("WebSocket authentication successful for user: {}", jwt.getSubject());
            return true;

        } catch (Exception e) {
            log.error("WebSocket authentication failed", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            log.error("WebSocket handshake failed", exception);
        } else {
            log.info("WebSocket handshake completed successfully");
        }
    }

    private String extractTokenFromRequest(ServerHttpRequest request) {
        URI uri = request.getURI();

        // Try to get token from query parameter
        Map<String, String> queryParams = UriComponentsBuilder.fromUri(uri).build().getQueryParams().toSingleValueMap();
        String token = queryParams.get("token");

        if (token != null) {
            log.debug("Token found in query parameter");
            return token;
        }

        // Fallback: try to get from Authorization header (though less common for WebSocket)
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            log.debug("Token found in Authorization header");
            return authHeader.substring(7);
        }

        log.warn("No token found in request");
        return null;
    }
}
