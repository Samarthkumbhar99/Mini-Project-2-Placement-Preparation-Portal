import { Link } from "react-router-dom";

const features = [
  "Resume upload with AI-assisted skill extraction",
  "Placement readiness score and category",
  "Company-role matching with skill gap analysis",
  "Personalized weekly preparation roadmap",
  "Mock interview questions with feedback",
  "Admin analytics dashboard for placement cell"
];

export const HomePage = () => (
  <main className="hero-page">
    <section className="hero-card">
      <div>
        <p className="eyebrow">AI-Driven Placement Support</p>
        <h1>Build placement confidence with a smart preparation portal.</h1>
        <p className="hero-copy">
          Students get readiness scoring, roadmap planning, company matching, and interview
          practice. Placement teams get analytics and role management in one portal.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="primary-button">
            Start as Student
          </Link>
          <Link to="/login" className="ghost-button">
            Admin or Existing User
          </Link>
        </div>
      </div>
      <div className="hero-panel">
        <h3>Core Demo Highlights</h3>
        <ul className="feature-list">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
    </section>
  </main>
);

