package demo.app.chat_app.websocket;

import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class WebsocketSessionUtil {
    public static String getCurrentUserId(SimpMessageHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        return (String) sessionAttributes.get("userId");
    }
}
