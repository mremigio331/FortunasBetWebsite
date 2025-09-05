import React, {
  createContext,
  useReducer,
  useMemo,
  useContext,
  useEffect,
} from "react";
import useGetNotifications from "../hooks/notifications/useGetNotifications";
import useAcknowledgeNotification from "../hooks/notifications/useAcknowledgeNotification";
import { UserAuthenticationContext } from "../provider/UserAuthenticationProvider";

const NotificationsContext = createContext();

const initialState = {
  notifications: [],
  isNotificationsFetching: false,
  isNotificationsError: false,
};

const notificationsReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        isNotificationsFetching: true,
        isNotificationsError: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isNotificationsFetching: false,
        notifications: action.payload,
        isNotificationsError: null,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        isNotificationsFetching: false,
        isNotificationsError: action.payload,
      };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
};

export const NotificationsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationsReducer, initialState);
  const { idToken } = useContext(UserAuthenticationContext);

  const shouldFetchNotifications =
    !!idToken && typeof idToken === "string" && idToken.length > 0;

  // Always call the hook, but pass shouldFetchNotifications to the hook
  const {
    notifications: rawNotifications = [],
    isNotificationsFetching: rawIsNotificationsFetching,
    notificationsError: rawIsNotificationsError,
    notificationsRefetch,
  } = useGetNotifications(shouldFetchNotifications);

  useEffect(() => {
    if (!shouldFetchNotifications) {
      if (
        state.notifications.length !== 0 ||
        state.isNotificationsFetching !== false ||
        state.isNotificationsError !== false
      ) {
        dispatch({ type: "CLEAR" });
      }
      return;
    }
    if (
      rawIsNotificationsFetching !== state.isNotificationsFetching &&
      rawIsNotificationsFetching
    ) {
      dispatch({ type: "FETCH_START" });
    } else if (
      Array.isArray(rawNotifications) &&
      JSON.stringify(rawNotifications) !== JSON.stringify(state.notifications)
    ) {
      dispatch({ type: "FETCH_SUCCESS", payload: rawNotifications });
    } else if (
      rawIsNotificationsError &&
      rawIsNotificationsError !== state.isNotificationsError
    ) {
      dispatch({ type: "FETCH_ERROR", payload: rawIsNotificationsError });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldFetchNotifications,
    rawNotifications,
    rawIsNotificationsFetching,
    rawIsNotificationsError,
  ]);

  const setNotifications = (notifications) => {
    dispatch({ type: "FETCH_SUCCESS", payload: notifications });
  };

  const clearNotifications = () => {
    dispatch({ type: "CLEAR" });
  };

  // Acknowledge notification hook
  const {
    acknowledgeNotification,
    acknowledgeNotificationAsync,
    isAcknowledging,
    isAcknowledgeError,
    acknowledgeError,
    acknowledgeStatus,
    acknowledgeData,
    resetAcknowledge,
  } = useAcknowledgeNotification();

  const value = useMemo(
    () => ({
      notifications: state.notifications,
      isNotificationsFetching: state.isNotificationsFetching,
      isNotificationsError: state.isNotificationsError,
      setNotifications,
      clearNotifications,
      notificationsRefetch,
      // Acknowledge notification API
      acknowledgeNotification,
      acknowledgeNotificationAsync,
      isAcknowledging,
      isAcknowledgeError,
      acknowledgeError,
      acknowledgeStatus,
      acknowledgeData,
      resetAcknowledge,
    }),
    [
      state.notifications,
      state.isNotificationsFetching,
      state.isNotificationsError,
      notificationsRefetch,
      acknowledgeNotification,
      acknowledgeNotificationAsync,
      isAcknowledging,
      isAcknowledgeError,
      acknowledgeError,
      acknowledgeStatus,
      acknowledgeData,
      resetAcknowledge,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
