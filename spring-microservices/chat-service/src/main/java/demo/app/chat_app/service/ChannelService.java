package demo.app.chat_app.service;

import demo.app.chat_app.dto.request.BulkRandomChannelRequest;
import demo.app.chat_app.dto.response.*;
import demo.app.chat_app.events.ClassCreatedEvent;
import demo.app.chat_app.events.EnrollStudentsEvent;
import demo.app.chat_app.model.workspace.Channel;
import demo.app.chat_app.model.workspace.Workspace;

import java.util.List;

/**
 * Service interface for managing Channels.
 * Contains methods for CRUD operations, member management, and event handling.
 */
public interface ChannelService {

    // ══════════════════════════════════════════════════════════════════
    // CRUD Operations
    // ══════════════════════════════════════════════════════════════════

    /**
     * Create a new channel in a section.
     *
     * @param request Channel creation request
     * @return Created channel basic information
     */
    BasicChannelResponse createChannel(ChannelCreationRequest request);

    BulkRandomChannelResponse bulkRandomlyCreateChannels(BulkRandomChannelRequest request);

    /**
     * Update an existing channel.
     *
     * @param id      Channel ID
     * @param request Updated channel information
     * @return Updated channel information
     */
    ChannelResponse updateChannel(String id, BulkRandomChannelRequest request);

    /**
     * Permanently delete a channel.
     *
     * @param id Channel ID to delete
     */
    void deleteChannel(String id);

    // ══════════════════════════════════════════════════════════════════
    // Query Operations
    // ══════════════════════════════════════════════════════════════════

    /**
     * Get basic channel information by ID.
     *
     * @param channelId Channel ID
     * @return Basic channel information
     */
    BasicChannelResponse getBasicChannelById(String channelId);

    /**
     * Get all basic channels in a section.
     *
     * @param sectionId Section ID
     * @return List of basic channel information
     */
    List<BasicChannelResponse> getBasicChannels(String sectionId);

    /**
     * Get full channel information by ID (including messages).
     *
     * @param channelId Channel ID
     * @return Full channel information
     */
    ChannelResponse getChannelById(String channelId);

    /**
     * Get the public channel (MAIN) in a section.
     *
     * @param sectionId Section ID
     * @return Public channel information
     */
    ChannelResponse getPublicChannelBySectionId(String sectionId);

    /**
     * Get all channels that the current user is a member of in a section.
     *
     * @param sectionId Section ID
     * @return List of channels with messages
     */
    List<ChannelResponse> getChannels(String sectionId);

    // ══════════════════════════════════════════════════════════════════
    // Member Management
    // ══════════════════════════════════════════════════════════════════

    /**
     * Get list of members in a channel.
     *
     * @param channelId Channel ID
     * @return List of active members
     */
    List<UserResponse> getMembersInChannel(String channelId);

    // ══════════════════════════════════════════════════════════════════
    // Channel Creation (Event Handlers)
    // ══════════════════════════════════════════════════════════════════

    /**
     * Create the first channel when a class is created and students are enrolled.
     * This is typically the MAIN channel for the class.
     *
     * @param event Class created event
     * @return Created channel
     */
    Channel createFirstChannelInSectionWhenStudentsEnrolled(ClassCreatedEvent event);

    /**
     * Add participants to the public channel when students are enrolled.
     *
     * @param event Enroll students event
     */
    void addParticipantsWhenStudentsEnrolled(EnrollStudentsEvent event);

    /**
     * Create the general channel for a workspace.
     * This is the default MAIN channel when a workspace is created.
     *
     * @param sectionId Section ID
     * @param workspace Workspace information
     * @return Created channel
     */
    Channel createGeneralChannelInGeneralSection(String sectionId, Workspace workspace);

    // ══════════════════════════════════════════════════════════════════
    // Other Operations
    // ══════════════════════════════════════════════════════════════════

    /**
     * Submit practices for a channel.
     * (To be implemented)
     *
     * @param channelId Channel ID
     */
    void submitPractices(String channelId);

    // ══════════════════════════════════════════════════════════════════
    // UC-41: Cross-review
    // ══════════════════════════════════════════════════════════════════

    /**
     * Lấy channel mà channelId được phân công chấm chéo.
     *
     * @param channelId ID kênh hiện tại (kênh nhóm chấm)
     * @return BasicChannelResponse của kênh nhóm cần chấm
     */
    BasicChannelResponse getCrossReviewTarget(String channelId);
}
