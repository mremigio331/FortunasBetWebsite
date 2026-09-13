import React from "react";
import { Alert } from "antd";

/**
 * Tells the user when the week the page landed on is not the confirmed current
 * week, so a fallback estimate is never presented as fact.
 *
 * Two cases, in order of specificity:
 *
 *   - **Out of range** (Requirement 1.6): the current week exists but falls
 *     outside this room's date range, so the nearest week in range was selected.
 *     This is the more informative message, so it wins.
 *   - **Estimate** (Requirement 1.5): the Authoritative_Week_Source could not
 *     confirm the current week (request failed, or the season is over), so the
 *     client-side Fallback_Week_Source was used.
 *
 * Renders nothing when the week is confirmed, or while it is still resolving —
 * the selector shows the loading state in that frame, and stacking "loading"
 * with "estimated" would be contradictory.
 *
 * @param {object} props
 * @param {boolean} [props.isWeekEstimate] `isWeekEstimate` from the selection hook.
 * @param {boolean} [props.isCurrentWeekOutOfRange] `isCurrentWeekOutOfRange` from
 *   the selection hook.
 * @param {boolean} [props.isOffSeason] `isOffSeason` from the selection hook;
 *   sharpens the estimate wording.
 * @param {boolean} [props.isWeekLoading] Suppresses the notice while resolving.
 */
const WeekResolutionNotice = ({
  isWeekEstimate = false,
  isCurrentWeekOutOfRange = false,
  isOffSeason = false,
  isWeekLoading = false,
}) => {
  if (isWeekLoading) return null;
  if (!isWeekEstimate && !isCurrentWeekOutOfRange) return null;

  const { message, description, type } = isCurrentWeekOutOfRange
    ? {
        type: "info",
        message: "Current week not covered by this room",
        description:
          "This room's date range doesn't include the week in progress, so the closest week in range is selected. Use the week selector to pick a different one.",
      }
    : {
        type: "warning",
        message: "Estimated week",
        description: isOffSeason
          ? "The season isn't currently in progress, so this week is an estimate rather than a confirmed current week. Use the week selector to pick a different one."
          : "We couldn't confirm the current week from the schedule, so this is an estimate. Use the week selector to pick a different one.",
      };

  return (
    <Alert
      // `role="status"` + polite live region: assistive tech announces the
      // notice when it appears without interrupting the user mid-task.
      role="status"
      aria-live="polite"
      message={message}
      description={description}
      type={type}
      showIcon
      style={{ marginBottom: "16px" }}
    />
  );
};

export default WeekResolutionNotice;
