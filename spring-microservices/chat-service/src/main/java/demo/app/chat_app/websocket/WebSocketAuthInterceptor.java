package demo.app.chat_app.websocket;

import demo.app.chat_app.config.CustomJwtDecoder;
import demo.app.chat_app.dto.request.IntrospectRequest;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.repository.httpclient.VerifyAccessToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private final CustomJwtDecoder jwtDecoder;
    private final VerifyAccessToken verifyAccessToken;
    
    // ThreadLocal to store token for Feign client
    private static final ThreadLocal<String> TOKEN_HOLDER = new ThreadLocal<>();
    
    public static String getToken() {
        return TOKEN_HOLDER.get();
    }
    
    public static void setToken(String token) {
        TOKEN_HOLDER.set(token);
    }
    
    public static void clearToken() {
        TOKEN_HOLDER.remove();
    }
    
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Lấy token từ header 'Authorization'
            String token = accessor.getFirstNativeHeader("Authorization");

            if (token == null || !token.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or invalid Authorization header");
            }

            String bearerToken = token; // Keep full "Bearer xxx" format
            String jwtToken = token.substring(7); // Remove "Bearer " for decoding
            log.info("ChannelInterceptor preSend: Processing CONNECT command with token: {}", jwtToken.substring(0, Math.min(20, jwtToken.length())));

            try {
                // Validate token using CustomJwtDecoder
                Jwt jwt = jwtDecoder.decode(jwtToken);

                if (jwt == null) {
                    throw new AppException(ErrorCode.INVALID_TOKEN);
                }
                // Get claims from JWT
                String userId = jwt.getSubject();
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, null);

                // Lưu vào session attributes (BAO GỒM TOKEN)
                accessor.getSessionAttributes().put("userId", userId);
                accessor.getSessionAttributes().put("authToken", bearerToken); // Lưu token đầy đủ với "Bearer "
                
                // Set to ThreadLocal for immediate use
                TOKEN_HOLDER.set(bearerToken);
                
                log.info("Token stored in session for user: {}", userId);

                accessor.setUser(authentication);
            } catch (Exception e) {
                log.error("Error processing CONNECT command", e);
                throw new IllegalArgumentException("Invalid token: " + e.getMessage());
            }
        } else {
            // For MESSAGE commands, retrieve token from session
            if (accessor.getSessionAttributes() != null) {
                String sessionToken = (String) accessor.getSessionAttributes().get("authToken");
                if (sessionToken != null) {
                    TOKEN_HOLDER.set(sessionToken);
                    log.debug("Token retrieved from session for MESSAGE command");
                }
            }
        }

        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        // Clear ThreadLocal after message processing
        TOKEN_HOLDER.remove();
    }
}