import React, { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Alert, Button, Tabs } from "antd";
import {
  TrophyOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import useIsMobile from "../../hooks/useIsMobile";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import RoomProvider, { useRoomContext } from "../../provider/RoomProvider";
import useRoomTabs from "../../hooks/room/useRoomTabs";
import useStickyMobileHeader from "../../hooks/room/useStickyMobileHeader";
import RoomHeader from "../../components/room/RoomHeader";
import StandingsTab from "../../components/room/tabs/StandingsTab";
import PlaceBetsTab from "../../components/room/tabs/PlaceBetsTab";
import InfoTab from "../../components/room/tabs/InfoTab";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorAlert from "../../components/shared/ErrorAlert";

const RoomContent = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { idToken } = useContext(UserAuthenticationContext);

  const { activeTab, handleTabChange } = useRoomTabs();

  const {
    room,
    roomId,
    isRoomFetching,
    isRoomError,
    roomError,
    roomRefetch,
    currentUserId,
    members,
    isMember,
    isMembershipFetching,
    isCurrentUserAdmin,
    roomSport,
    isMLB,
    leaderboard,
    isLeaderboardLoading,
    roomBetsAll,
    roomBetsUsers,
    isRoomBetsAllLoading,
    removedBets,
    refetchStandings,
    mlbOddsProps,
    nflOddsProps,
  } = useRoomContext();

  const handleGoBack = () => navigate(-1);

  // Fixed mobile header measurement (room name + tab bar) so content can
  // reserve equivalent space and not hide behind it.
  const { headerRef: mobileHeaderRef, headerHeight: mobileHeaderHeight } =
    useStickyMobileHeader(isMobile, [room, activeTab]);

  if (isRoomFetching) {
    return (
      <div
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner message="Loading room..." />
      </div>
    );
  }

  if (isRoomError) {
    return (
      <div style={{ padding: "24px" }}>
        <ErrorAlert
          title="Error Loading Room"
          description={roomError?.message || "Failed to load room information"}
          onRetry={roomRefetch}
        />
        <Button
          size="small"
          onClick={handleGoBack}
          style={{ marginTop: "8px" }}
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Room Not Found"
          description="The room you're looking for doesn't exist or you don't have access to it"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={handleGoBack}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  // Private room: show header + access message only
  if (!room.public && !isMember) {
    return (
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card style={{ marginBottom: 24, boxShadow: "0 2px 8px #f0f1f2" }}>
              <RoomHeader
                room={room}
                isMember={isMember}
                isMembershipFetching={isMembershipFetching}
                currentUserId={currentUserId}
                members={members}
                isCurrentUserAdmin={isCurrentUserAdmin}
                variant="name"
              />
              <div style={{ marginTop: 12 }}>
                <RoomHeader
                  room={room}
                  isMember={isMember}
                  isMembershipFetching={isMembershipFetching}
                  currentUserId={currentUserId}
                  members={members}
                  isCurrentUserAdmin={isCurrentUserAdmin}
                  variant="details"
                />
              </div>
            </Card>
          </Col>
          <Col span={24}>
            <Card>
              <div
                style={{ textAlign: "center", padding: "40px 0", fontSize: 18 }}
              >
                This is a private room. You must join and be accepted in the
                room to view more details.
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Full room content
  return (
    <div
      style={{
        padding: "24px",
        // Mobile: tighten the space between the app nav bar and the sticky
        // header card. Desktop keeps the standard top inset.
        paddingTop: isMobile ? 12 : 24,
        // On desktop the section tab bar is fixed to the bottom of the
        // viewport; reserve space so the last content isn't hidden behind it.
        paddingBottom: isMobile ? 24 : 96,
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <Row gutter={[24, 24]}>
        {/* Desktop shows the room name in its own card at the top. On mobile
            the name is folded into the sticky tab-bar header (see renderTabBar)
            so the name and tabs travel together as one compact block. */}
        {!isMobile && (
          <Col span={24}>
            <Card style={{ marginBottom: 24, boxShadow: "0 2px 8px #f0f1f2" }}>
              <RoomHeader
                room={room}
                isMember={isMember}
                isMembershipFetching={isMembershipFetching}
                currentUserId={currentUserId}
                members={members}
                isCurrentUserAdmin={isCurrentUserAdmin}
                variant="name"
              />
            </Card>
          </Col>
        )}
        <Col
          span={24}
          style={
            isMobile
              ? {
                  // Reserve room for the fixed header (measured height) plus a
                  // gap so the first section's content sits below it, not under.
                  paddingTop: mobileHeaderHeight + 16,
                }
              : undefined
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            tabPosition={isMobile ? "top" : "bottom"}
            size="large"
            centered
            animated={false}
            className="room-section-tabs"
            renderTabBar={(props, DefaultTabBar) =>
              isMobile ? (
                // Mobile: a compact header block — the room name on top with
                // the app-style tab bar (icon + label, solid full-width
                // background) directly beneath it. The whole block is sticky
                // below the fixed 64px app header so the name and tabs travel
                // together as one unit while content scrolls under them.
                <div
                  ref={mobileHeaderRef}
                  style={{
                    // A compact header card fixed to the top of the screen
                    // (just under the fixed 64px app header) so the room name
                    // and tab group always stay in view for quick tab
                    // switching. Rounded, bordered, and shadowed so it reads as
                    // one contained unit.
                    position: "fixed",
                    top: 64,
                    left: 16,
                    right: 16,
                    zIndex: 10,
                    background: "#F5F1E6",
                    border: "1.5px solid #1F3C2D",
                    borderRadius: 12,
                    // Clip the tab bar (and its full-width ink rail) to the
                    // rounded corners so the tab group stays inside the border.
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    padding: "12px 16px 0",
                  }}
                >
                  <RoomHeader
                    room={room}
                    isMember={isMember}
                    isMembershipFetching={isMembershipFetching}
                    currentUserId={currentUserId}
                    members={members}
                    isCurrentUserAdmin={isCurrentUserAdmin}
                    variant="name"
                  />
                  <DefaultTabBar
                    {...props}
                    style={{ background: "transparent", margin: 0 }}
                  />
                </div>
              ) : (
                // Desktop: pin the switcher to the very bottom of the viewport,
                // spanning the full screen width, so it reads like an
                // app-style tab bar with icon + label per section.
                <DefaultTabBar
                  {...props}
                  style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: "#F5F1E6",
                    borderTop: "1px solid #e8e3d3",
                    margin: 0,
                  }}
                />
              )
            }
            items={[
              {
                key: "standings",
                // Force all panes to mount on load (rather than on first click)
                // so the data-fetching sections render as soon as their queries
                // resolve, instead of waiting for the tab to be opened.
                forceRender: true,
                label: (
                  <span>
                    <TrophyOutlined /> Standings
                  </span>
                ),
                children: (
                  <StandingsTab
                    isLeaderboardLoading={isLeaderboardLoading}
                    leaderboard={leaderboard}
                    isRoomBetsAllLoading={isRoomBetsAllLoading}
                    roomId={roomId}
                    roomBetsAll={roomBetsAll}
                    room={room}
                    members={members}
                    roomBetsUsers={roomBetsUsers}
                    roomSport={roomSport}
                    removedBets={removedBets}
                    onRefetchBets={refetchStandings}
                  />
                ),
              },
              {
                key: "place-bets",
                forceRender: true,
                label: (
                  <span>
                    <DollarOutlined /> Place Bets
                  </span>
                ),
                children: (
                  <PlaceBetsTab
                    isMLB={isMLB}
                    mlb={mlbOddsProps}
                    nfl={nflOddsProps}
                  />
                ),
              },
              {
                key: "info",
                forceRender: true,
                label: (
                  <span>
                    <InfoCircleOutlined /> Info
                  </span>
                ),
                children: (
                  <InfoTab
                    room={room}
                    isMember={isMember}
                    isMembershipFetching={isMembershipFetching}
                    currentUserId={currentUserId}
                    members={members}
                    isCurrentUserAdmin={isCurrentUserAdmin}
                    roomId={roomId}
                    idToken={idToken}
                  />
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

const Room = () => {
  const { roomId } = useParams();
  return (
    <RoomProvider roomId={roomId}>
      <RoomContent />
    </RoomProvider>
  );
};

export default Room;
