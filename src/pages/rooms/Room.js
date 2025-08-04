import React, { useState, useMemo, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Button,
  Tag,
  Space,
  Divider,
  Empty,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  LockOutlined,
  UnlockOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import useGetRoom from "../../hooks/room/useGetRoom";
import useGetNFLOdds from "../../hooks/odds/useGetNFLOdds";
import useGetNFLWeeksInRange from "../../hooks/odds/useGetNFLWeeksInRange";
import useCreateBet from "../../hooks/bet/useCreateBet";
import { getSeasonTypeOptions } from "../../configs/nflSeasonTypes";
import { getDefaultNFLSelection } from "../../configs/nflCurrentWeek";
import RoomInfoCards from "../../components/room/RoomInfoCards";
import BettingSummary from "../../components/room/BettingSummary";
import WeekYearSelector from "../../components/room/WeekYearSelector";
import GameCard from "../../components/room/GameCard";
import StatusMessages from "../../components/room/StatusMessages";
import RoomBetsDisplay from "../../components/room/RoomBetsDisplay";
import MembershipManagement from "../../components/room/MembershipManagement";
import useGetUserMembershipStatus from "../../hooks/membership/useGetUserMembershipStatus";

const { Title, Text, Paragraph } = Typography;

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { idToken } = useContext(UserAuthenticationContext);

  // State for betting selections
  const [selectedBets, setSelectedBets] = useState({});

  const { room, isRoomFetching, isRoomError, roomError, roomRefetch } =
    useGetRoom(roomId);

  // Get current user ID and check if they're an admin
  const currentUserId = useMemo(() => {
    if (!idToken) return null;
    try {
      return jwtDecode(idToken).sub;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }, [idToken]);

  const isCurrentUserAdmin = useMemo(() => {
    if (!room || !currentUserId) return false;
    // Check both possible field names for backward compatibility
    const adminIds = room.admin_user_ids || room.admins || [];
    const isAdmin = adminIds.includes(currentUserId);

    console.log("Admin Check Debug:", {
      roomId,
      currentUserId,
      adminIds,
      isAdmin,
      room_admin_user_ids: room.admin_user_ids,
      room_admins: room.admins,
    });

    return isAdmin;
  }, [room, currentUserId, roomId]);

  // Get user's membership status for this room
  const {
    isMember,
    isApproved,
    isPending,
    isDenied,
    membershipStatus,
    isMembershipFetching,
  } = useGetUserMembershipStatus(roomId);

  // Bet creation hook
  const { createBet, isLoading: isBetCreating } = useCreateBet();

  // Get NFL weeks available in the room's date range
  const {
    nflWeeks,
    availableSeasons,
    getSeasonTypesForYear,
    getWeeksForYearAndSeason,
    isValidCombination,
    getDefaultSelection,
    isNFLWeeksFetching,
    isNFLWeeksError,
  } = useGetNFLWeeksInRange(room?.start_date, room?.end_date);

  // Get default selection or use current values (stable initialization)
  const defaultSelection = useMemo(() => {
    // First try to get from NFL weeks data based on room dates
    if (
      room?.start_date &&
      room?.end_date &&
      nflWeeks?.length &&
      getDefaultSelection
    ) {
      const roomBasedDefault = getDefaultSelection();
      if (roomBasedDefault) {
        return roomBasedDefault;
      }
    }

    // Fallback to current NFL week based on today's date
    const currentNFLWeek = getDefaultNFLSelection();
    return {
      year: currentNFLWeek.year,
      seasonType: currentNFLWeek.seasonType,
      week: currentNFLWeek.week,
    };
  }, [room?.start_date, room?.end_date, nflWeeks, getDefaultSelection]);

  // State for NFL odds selection - initialize once with default selection
  const [selectedWeek, setSelectedWeek] = useState(() => defaultSelection.week);
  const [selectedYear, setSelectedYear] = useState(() => defaultSelection.year);
  const [selectedSeasonType, setSelectedSeasonType] = useState(
    () => defaultSelection.seasonType,
  );

  // Only update if we don't have valid initial values (first load only)
  useEffect(() => {
    if (!selectedWeek || !selectedYear || !selectedSeasonType) {
      setSelectedWeek(defaultSelection.week);
      setSelectedYear(defaultSelection.year);
      setSelectedSeasonType(defaultSelection.seasonType);
    }
  }, [defaultSelection, selectedWeek, selectedYear, selectedSeasonType]);

  // Ensure selected season type is valid for current options
  useEffect(() => {
    if (seasonTypeOptions.length > 0) {
      const hasValidSeasonType = seasonTypeOptions.some(
        (option) => option.value === selectedSeasonType,
      );
      if (!hasValidSeasonType) {
        // Default to first available season type
        setSelectedSeasonType(seasonTypeOptions[0].value);
      }
    }
  }, [seasonTypeOptions, selectedSeasonType]);

  // Fetch NFL odds based on selected week/year
  const {
    nflOdds,
    oddsCount,
    sport,
    league,
    isOddsFetching,
    isOddsError,
    oddsError,
    oddsRefetch,
    hasOdds,
  } = useGetNFLOdds(selectedWeek, selectedYear, selectedSeasonType);

  // Memoize the odds data to prevent unnecessary re-renders
  const memoizedNflOdds = useMemo(() => nflOdds, [nflOdds]);
  const memoizedOddsCount = useMemo(() => oddsCount, [oddsCount]);

  // Generate dynamic options based on room's NFL weeks
  const weekOptions = useMemo(() => {
    if (!room?.start_date || !room?.end_date || !getWeeksForYearAndSeason)
      return [];
    return getWeeksForYearAndSeason(selectedYear, selectedSeasonType);
  }, [
    selectedYear,
    selectedSeasonType,
    room?.start_date,
    room?.end_date,
    getWeeksForYearAndSeason,
  ]);

  // Generate year options from available seasons
  const yearOptions = useMemo(() => {
    if (!availableSeasons?.length) return [new Date().getFullYear()];
    return availableSeasons.map((season) => season.year).sort((a, b) => a - b);
  }, [availableSeasons]);

  // Generate season type options for selected year
  const seasonTypeOptions = useMemo(() => {
    if (!room?.start_date || !room?.end_date || !getSeasonTypesForYear) {
      // Use config fallback when NFL weeks data isn't available
      return getSeasonTypeOptions();
    }

    const seasonTypes = getSeasonTypesForYear(selectedYear);
    if (!seasonTypes || seasonTypes.length === 0) {
      // Fallback to config if no dynamic data
      return getSeasonTypeOptions();
    }

    return seasonTypes.map((st) => ({
      value: st.seasonType,
      label: st.displayName,
    }));
  }, [selectedYear, room?.start_date, room?.end_date, getSeasonTypesForYear]);

  const handleGoBack = () => {
    navigate(-1);
  };

  // Enhanced handlers for selection changes with immediate feedback
  const handleWeekChange = useMemo(
    () => (newWeek) => {
      setSelectedWeek(newWeek);
      // Clear previous bets when changing week
      setSelectedBets({});
      message.info(`Loading games for Week ${newWeek}...`);
    },
    [],
  );

  const handleYearChange = useMemo(
    () => (newYear) => {
      setSelectedYear(newYear);
      // Clear previous bets when changing year
      setSelectedBets({});
      message.info(`Loading games for ${newYear}...`);
    },
    [],
  );

  const handleSeasonTypeChange = useMemo(
    () => (newSeasonType) => {
      setSelectedSeasonType(newSeasonType);
      // Clear previous bets when changing season type
      setSelectedBets({});
      const seasonName =
        seasonTypeOptions.find((opt) => opt.value === newSeasonType)?.label ||
        "season";
      message.info(`Loading ${seasonName} games...`);
    },
    [seasonTypeOptions],
  );

  // Betting selection functions (memoized to prevent re-renders)
  const handleGameSelect = useMemo(
    () => (gameId) => {
      if (selectedBets[gameId]) {
        // Deselect the game
        const newBets = { ...selectedBets };
        delete newBets[gameId];
        setSelectedBets(newBets);
      } else {
        // Check if we already have 3 games selected
        if (Object.keys(selectedBets).length >= 3) {
          message.warning("You can only select up to 3 games for betting");
          return;
        }

        // Select the game with default values
        setSelectedBets({
          ...selectedBets,
          [gameId]: {
            betType: "spread", // 'spread' or 'overUnder'
            teamChoice: "home", // 'home' or 'away' for spread, 'over' or 'under' for overUnder
            points: 1,
          },
        });
      }
    },
    [selectedBets],
  );

  const handleBetTypeChange = useMemo(
    () => (gameId, betType) => {
      setSelectedBets({
        ...selectedBets,
        [gameId]: {
          ...selectedBets[gameId],
          betType,
          teamChoice: betType === "spread" ? "home" : "over", // Reset team choice when bet type changes
        },
      });
    },
    [selectedBets],
  );

  const handleTeamChoiceChange = useMemo(
    () => (gameId, teamChoice) => {
      setSelectedBets({
        ...selectedBets,
        [gameId]: {
          ...selectedBets[gameId],
          teamChoice,
        },
      });
    },
    [selectedBets],
  );

  const handlePointsChange = useMemo(
    () => (gameId, points) => {
      if (points >= 1 && points <= 3) {
        setSelectedBets({
          ...selectedBets,
          [gameId]: {
            ...selectedBets[gameId],
            points,
          },
        });
      }
    },
    [selectedBets],
  );

  const handleClearBets = useMemo(
    () => () => {
      setSelectedBets({});
    },
    [],
  );

  const handleSubmitBets = useMemo(
    () => async () => {
      const betEntries = Object.entries(selectedBets);
      if (betEntries.length === 0) {
        message.warning("Please select at least one game to bet on");
        return;
      }

      if (hasDuplicatePoints) {
        message.error(
          "Each bet must have a unique point value. Please adjust your selections.",
        );
        return;
      }

      try {
        // Submit each bet individually
        const betPromises = betEntries.map(async ([gameId, bet]) => {
          const game = memoizedNflOdds.find((g) => g.game_id === gameId);
          if (!game) {
            throw new Error(`Game not found: ${gameId}`);
          }

          // Determine the bet choice based on bet type
          let teamChoice = null;
          let overUnderChoice = null;

          if (bet.betType === "spread") {
            teamChoice = bet.teamChoice; // "home" or "away"
          } else {
            overUnderChoice = bet.teamChoice; // "over" or "under"
          }

          // Create the game_bet object
          const gameBet = {
            game_id: gameId,
            bet_type: bet.betType === "overUnder" ? "over_under" : bet.betType,
            points_wagered: bet.points,
            ...(teamChoice && { team_choice: teamChoice }),
            ...(overUnderChoice && { over_under_choice: overUnderChoice }),
            ...(bet.betType === "spread" && {
              spread_value:
                bet.teamChoice === "home" ? game.homeSpread : game.awaySpread,
            }),
            ...(bet.betType === "overUnder" && { total_value: game.overUnder }),
          };

          // Ensure event_datetime is properly converted to epoch timestamp (seconds)
          let eventDateTime;
          if (!game.date || game.date === null) {
            throw new Error(
              `Game ${gameId} is missing date - cannot place bet`,
            );
          }

          try {
            const gameDate = new Date(game.date);
            if (isNaN(gameDate.getTime())) {
              throw new Error(`Game ${gameId} has invalid date: ${game.date}`);
            }
            eventDateTime = Math.floor(gameDate.getTime() / 1000);
          } catch (error) {
            if (error.message.includes("date")) {
              throw error; // Re-throw our custom error
            }
            throw new Error(
              `Failed to parse date for game ${gameId}: ${game.date}`,
            );
          }

          return createBet({
            room_id: roomId,
            game_id: gameId,
            sport: sport || "football", // Use sport from odds response, fallback to football
            league: league || "nfl", // Use league from odds response, fallback to nfl
            season_type: selectedSeasonType,
            event_datetime: eventDateTime, // Epoch timestamp in seconds
            game_bet: gameBet,
            points_wagered: bet.points,
            locked: false,
            submitted_at: Math.floor(Date.now() / 1000), // Current time in epoch seconds
            odds_snapshot: game, // Full game data as odds snapshot
          });
        });

        await Promise.all(betPromises);

        message.success(
          `Successfully placed ${betEntries.length} bet${betEntries.length !== 1 ? "s" : ""}!`,
        );

        // Clear the selected bets after successful submission
        setSelectedBets({});
      } catch (error) {
        // Error handling is done by the useCreateBet hook
        console.error("Error submitting bets:", error);
      }
    },
    [
      selectedBets,
      hasDuplicatePoints,
      memoizedNflOdds,
      roomId,
      createBet,
      selectedSeasonType,
      sport,
      league,
    ],
  );

  // Get selected bets count and total points (memoized)
  const selectedBetsCount = useMemo(
    () => Object.keys(selectedBets).length,
    [selectedBets],
  );
  const totalPoints = useMemo(
    () => Object.values(selectedBets).reduce((sum, bet) => sum + bet.points, 0),
    [selectedBets],
  );

  // Check for duplicate point values (memoized)
  const { hasDuplicatePoints, duplicatePointValues } = useMemo(() => {
    const pointCounts = Object.values(selectedBets).reduce((acc, bet) => {
      acc[bet.points] = (acc[bet.points] || 0) + 1;
      return acc;
    }, {});

    const hasDups = Object.values(pointCounts).some((count) => count > 1);
    const dupValues = Object.entries(pointCounts)
      .filter(([_, count]) => count > 1)
      .map(([points, _]) => parseInt(points));

    return {
      hasDuplicatePoints: hasDups,
      duplicatePointValues: dupValues,
    };
  }, [selectedBets]);

  if (isRoomFetching || (room && isNFLWeeksFetching)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
        <div style={{ marginLeft: "16px" }}>
          <Text>
            {isRoomFetching ? "Loading room..." : "Loading NFL schedule..."}
          </Text>
        </div>
      </div>
    );
  }

  if (isRoomError) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="Error Loading Room"
          description={roomError?.message || "Failed to load room information"}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={roomRefetch}>
                Retry
              </Button>
              <Button size="small" onClick={handleGoBack}>
                Go Back
              </Button>
            </Space>
          }
        />
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

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            style={{ marginBottom: "16px" }}
          >
            Back
          </Button>
        </Col>

        <Col span={24}>
          <Card>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <Title level={2} style={{ margin: 0 }}>
                      {room.room_name}
                    </Title>
                    <Text type="secondary">Room ID: {room.room_id}</Text>
                  </div>
                  <Tag
                    icon={
                      room.is_private ? <LockOutlined /> : <UnlockOutlined />
                    }
                    color={room.is_private ? "red" : "green"}
                    style={{ fontSize: "14px", padding: "4px 8px" }}
                  >
                    {room.is_private ? "Private" : "Public"}
                  </Tag>
                </div>
              </Col>

              {room.room_description && (
                <Col span={24}>
                  <Divider orientation="left">Description</Divider>
                  <Paragraph style={{ fontSize: "16px" }}>
                    {room.room_description}
                  </Paragraph>
                </Col>
              )}

              <Col span={24}>
                <Divider orientation="left">Room Information</Divider>
                <RoomInfoCards room={room} />
              </Col>

              {(room.admin_user_ids || room.admins || room.admin_profiles) &&
                ((room.admin_user_ids || room.admins || []).length > 0 ||
                  (room.admin_profiles || []).length > 0) && (
                  <Col span={24}>
                    <Divider orientation="left">Room Admins</Divider>
                    <Space wrap>
                      {room.admin_profiles
                        ? room.admin_profiles.map((admin, index) => (
                            <Tag key={admin.user_id} color="blue">
                              {admin.user_name}
                            </Tag>
                          ))
                        : (room.admin_user_ids || room.admins).map(
                            (adminId, index) => (
                              <Tag key={adminId} color="blue">
                                Admin {index + 1}: {adminId}
                              </Tag>
                            ),
                          )}
                    </Space>
                  </Col>
                )}
            </Row>
          </Card>
        </Col>

        {/* Room Bets Display */}
        <Col span={24}>
          <RoomBetsDisplay roomId={roomId} />
        </Col>

        {/* NFL Betting Odds Section */}
        <Col span={24}>
          <Card
            title={
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <TrophyOutlined />
                NFL Betting Odds
                {selectedBetsCount > 0 && (
                  <Tag color="blue">{selectedBetsCount}/3 games selected</Tag>
                )}
              </div>
            }
            extra={
              <Space>
                {selectedBetsCount > 0 && (isCurrentUserAdmin || isMember) && (
                  <>
                    <Button
                      type="primary"
                      onClick={handleSubmitBets}
                      disabled={
                        selectedBetsCount === 0 ||
                        hasDuplicatePoints ||
                        (!isCurrentUserAdmin && !isMember)
                      }
                    >
                      Submit Bets ({totalPoints} pts)
                    </Button>
                    <Button onClick={handleClearBets}>Clear All</Button>
                  </>
                )}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={oddsRefetch}
                  loading={isOddsFetching}
                  size="small"
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            {/* Membership Status Alert for Non-Members */}
            {!isMembershipFetching && !isCurrentUserAdmin && !isMember && (
              <Alert
                message={
                  isDenied
                    ? "Access Denied"
                    : isPending
                      ? "Membership Pending"
                      : "Member Access Required"
                }
                description={
                  isDenied
                    ? "Your request to join this room was denied. You cannot place bets."
                    : isPending
                      ? "Your membership request is pending approval. You cannot place bets until approved."
                      : "You must be a member of this room to place bets. Please request to join the room."
                }
                type={isDenied ? "error" : isPending ? "warning" : "info"}
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

            <WeekYearSelector
              selectedSeasonType={selectedSeasonType}
              setSelectedSeasonType={handleSeasonTypeChange}
              selectedYear={selectedYear}
              setSelectedYear={handleYearChange}
              selectedWeek={selectedWeek}
              setSelectedWeek={handleWeekChange}
              weekOptions={weekOptions}
              yearOptions={yearOptions}
              seasonTypeOptions={seasonTypeOptions}
              isValidCombination={isValidCombination}
            />

            {isNFLWeeksError && (
              <Alert
                message="Error Loading NFL Schedule"
                description="Failed to load available NFL weeks for this room's date range. Using default options."
                type="warning"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

            {isOddsFetching && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <div style={{ marginTop: "16px" }}>
                  <Text>Loading NFL odds...</Text>
                </div>
              </div>
            )}

            {isOddsError && (
              <Alert
                message="Error Loading Odds"
                description={oddsError?.message || "Failed to load NFL odds"}
                type="error"
                showIcon
                action={
                  <Button size="small" onClick={oddsRefetch}>
                    Retry
                  </Button>
                }
                style={{ marginBottom: "16px" }}
              />
            )}

            {!isOddsFetching && !isOddsError && !hasOdds && (
              <Empty
                description="No odds available for this week"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            {!isOddsFetching && !isOddsError && hasOdds && (
              <>
                <BettingSummary
                  selectedBets={selectedBets}
                  nflOdds={memoizedNflOdds}
                />

                <StatusMessages
                  oddsCount={memoizedOddsCount}
                  selectedWeek={selectedWeek}
                  selectedYear={selectedYear}
                  selectedSeasonType={selectedSeasonType}
                  selectedBetsCount={selectedBetsCount}
                  hasDuplicatePoints={hasDuplicatePoints}
                />

                {/* Place Bets Button */}
                {selectedBetsCount > 0 && (
                  <div style={{ marginBottom: "16px", textAlign: "center" }}>
                    <Space>
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleSubmitBets}
                        loading={isBetCreating}
                        disabled={hasDuplicatePoints || selectedBetsCount === 0}
                        style={{
                          backgroundColor: hasDuplicatePoints
                            ? undefined
                            : "#52c41a",
                          borderColor: hasDuplicatePoints
                            ? undefined
                            : "#52c41a",
                        }}
                      >
                        {isBetCreating
                          ? "Placing Bets..."
                          : `Place ${selectedBetsCount} Bet${selectedBetsCount !== 1 ? "s" : ""}`}
                      </Button>
                      <Button
                        type="default"
                        size="large"
                        onClick={handleClearBets}
                        disabled={isBetCreating || selectedBetsCount === 0}
                      >
                        Clear All
                      </Button>
                    </Space>
                  </div>
                )}

                <Row gutter={[16, 16]}>
                  {memoizedNflOdds.map((game) => {
                    const isSelected = selectedBets[game.game_id];
                    const bet = selectedBets[game.game_id];
                    const canSelect =
                      (selectedBetsCount < 3 || isSelected) &&
                      (isCurrentUserAdmin || isMember);
                    const hasConflictingPoints =
                      isSelected && duplicatePointValues.includes(bet.points);

                    return (
                      <Col xs={24} sm={12} lg={8} key={game.game_id}>
                        <GameCard
                          game={game}
                          isSelected={isSelected}
                          bet={bet}
                          canSelect={canSelect}
                          hasConflictingPoints={hasConflictingPoints}
                          duplicatePointValues={duplicatePointValues}
                          onGameSelect={handleGameSelect}
                          onBetTypeChange={handleBetTypeChange}
                          onTeamChoiceChange={handleTeamChoiceChange}
                          onPointsChange={handlePointsChange}
                        />
                      </Col>
                    );
                  })}
                </Row>
              </>
            )}
          </Card>
        </Col>

        {/* Membership Management - Only for Admins */}
        {isCurrentUserAdmin && (
          <Col span={24}>
            <MembershipManagement roomId={roomId} idToken={idToken} />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Room;
