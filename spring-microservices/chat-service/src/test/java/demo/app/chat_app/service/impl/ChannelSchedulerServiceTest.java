package demo.app.chat_app.service.impl;

import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.ChannelStatus;
import demo.app.chat_app.repository.ChannelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * UC-41: scheduler chuyển trạng thái channel theo deadline.
 */
@ExtendWith(MockitoExtension.class)
class ChannelSchedulerServiceTest {

    @Mock
    private ChannelRepository channelRepository;

    @InjectMocks
    private ChannelSchedulerService scheduler;

    private Channel groupChannel(String id, boolean allowCrossReview,
                                  Instant submissionDeadline, Instant crossReviewDeadline,
                                  ChannelStatus status, Instant submissionClosedAt) {
        Channel c = new Channel();
        c.setId(id);
        c.setSubmissionDeadline(submissionDeadline);
        c.setCrossReviewDeadline(crossReviewDeadline);
        c.setAllowCrossReview(allowCrossReview);
        c.setStatus(status);
        c.setSubmissionClosedAt(submissionClosedAt);
        return c;
    }

    @BeforeEach
    void setUp() {
        // mặc định 2 query trả empty — test override khi cần
        when(channelRepository.findChannelsToCloseSubmission(any(), any())).thenReturn(List.of());
        when(channelRepository.findChannelsToArchiveAfterCrossReview(any(), any())).thenReturn(List.of());
    }

    @Test
    void closesSubmission_andLocks_whenAllowCrossReview() {
        Instant past = Instant.now().minusSeconds(60);
        Instant future = Instant.now().plusSeconds(3600);
        Channel ch = groupChannel("c1", true, past, future, ChannelStatus.ACTIVE, null);

        when(channelRepository.findChannelsToCloseSubmission(eq(ChannelStatus.ACTIVE), any()))
                .thenReturn(List.of(ch));

        scheduler.runChannelLockTransitions();

        ArgumentCaptor<List<Channel>> captor = ArgumentCaptor.forClass(List.class);
        verify(channelRepository).saveAll(captor.capture());
        List<Channel> saved = captor.getValue();
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getStatus()).isEqualTo(ChannelStatus.LOCKED);
        assertThat(saved.get(0).getSubmissionClosedAt()).isNotNull();
        assertThat(saved.get(0).getExpiredAt()).isNull();
    }

    @Test
    void closesSubmission_andArchives_whenNoCrossReview() {
        Instant past = Instant.now().minusSeconds(60);
        Channel ch = groupChannel("c2", false, past, null, ChannelStatus.ACTIVE, null);

        when(channelRepository.findChannelsToCloseSubmission(eq(ChannelStatus.ACTIVE), any()))
                .thenReturn(List.of(ch));

        scheduler.runChannelLockTransitions();

        ArgumentCaptor<List<Channel>> captor = ArgumentCaptor.forClass(List.class);
        verify(channelRepository).saveAll(captor.capture());
        Channel saved = captor.getValue().get(0);
        assertThat(saved.getStatus()).isEqualTo(ChannelStatus.ARCHIVED);
        assertThat(saved.getSubmissionClosedAt()).isNotNull();
        assertThat(saved.getExpiredAt()).isNotNull();
    }

    @Test
    void archives_lockedChannels_pastCrossReviewDeadline() {
        Instant longAgo = Instant.now().minusSeconds(10_000);
        Channel ch = groupChannel("c3", true, longAgo.minusSeconds(3600), longAgo,
                ChannelStatus.LOCKED, longAgo.minusSeconds(3600));

        when(channelRepository.findChannelsToArchiveAfterCrossReview(eq(ChannelStatus.LOCKED), any()))
                .thenReturn(List.of(ch));

        scheduler.runChannelLockTransitions();

        ArgumentCaptor<List<Channel>> captor = ArgumentCaptor.forClass(List.class);
        verify(channelRepository).saveAll(captor.capture());
        Channel saved = captor.getValue().get(0);
        assertThat(saved.getStatus()).isEqualTo(ChannelStatus.ARCHIVED);
        assertThat(saved.getExpiredAt()).isNotNull();
    }

    @Test
    void doesNothing_whenNoChannelsMatch() {
        scheduler.runChannelLockTransitions();
        verify(channelRepository, never()).saveAll(any());
    }
}
