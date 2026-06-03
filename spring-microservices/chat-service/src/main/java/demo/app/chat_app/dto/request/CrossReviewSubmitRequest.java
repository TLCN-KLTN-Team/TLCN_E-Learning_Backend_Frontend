package demo.app.chat_app.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrossReviewSubmitRequest {

    /** ID của channel nhóm bị chấm. Bắt buộc vì một channel chấm nhiều nhóm. */
    @NotBlank(message = "reviewedChannelId không được để trống")
    private String reviewedChannelId;

    @NotNull
    @DecimalMin(value = "0.0", message = "Điểm tối thiểu là 0")
    @DecimalMax(value = "10.0", message = "Điểm tối đa là 10")
    private Double score;

    @Size(max = 2000, message = "Nhận xét tối đa 2000 ký tự")
    private String comment;
}
