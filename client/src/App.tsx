import { useEffect, useState } from 'react';
import './App.css';

function App() {
    const [message, setMessage] = useState('Завантаження...');

    useEffect(() => {
        fetch('http://localhost:5000/')
            .then((res) => res.json())
            .then((data) => setMessage(data.message))
            .catch((err) => setMessage('Помилка з’єднання з бекендом: ' + err.message));
    }, []);

    return (
        <div className="App">
            <h1>Grand Hotel</h1>
            <div className="card">
                <p>
                    Статус сервера: <strong>{message}</strong>
                </p>
            </div>
        </div>
    );
}

export default App;
