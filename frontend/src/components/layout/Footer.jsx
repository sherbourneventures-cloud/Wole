import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Linkedin, Twitter, Facebook } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_struct-request/artifacts/3aj34l5d_logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img 
                src={LOGO_URL} 
                alt="SL&A Logo" 
                className="h-12 w-auto brightness-0 invert"
              />
              <div>
                <p className="font-heading font-bold text-white text-sm tracking-tight leading-none">Segun Labiran</p>
                <p className="font-heading font-bold text-white text-sm tracking-tight leading-none">& Associates</p>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Precision-driven civil engineering solutions that define the skyline of Nigeria since 1995.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/services', label: 'Our Services' },
                { to: '/projects', label: 'Projects' },
                { to: '/blog', label: 'Blog & News' },
                { to: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-widest mb-6">Services</h4>
            <ul className="space-y-3">
              {[
                'Structural Engineering',
                'Geotechnical Engineering',
                'Project Management',
                'Construction Supervision',
                'Internship Programs',
              ].map((service) => (
                <li key={service}>
                  <Link 
                    to="/services" 
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm uppercase tracking-widest mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm">
                  E9/1067 Abayomi Estate,<br />
                  Old Ife Road, Ibadan,<br />
                  Oyo State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <a href="tel:+2348012345678" className="text-slate-400 hover:text-white text-sm font-mono">
                  +234 801 234 5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <a href="mailto:info@slaengineering.com" className="text-slate-400 hover:text-white text-sm">
                  info@slaengineering.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <span className="text-slate-400 text-sm">
                  Mon - Fri: 8:00 AM - 5:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} Segun Labiran & Associates. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/admin/login" className="text-slate-500 hover:text-slate-400 text-xs uppercase tracking-widest">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
