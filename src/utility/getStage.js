const getStage = () => {
  const domain = window.location.hostname.trim(); // Trim any leading/trailing spaces

  if (domain.includes("testing.fortunasbet.com")) {
    return "testing";
  } else if (domain.includes("localhost")) {
    return "dev";
  } else if (domain.includes("fortunasbet.com")) {
    return "prod";
  }

  return "unknown";
};

export default getStage;
