package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.AuthenticationRequest;
import demo.app.chat_app.dto.response.AuthenticationResponse;

public interface AuthenticationService {
    AuthenticationResponse authenticate(AuthenticationRequest request);
    String generateToken(String username);
}
