// src/App.jsx

import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router/AppRouter';
import { Toaster } from "sonner";

function App() {
    return (
        <>
            {/* ✅ Add Toaster for notifications */}
            <Toaster
                position="top-right"
                richColors={true}
                expand={false}
                closeButton={true}
                theme="dark"
            />
            <BrowserRouter>
                <AppRouter />
            </BrowserRouter>
        </>
    );
}

export default App;