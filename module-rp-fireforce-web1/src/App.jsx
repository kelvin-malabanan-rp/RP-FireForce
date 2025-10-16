// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router/AppRouter';

function App() {
    console.log('🚀 FireForce App initialized');
    
    return (
        <BrowserRouter>
            <AppRouter />
        </BrowserRouter>
    );
}

export default App;