import {
  resolveFavoredSide,
  signedLineForSide,
  formatLine,
  formatSpreadForSide,
  formatPlacedBetSpread,
} from "./spreadFormat";

describe("resolveFavoredSide", () => {
  it("prefers an explicit favoredTeam", () => {
    expect(resolveFavoredSide("away", -3.5)).toBe("away");
    expect(resolveFavoredSide("home", 3.5)).toBe("home");
  });

  it("infers home favorite from a negative raw spread", () => {
    expect(resolveFavoredSide(null, -6)).toBe("home");
  });

  it("infers away favorite from a positive raw spread", () => {
    expect(resolveFavoredSide(undefined, 6)).toBe("away");
  });

  it("returns null for pick'em / unknown", () => {
    expect(resolveFavoredSide(null, 0)).toBeNull();
    expect(resolveFavoredSide(null, null)).toBeNull();
  });
});

describe("signedLineForSide", () => {
  // Green Bay @ NY Jets, GB (away) favored by 3.5. This is the exact bug case.
  const gbAtJets = { spread: 3.5, favoredTeam: "away" };

  it("gives the favorite a negative line", () => {
    expect(signedLineForSide("away", gbAtJets)).toBe(-3.5);
  });

  it("gives the underdog a positive line", () => {
    expect(signedLineForSide("home", gbAtJets)).toBe(3.5);
  });

  it("handles a home favorite", () => {
    const homeFav = { spread: 3.5, favoredTeam: "home" };
    expect(signedLineForSide("home", homeFav)).toBe(-3.5);
    expect(signedLineForSide("away", homeFav)).toBe(3.5);
  });

  it("treats a zero magnitude as pick'em (0) for both sides", () => {
    expect(signedLineForSide("home", { spread: 0, favoredTeam: "home" })).toBe(
      0,
    );
    expect(signedLineForSide("away", { spread: 0, favoredTeam: "home" })).toBe(
      0,
    );
  });

  it("returns null when there is no spread", () => {
    expect(
      signedLineForSide("home", { spread: null, favoredTeam: null }),
    ).toBeNull();
    expect(signedLineForSide("home", {})).toBeNull();
  });

  it("uses the magnitude sign convention when favoredTeam is absent", () => {
    // raw -3.5 => home favored => home -3.5, away +3.5
    expect(signedLineForSide("home", { spread: -3.5 })).toBe(-3.5);
    expect(signedLineForSide("away", { spread: -3.5 })).toBe(3.5);
  });
});

describe("formatLine", () => {
  it("formats negatives, positives, and pick'em", () => {
    expect(formatLine(-3.5)).toBe("-3.5");
    expect(formatLine(3.5)).toBe("+3.5");
    expect(formatLine(0)).toBe("PK");
    expect(formatLine(-7)).toBe("-7");
    expect(formatLine(7)).toBe("+7");
  });

  it("returns TBD for missing/NaN", () => {
    expect(formatLine(null)).toBe("TBD");
    expect(formatLine(undefined)).toBe("TBD");
    expect(formatLine(NaN)).toBe("TBD");
  });
});

describe("formatSpreadForSide", () => {
  it("renders the favorite negative and underdog positive", () => {
    const odds = { spread: 3.5, favoredTeam: "away" };
    expect(formatSpreadForSide("away", odds)).toBe("-3.5");
    expect(formatSpreadForSide("home", odds)).toBe("+3.5");
  });
});

describe("formatPlacedBetSpread", () => {
  it("uses the persisted spread_value when present", () => {
    const bet = { game_bet: { team_choice: "away", spread_value: -3.5 } };
    expect(formatPlacedBetSpread(bet)).toBe("-3.5");
  });

  it("derives from the snapshot when spread_value is absent (the GB bug case)", () => {
    // Stored snapshot had signless spread 3.5 + favoredTeam away; team_choice away.
    const bet = {
      game_bet: { team_choice: "away", spread_value: null },
      odds_snapshot: { spread: 3.5, favoredTeam: "away" },
    };
    expect(formatPlacedBetSpread(bet)).toBe("-3.5");
  });

  it("derives the underdog line from the snapshot", () => {
    const bet = {
      game_bet: { team_choice: "home", spread_value: null },
      odds_snapshot: { spread: 3.5, favoredTeam: "away" },
    };
    expect(formatPlacedBetSpread(bet)).toBe("+3.5");
  });

  it("returns TBD without a team choice or spread", () => {
    expect(formatPlacedBetSpread({ game_bet: {} })).toBe("TBD");
    expect(formatPlacedBetSpread(null)).toBe("TBD");
  });
});
