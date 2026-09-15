import {Route, Routes} from "react-router-dom";
import AppFooter from "./common/components/AppFooter";
import {RoutePath} from "./common/enums/routePath";
import AnswerSummary from "./question/pages/AnswerSummary";
import {useAppNavigation} from "./common/hooks/useAppNavigation";
import Products from "./catalog/pages/Products";
import ProductDetail from "./product/pages/ProductDetail";
import Result from "./result/pages/Result";
import Start from "./start/pages/Start";
import Questions from "./question/pages/Questions";
import WishChat from "./wish/pages/WishChat";

export default function App() {
    useAppNavigation();
    return (
        <main>
            <Routes>
                <Route path={RoutePath.START} element={<Start />} />
                <Route path={RoutePath.QUESTIONS} element={<Questions />} />
                <Route path={RoutePath.WISH} element={<WishChat />} />
                <Route path={RoutePath.RESULT} element={<Result />} />
                <Route path={RoutePath.ANSWER_SUMMARY} element={<AnswerSummary />} />
                <Route path={RoutePath.PRODUCTS} element={<Products />} />
                <Route path={RoutePath.PRODUCT_DETAIL} element={<ProductDetail />} />
            </Routes>
            <AppFooter />
        </main>
    );
}
