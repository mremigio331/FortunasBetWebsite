import * as React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AWS from "aws-sdk";
import App from "./App";
import UserAuthenticationProvider from "./provider/UserAuthenticationProvider";
import { UserProfileProvider } from "./provider/UserProfileProvider";

import ApiProvider from "./provider/ApiProvider";

// Add this import at the top if you have a global CSS file (e.g., index.css or App.css)
// import "./index.css";

const queryClient = new QueryClient();

AWS.config.update({
  region: "us-west-2",
});

// Optionally, add a global style reset here if you don't have a CSS file:
const style = document.createElement("style");
style.innerHTML = `
  html, body, #app {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("app")).render(
  <QueryClientProvider client={queryClient}>
    <ApiProvider>
      <UserAuthenticationProvider>
        <UserProfileProvider>
          <App />
        </UserProfileProvider>
      </UserAuthenticationProvider>
    </ApiProvider>
  </QueryClientProvider>,
);
