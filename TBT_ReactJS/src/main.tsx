import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App.tsx";
import "./index.css";
import store from "./redux/store.tsx";
import ToastWrapper from '@/components/Atoms/ToastWrapper'

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <ToastWrapper>
        <App />
      </ToastWrapper>
    </BrowserRouter>
  </Provider>
);
