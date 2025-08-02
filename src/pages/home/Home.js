import React, { useContext } from "react";
import HomeAuthenticated from "./HomeAuthenticated";
import HomeUnauthenticated from "./HomeUnauthenticated";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(UserAuthenticationContext);

  return isAuthenticated ? <HomeAuthenticated /> : <HomeUnauthenticated />;
};

export default Home;
