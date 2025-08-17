package demo.app.chat_app.service.impl;

import demo.app.chat_app.dto.response.UserProfileResponse;
import demo.app.chat_app.exception.AppException;
import demo.app.chat_app.exception.ErrorCode;
import demo.app.chat_app.model.Participant;
import demo.app.chat_app.repository.httpclient.GetListUsersClient;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipantService {
    private final GetListUsersClient getListUsersClient;

    @PreAuthorize("hasRole('USER')")
    public List<UserProfileResponse> getParticipantsByMssv(String mssv) {
        try {
            return getListUsersClient.getListUsers(mssv);
        } catch (FeignException fe) {
            // Handle the exception, e.g., log it or rethrow it
            throw new AppException(ErrorCode.USER_NOT_FOUND_FROM_FEIGN_CLIENT);
        }
    }

}
