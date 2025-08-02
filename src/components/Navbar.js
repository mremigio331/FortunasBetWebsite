import React, { useContext, useState } from "react";
import { Menu, Button, Avatar } from "antd";
import { Link } from "react-router-dom";
import { UserAuthenticationContext } from "../provider/UserAuthenticationProvider";

const Navbar = () => {
  const {
    user,
    nickname,
    isAuthenticated,
    initiateSignIn,
    initiateSignUp,
    logoutUser,
  } = useContext(UserAuthenticationContext);
  const [current, setCurrent] = useState("home");

  const onClick = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  const items = [
    {
      label: (
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          Fortunas Bet
        </Link>
      ),
      key: "home",
    },
    isAuthenticated
      ? {
          label: (
            <span>
              <Avatar style={{ backgroundColor: "#87d068" }} icon="avatar" />
              <span style={{ color: "white", marginLeft: "10px" }}>
                {nickname}
              </span>
            </span>
          ),
          key: "user",
          children: [
            {
              label: (
                <Button
                  type="link"
                  onClick={logoutUser}
                  style={{ color: "white" }}
                >
                  Logout
                </Button>
              ),
              key: "logout",
            },
          ],
        }
      : {
          label: "Sign In",
          key: "signin",
          children: [
            {
              label: (
                <Button
                  type="link"
                  onClick={initiateSignIn}
                  style={{ color: "white" }}
                >
                  Sign In
                </Button>
              ),
              key: "signin",
            },
            {
              label: (
                <Button
                  type="link"
                  onClick={initiateSignUp}
                  style={{ color: "white" }}
                >
                  Sign Up
                </Button>
              ),
              key: "signup",
            },
          ],
        },
  ];

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#001529",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: "100%",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: "20px",
          fontWeight: "bold",
          backgroundColor: "transparent",
        }}
      >
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          Fortunas Bets
        </Link>
      </div>
      <Menu
        onClick={onClick}
        selectedKeys={[current]}
        mode="horizontal"
        items={items.slice(1)}
        theme="dark"
        style={{ backgroundColor: "transparent", border: "none" }}
      />
    </div>
  );
};

export default Navbar;
