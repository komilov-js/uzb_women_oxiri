import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.scss'; // global SCSS fayl

const NotFound = () => {
  return (
    <div className="containeraa">
      <div className="content">
        <div className="illustration">
          <span role="img" aria-label="Gul">🌸</span>
          <span role="img" aria-label="Qalb">💖</span>
        </div>
        <h1 className="title">404</h1>
        <p className="message">
          Kechirasiz, siz qidirgan sahifa topilmadi.
        </p>
        <Link to="/" className="homeLink">
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
};

export default NotFound;