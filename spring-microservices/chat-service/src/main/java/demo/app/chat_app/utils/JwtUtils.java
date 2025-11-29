package demo.app.chat_app.utils;

import org.springframework.security.core.context.SecurityContextHolder;

public class JwtUtils {
    public static String getUserId(){
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
