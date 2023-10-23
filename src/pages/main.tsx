import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "../styles/index.scss";
import Footer from "./Footer.tsx";
import { Provider } from "react-redux/es/exports";
import store from "../redux/store.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Footer />
    </Provider>
  </React.StrictMode>
);
