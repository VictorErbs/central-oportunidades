import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './firebase'; // Importa a configuração do Firebase local

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
