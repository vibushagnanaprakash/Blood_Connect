import { Link } from 'react-router-dom';
import { Brand } from './Navbar.jsx';
import { DISCLAIMER } from '../utils/constants.js';

export default function Footer() {
  return (
    <footer className="footer pt-5 pb-3 mt-auto">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-5">
            <Brand light />
            <p className="mt-3 small">Finding a blood donor shouldn't take hours. BloodConnect matches patients with nearby, available donors in minutes.</p>
          </div>
          <div className="col-6 col-md-3">
            <h6>Explore</h6>
            <ul className="list-unstyled small">
              <li><Link to="/donors">Find donors</Link></li>
              <li><Link to="/register">Become a donor</Link></li>
              <li><Link to="/about">How it works</Link></li>
            </ul>
          </div>
          <div className="col-6 col-md-4">
            <h6>Contact</h6>
            <ul className="list-unstyled small">
              <li>support@bloodconnect.example</li>
              <li>Helpline: 1800-000-0000 (demo)</li>
              <li>Coimbatore, Tamil Nadu</li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary" />
        <p className="small mb-1">{DISCLAIMER}</p>
        <p className="small mb-0">© {new Date().getFullYear()} BloodConnect – a college mini project.</p>
      </div>
    </footer>
  );
}
