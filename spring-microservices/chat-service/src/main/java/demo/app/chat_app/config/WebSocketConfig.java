package demo.app.chat_app.config;

import demo.app.chat_app.websocket.CustomHandshakeHandler;
import demo.app.chat_app.websocket.WebSocketAuthInterceptor;
import demo.app.chat_app.websocket.WebSocketAuthenticationInterceptor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Slf4j
@Configuration
@RequiredArgsConstructor
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final WebSocketAuthInterceptor interceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        log.info("Registering stomp endpoints");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        log.info("Registering stomp endpoints completed");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        log.info("Configuring message broker");
        // Enable simple in-memory broker for destinations starting with /topic or /queue
        config.enableSimpleBroker("/topic", "/queue");
        
        // Messages sent to /app/* will be routed to @MessageMapping annotated methods
        config.setApplicationDestinationPrefixes("/app");
        
        // Messages sent to /user/* will be routed to specific users
        config.setUserDestinationPrefix("/user");
        
        log.info("Message broker configured successfully");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(interceptor);
    }
}
