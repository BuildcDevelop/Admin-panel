// src/components/WorldPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './WorldPage.css';

export default function WorldPage(): JSX.Element {
  const { worldSlug } = useParams<{ worldSlug: string }>();
  const navigate = useNavigate();

  return (
    <div className="world-page">
      <div className="world-page__container">
        <h1 className="world-page__title">🌍 {worldSlug}</h1>
        <p className="world-page__coming-soon">Coming soon</p>
        
        <button 
          onClick={() => navigate('/admin/worlds')}
          className="world-page__back-button"
        >
          ← Zpět na seznam světů
        </button>
      </div>
    </div>
  );
}