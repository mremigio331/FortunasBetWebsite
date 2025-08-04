const getStage = () => {
  const domain = window.location.hostname.trim(); // Trim any leading/trailing spaces
  console.log("Domain:", domain);

  if (domain.includes("testing.fortunasbet.com")) {
    console.log("Matched testing");
    return "testing";
  } else if (domain.includes("localhost")) {
    console.log("Matched dev");
    return "dev";
  } else if (domain.includes("fortunasbet.com")) {
    console.log("Matched prod");
    return "prod";
  }

  console.log("Matched unknown");
  return "unknown";
};

export default getStage;
