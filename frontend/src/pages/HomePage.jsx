import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Mountain, ClipboardList, HardHat, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { publicApi } from '../lib/api';
import { services, truncateText } from '../lib/utils';

const HERO_IMAGE = "https://images.unsplash.com/photo-1763333408639-6073d0587744?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBjb25jcmV0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwc3RydWN0dXJlfGVufDB8fHx8MTc3MjA4Mjc3MHww&ixlib=rb-4.1.0&q=85";
const PROJECT_1 = "https://images.unsplash.com/photo-1761287347782-f3b433c0cee3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjb25jcmV0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwc3RydWN0dXJlfGVufDB8fHx8MTc3MjA4Mjc3MHww&ixlib=rb-4.1.0&q=85";
const PROJECT_2 = "https://images.unsplash.com/photo-1739599211500-74e04a9ca175?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb25jcmV0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwc3RydWN0dXJlfGVufDB8fHx8MTc3MjA4Mjc3MHww&ixlib=rb-4.1.0&q=85";

const iconMap = {
  Building2,
  Mountain,
  ClipboardList,
  HardHat,
  GraduationCap,
};

const stats = [
  { value: '30+', label: 'Years Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '150+', label: 'Satisfied Clients' },
  { value: '50+', label: 'Team Members' },
];

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    publicApi.getProjects({ featured: true }).then(res => setProjects(res.data.slice(0, 3)));
    publicApi.getTestimonials({ featured: true }).then(res => setTestimonials(res.data.slice(0, 3)));
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img 
            src={HERO_IMAGE} 
            alt="Modern Architecture" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4"
            >
              Civil Engineering Excellence Since 1995
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-slate-900 mb-6"
            >
              Building Nigeria's <br />
              <span className="text-slate-600">Future</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 leading-relaxed mb-8 max-w-xl"
            >
              Precision-driven civil engineering solutions that define the skyline. 
              From structural design to project delivery, we build with excellence.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/contact">
                <Button 
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold tracking-wide uppercase text-sm px-8 py-6 btn-press"
                  data-testid="hero-cta-btn"
                >
                  Start Your Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/projects">
                <Button 
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm font-semibold tracking-wide uppercase text-sm px-8 py-6"
                >
                  View Our Work
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-extrabold text-white font-mono stat-number">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 md:py-32 bg-slate-50 grid-texture" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">What We Do</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Our Services</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon];
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="service-card bg-white border border-slate-200 p-8 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-sm flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/services">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-white rounded-sm font-semibold tracking-wide uppercase text-sm px-8">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-24 md:py-32" data-testid="projects-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Our Portfolio</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Featured Projects</h2>
            </div>
            <Link to="/projects">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 uppercase text-xs font-bold tracking-widest">
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.length > 0 ? projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="project-card group relative aspect-[4/3] overflow-hidden bg-slate-100"
              >
                <img 
                  src={project.image_url || (index === 0 ? PROJECT_1 : PROJECT_2)} 
                  alt={project.title}
                  className="project-image w-full h-full object-cover img-grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-xs text-slate-300 uppercase tracking-widest mb-2">{project.category}</p>
                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                    <p className="text-slate-300 text-sm mt-2">{project.location}</p>
                  </div>
                </div>
              </motion.div>
            )) : (
              // Placeholder projects
              [1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="project-card group relative aspect-[4/3] overflow-hidden bg-slate-100"
                >
                  <img 
                    src={i === 1 ? PROJECT_1 : i === 2 ? PROJECT_2 : HERO_IMAGE} 
                    alt={`Project ${i}`}
                    className="project-image w-full h-full object-cover img-grayscale"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-xs text-slate-300 uppercase tracking-widest mb-2">Structural Engineering</p>
                      <h3 className="text-xl font-bold text-white">Commercial Complex</h3>
                      <p className="text-slate-300 text-sm mt-2">Lagos, Nigeria</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 md:py-32 bg-slate-900 text-white" data-testid="why-us-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Why Choose Us</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Engineering Excellence, Delivered.</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                With over three decades of experience, we bring unmatched expertise to every project. 
                Our commitment to precision, safety, and innovation has made us a trusted partner 
                for Nigeria's most ambitious construction projects.
              </p>
              <ul className="space-y-4">
                {[
                  'COREN Registered Engineers',
                  'ISO 9001:2015 Quality Standards',
                  'On-time Project Delivery',
                  'Competitive Pricing',
                  'Post-completion Support',
                ].map((item, index) => (
                  <motion.li 
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-200">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/4160237/pexels-photo-4160237.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Engineer at work"
                className="w-full aspect-square object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 shadow-lg">
                <p className="text-5xl font-extrabold text-slate-900 font-mono">30+</p>
                <p className="text-slate-600 text-sm uppercase tracking-widest mt-1">Years of Trust</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 md:py-32 bg-slate-50" data-testid="testimonials-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Testimonials</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">What Our Clients Say</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative bg-white border border-slate-200 p-8"
                >
                  <div className="testimonial-quote">
                    <p className="text-slate-600 leading-relaxed mb-6">{truncateText(testimonial.content, 200)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-slate-600 font-bold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.position}, {testimonial.company}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-white" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Ready to Build Something Great?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Let's discuss your project. Our team of experienced engineers is ready to bring 
            your vision to life with precision and excellence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/contact">
              <Button 
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold tracking-wide uppercase text-sm px-8 py-6 btn-press"
              >
                Get a Free Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="tel:+2348012345678">
              <Button 
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm font-semibold tracking-wide uppercase text-sm px-8 py-6"
              >
                Call Us Now
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
