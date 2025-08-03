import React, { useState, useMemo, useEffect } from "react";
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
import useGetRoom from "../../hooks/room/useGetRoom";
import useGetNFLOdds from "../../hooks/odds/useGetNFLOdds";
import useGetNFLWeeksInRange from "../../hooks/odds/useGetNFLWeeksInRange";
import { getSeasonTypeOptions } from "../../config/nflSeasonTypes";
import { getDefaultNFLSelection } from "../../config/nflCurrentWeek";
import RoomInfoCards from "../../components/room/RoomInfoCards";
import BettingSummary from "../../components/room/BettingSummary";
import WeekYearSelector from "../../components/room/WeekYearSelector";
import GameCard from "../../components/room/GameCard";
import StatusMessages from "../../components/room/StatusMessages";

const { Title, Text, Paragraph } = Typography;

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // State for betting selections
  const [selectedBets, setSelectedBets] = useState({});

  const { room, isRoomFetching, isRoomError, roomError, roomRefetch } =
    useGetRoom(roomId);

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
    () => () => {
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

      // Here you would call your API to submit the bets
      console.log("Submitting bets:", selectedBets);
      message.success(`Successfully submitted ${betEntries.length} bets!`);

      // Optionally clear bets after submission
      // setSelectedBets({});
    },
    [selectedBets, hasDuplicatePoints],
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

              {room.admin_user_ids && room.admin_user_ids.length > 0 && (
                <Col span={24}>
                  <Divider orientation="left">Room Admins</Divider>
                  <Space wrap>
                    {room.admin_user_ids.map((adminId, index) => (
                      <Tag key={adminId} color="blue">
                        Admin {index + 1}: {adminId}
                      </Tag>
                    ))}
                  </Space>
                </Col>
              )}
            </Row>
          </Card>
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
                {selectedBetsCount > 0 && (
                  <>
                    <Button
                      type="primary"
                      onClick={handleSubmitBets}
                      disabled={selectedBetsCount === 0 || hasDuplicatePoints}
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
                <Row gutter={[16, 16]}>
                  {memoizedNflOdds.map((game) => {
                    const isSelected = selectedBets[game.game_id];
                    const bet = selectedBets[game.game_id];
                    const canSelect = selectedBetsCount < 3 || isSelected;
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
      </Row>
    </div>
  );
};

export default Room;
