package demo.app.chat_app.websocket;

import demo.app.chat_app.config.CustomJwtDecoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private final CustomJwtDecoder jwtDecoder;
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Lấy token từ header 'Authorization'
            String token = accessor.getFirstNativeHeader("Authorization");

            if (token == null || !token.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or invalid Authorization header");
            }

            token = token.substring(7);
            log.info("ChannelInterceptor preSend: Processing CONNECT command with token: {}", token);
            
            try {
                // Validate token using CustomJwtDecoder
                Jwt jwt = jwtDecoder.decode(token);
                
                if (jwt == null) {
                    throw new IllegalArgumentException("Invalid token");
                }

                // Nếu muốn, set Principal cho session
                String username = jwt.getClaimAsString("username");
                if (username == null) {
                    username = jwt.getSubject(); // fallback to subject if username claim not found
                }
                accessor.setUser(new UsernamePasswordAuthenticationToken(username, null, List.of()));
                
            } catch (Exception e) {
                log.error("Error processing CONNECT command", e);
                throw new IllegalArgumentException("Invalid token: " + e.getMessage());
            }
        }

        return message;
    }
}