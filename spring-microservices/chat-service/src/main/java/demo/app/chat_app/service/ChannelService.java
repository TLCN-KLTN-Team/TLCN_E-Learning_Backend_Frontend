package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.ChannelCreationRequest;
import demo.app.chat_app.dto.response.BasicChannelResponse;
import demo.app.chat_app.dto.response.ChannelResponse;

import java.util.List;

public interface ChannelService {
    BasicChannelResponse createChannel(ChannelCreationRequest request);
    ChannelResponse updateChannel(String id, ChannelCreationRequest request);
    void deleteChannel(String id);
    BasicChannelResponse getBasicChannelById(String channelId);
    List<BasicChannelResponse> getBasicChannels(String workspaceId);
    ChannelResponse getChannelById(String channelId);
    List<ChannelResponse> getChannels(String workspaceId);
    void submitPractices(String channelId);
    void softDeleteChannel(String channelId);
}
