package demo.app.chat_app.service.impl;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * UC-41: kiểm tra ChannelServiceImpl.buildCircularPairing.
 *
 * Đảm bảo:
 *   - Mỗi id chấm đúng 1 id khác.
 *   - Không có id nào tự chấm chính nó.
 *   - Tất cả id đều được phân công và đều xuất hiện đúng 1 lần làm target.
 *   - Toàn bộ tạo thành đúng 1 chu trình bao trùm tất cả id.
 */
class CircularPairingTest {

    @Test
    void pairing_with2Channels_assignsEachOther() {
        Map<String, String> pairing = ChannelServiceImpl.buildCircularPairing(
                List.of("A", "B"), new Random(42));

        assertThat(pairing).hasSize(2);
        assertThat(pairing.get("A")).isEqualTo("B");
        assertThat(pairing.get("B")).isEqualTo("A");
    }

    @Test
    void pairing_with4Channels_isSingleCycleAndNoSelfReview() {
        List<String> ids = List.of("A", "B", "C", "D");
        Map<String, String> pairing = ChannelServiceImpl.buildCircularPairing(ids, new Random(7));

        // không tự chấm
        for (Map.Entry<String, String> e : pairing.entrySet()) {
            assertThat(e.getKey()).isNotEqualTo(e.getValue());
        }
        // mỗi id xuất hiện đúng 1 lần làm target
        Set<String> targets = new HashSet<>(pairing.values());
        assertThat(targets).hasSize(ids.size()).containsExactlyInAnyOrderElementsOf(ids);
        // toàn bộ là 1 chu trình
        String start = ids.get(0);
        String cur = start;
        for (int i = 0; i < ids.size(); i++) {
            cur = pairing.get(cur);
        }
        assertThat(cur).isEqualTo(start);
    }

    @Test
    void pairing_isStable_acrossMultipleRandomSeeds() {
        for (int seed = 0; seed < 50; seed++) {
            List<String> ids = List.of("g1", "g2", "g3", "g4", "g5", "g6", "g7");
            Map<String, String> pairing =
                    ChannelServiceImpl.buildCircularPairing(ids, new Random(seed));

            // Khôg tự chấm
            for (Map.Entry<String, String> e : pairing.entrySet()) {
                assertThat(e.getKey()).isNotEqualTo(e.getValue());
            }
            // Đủ tất cả id
            assertThat(pairing).hasSize(ids.size());
            assertThat(new HashSet<>(pairing.values())).hasSize(ids.size());

            // 1 chu trình duy nhất
            String start = ids.get(0);
            String cur = start;
            for (int i = 0; i < ids.size(); i++) {
                cur = pairing.get(cur);
            }
            assertThat(cur).isEqualTo(start);
        }
    }
}
