import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import App from "./App";
import "./index.css";

// React 트리 바깥의 유일한 DOM 접근. #root 는 index.html 이 항상 제공하므로 null 검사를 생략한다.
createRoot(document.querySelector("#root")!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);
