import React, {
  createContext,
  useReducer,
  useMemo,
  useContext,
  useEffect,
} from "react";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { UserAuthenticationContext } from "../provider/UserAuthenticationProvider";
import { useLocation } from "react-router-dom";

const UserProfileContext = createContext();

const initialState = {
  userProfile: null,
  isUserFetching: false,
  isUserError: false,
};

const userProfileReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isUserFetching: true, isUserError: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isUserFetching: false,
        userProfile: action.payload,
        isUserError: null,
      };
    case "FETCH_ERROR":
      return { ...state, isUserFetching: false, isUserError: action.payload };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
};

export const UserProfileProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userProfileReducer, initialState);

  const { idToken } = useContext(UserAuthenticationContext);
  // Only use useLocation if inside a Router, otherwise fallback to a default value
  let location = { pathname: "" };
  try {
    location = useLocation();
  } catch (e) {
    // Not in a Router context, fallback to default
  }

  const shouldFetchProfile =
    !!idToken && typeof idToken === "string" && idToken.length > 0;

  // Always call the hook (to follow React rules), but pass shouldFetchProfile to the hook
  const {
    userProfile: rawUserProfile,
    isUserFetching: rawIsUserFetching,
    isUserError: rawIsUserError,
    userRefetch,
  } = useGetUserProfile(shouldFetchProfile);

  // Refetch on route change or token change
  useEffect(() => {
    if (!shouldFetchProfile) {
      if (
        state.userProfile !== null ||
        state.isUserFetching !== false ||
        state.isUserError !== false
      ) {
        dispatch({ type: "CLEAR" });
      }
      return;
    }
    // Only dispatch if values have actually changed
    if (rawIsUserFetching !== state.isUserFetching && rawIsUserFetching) {
      dispatch({ type: "FETCH_START" });
    } else if (
      rawUserProfile &&
      JSON.stringify(rawUserProfile) !== JSON.stringify(state.userProfile)
    ) {
      dispatch({ type: "FETCH_SUCCESS", payload: rawUserProfile });
    } else if (rawIsUserError && rawIsUserError !== state.isUserError) {
      dispatch({ type: "FETCH_ERROR", payload: rawIsUserError });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldFetchProfile,
    rawUserProfile,
    rawIsUserFetching,
    rawIsUserError,
    location.pathname,
  ]);
  // Added location.pathname to dependencies

  const setUserProfile = (user) => {
    dispatch({ type: "FETCH_SUCCESS", payload: user });
  };

  const clearProfile = () => {
    dispatch({ type: "CLEAR" });
  };

  const value = useMemo(
    () => ({
      userProfile: state.userProfile,
      isUserFetching: state.isUserFetching,
      isUserError: state.isUserError,
      setUserProfile,
      clearProfile,
      userRefetch,
    }),
    [state.userProfile, state.isUserFetching, state.isUserError, userRefetch],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
