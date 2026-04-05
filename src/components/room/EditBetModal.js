import React, { useState, useMemo } from "react";
import { Modal, Radio, Space, Typography, Tag, Divider } from "antd";

const { Text } = Typography;

const EditBetModal = ({
  visible,
  onCancel,
  onSubmit,
  bet,
  sportRules,
  isLoading,
}) => {
  const [betType, setBetType] = useState(bet?.game_bet?.bet_type || "spread");
  const [teamChoice, setTeamChoice] = useState(
    bet?.game_bet?.team_choice || null,
  );
  const [overUnderChoice, setOverUnderChoice] = useState(
    bet?.game_bet?.over_under_choice || null,
  );
  const [pointsWagered, setPointsWagered] = useState(
    bet?.game_bet?.points_wagered || 1,
  );

  const homeTeam = bet?.odds_snapshot?.teams?.home?.name || "Home";
  const awayTeam = bet?.odds_snapshot?.teams?.away?.name || "Away";
  const spread = bet?.odds_snapshot?.spread;
  const overUnder = bet?.odds_snapshot?.overUnder;

  const pointOptions = useMemo(() => {
    if (!sportRules) return [{ value: 1, label: "1" }];
    return sportRules.allowedPoints.map((p) => ({
      value: p,
      label: sportRules.pointLabels?.[p] || String(p),
    }));
  }, [sportRules]);

  const handleOk = () => {
    const spreadValue =
      betType === "spread"
        ? bet?.odds_snapshot?.spread || bet?.game_bet?.spread_value || null
        : null;
    const totalValue =
      betType === "over_under"
        ? bet?.odds_snapshot?.overUnder || bet?.game_bet?.total_value || null
        : null;

    onSubmit({
      room_id: bet.room_id,
      game_id: bet.game_id,
      season_type: bet.season_type,
      week: bet.week,
      event_datetime: bet.event_datetime,
      sport: bet.sport,
      league: bet.league,
      game_bet: {
        game_id: bet.game_id,
        bet_type: betType,
        team_choice: betType === "spread" ? teamChoice : null,
        spread_value: spreadValue,
        over_under_choice: betType === "over_under" ? overUnderChoice : null,
        total_value: totalValue,
        points_wagered: pointsWagered,
      },
      odds_snapshot: bet.odds_snapshot,
    });
  };

  const isValid =
    (betType === "spread" && teamChoice) ||
    (betType === "over_under" && overUnderChoice);

  return (
    <Modal
      title="Edit Bet"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Update Bet"
      okButtonProps={{ disabled: !isValid, loading: isLoading }}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text strong>
            {awayTeam} @ {homeTeam}
          </Text>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        <div>
          <Text type="secondary">Bet Type</Text>
          <div style={{ marginTop: 4 }}>
            <Radio.Group
              value={betType}
              onChange={(e) => setBetType(e.target.value)}
            >
              <Radio.Button value="spread">Spread</Radio.Button>
              <Radio.Button value="over_under">Total</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {betType === "spread" && (
          <div>
            <Text type="secondary">Pick</Text>
            <div style={{ marginTop: 4 }}>
              <Radio.Group
                value={teamChoice}
                onChange={(e) => setTeamChoice(e.target.value)}
              >
                <Radio.Button value="away">
                  {awayTeam}{" "}
                  {spread != null ? `(${spread > 0 ? "+" : ""}${spread})` : ""}
                </Radio.Button>
                <Radio.Button value="home">
                  {homeTeam}{" "}
                  {spread != null
                    ? `(${spread > 0 ? "-" : "+"}${Math.abs(spread)})`
                    : ""}
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        )}

        {betType === "over_under" && (
          <div>
            <Text type="secondary">
              Total {overUnder != null ? `(${overUnder})` : ""}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Radio.Group
                value={overUnderChoice}
                onChange={(e) => setOverUnderChoice(e.target.value)}
              >
                <Radio.Button value="over">Over</Radio.Button>
                <Radio.Button value="under">Under</Radio.Button>
              </Radio.Group>
            </div>
          </div>
        )}

        <div>
          <Text type="secondary">Points</Text>
          <div style={{ marginTop: 4 }}>
            <Radio.Group
              value={pointsWagered}
              onChange={(e) => setPointsWagered(e.target.value)}
            >
              {pointOptions.map((opt) => (
                <Radio.Button key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </div>

        <div>
          <Tag color="blue">
            Current: {bet?.points_wagered} pts →{" "}
            {pointsWagered === bet?.points_wagered
              ? "No change"
              : `${pointsWagered} pts`}
          </Tag>
        </div>
      </Space>
    </Modal>
  );
};

export default EditBetModal;
