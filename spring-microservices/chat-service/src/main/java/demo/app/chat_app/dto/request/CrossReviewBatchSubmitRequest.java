package demo.app.chat_app.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrossReviewBatchSubmitRequest {

    @NotNull
    @NotEmpty(message = "Danh sách điểm không được rỗng")
    @Valid
    private List<CrossReviewBatchEntry> entries;
}
