const getStage = () => {
  const domain = window.location.hostname.trim(); // Trim any leading/trailing spaces
  console.log("Domain:", domain);

  if (domain.includes("fortunasbet.com")) {
    console.log("Matched prod");
    return "prod";
  } else if (
    domain.includes("dev.fortunasbet.com") ||
    domain.includes("localhost")
  ) {
    console.log("Matched dev");
    return "dev";
  }

  console.log("Matched unknown");
  return "unknown";
};

export default getStage;
