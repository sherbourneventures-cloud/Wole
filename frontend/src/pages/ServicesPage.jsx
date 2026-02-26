import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Mountain, ClipboardList, HardHat, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { services } from '../lib/utils';

const SERVICES_IMAGE = "https://images.pexels.com/photos/8470842/pexels-photo-8470842.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const iconMap = {
  Building2,
  Mountain,
  ClipboardList,
  HardHat,
  GraduationCap,
};

const serviceDetails = {
  structural: {
    features: [
      'Structural analysis and design',
      'Reinforced concrete detailing',
      'Steel structure design',
      'Foundation design',
      'Seismic analysis',
      'Retrofit and strengthening',
    ],
  },
  geotechnical: {
    features: [
      'Soil investigation and testing',
      'Foundation recommendations',
      'Slope stability analysis',
      'Retaining wall design',
      'Ground improvement solutions',
      'Pile design and analysis',
    ],
  },
  project_management: {
    features: [
      'Project planning and scheduling',
      'Cost estimation and control',
      'Resource management',
      'Risk assessment',
      'Progress monitoring',
      'Stakeholder coordination',
    ],
  },
  construction_supervision: {
    features: [
      'Quality assurance and control',
      'Progress documentation',
      'Compliance verification',
      'Site safety monitoring',
      'Material testing oversight',
      'Defect identification',
    ],
  },
  internships: {
    features: [
      'Structured training programs',
      'Hands-on project experience',
      'Mentorship by senior engineers',
      'Technical skills development',
      'Professional certification support',
      'Career guidance',
    ],
  },
};

export default function ServicesPage() {
  return (
    <div data-testid="services-page">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-slate-50 grid-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Our Services</p>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6">
                Engineering<br />Solutions
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                From concept to completion, we provide comprehensive civil engineering services 
                tailored to meet the unique requirements of each project. Our expertise spans 
                structural design, geotechnical analysis, project management, and construction supervision.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src={SERVICES_IMAGE}
                alt="Engineering blueprints"
                className="w-full aspect-[4/3] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon];
              const details = serviceDetails[service.id];
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  id={service.id}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}
                >
                  <div className={isEven ? '' : 'lg:order-2'}>
                    <div className="w-16 h-16 bg-slate-100 rounded-sm flex items-center justify-center mb-6">
                      <Icon className="h-8 w-8 text-slate-700" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                      {service.title}
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                      {service.description}
                    </p>
                    <ul className="space-y-3 mb-8">
                      {details.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/contact">
                      <Button 
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold tracking-wide uppercase text-sm px-6"
                      >
                        Request This Service
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className={`bg-slate-100 aspect-square ${isEven ? 'lg:order-2' : ''}`}>
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="h-32 w-32 text-slate-300" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 md:py-32 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Our Process</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How We Work</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Consultation', desc: 'We begin with understanding your project requirements and objectives.' },
              { step: '02', title: 'Analysis', desc: 'Our team conducts thorough analysis and feasibility studies.' },
              { step: '03', title: 'Design', desc: 'We develop detailed engineering designs and documentation.' },
              { step: '04', title: 'Delivery', desc: 'We provide ongoing support through construction and beyond.' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <span className="text-7xl font-extrabold text-slate-800 font-mono">{item.step}</span>
                <h3 className="text-xl font-bold mt-4 mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Need Expert Engineering?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Contact us today to discuss your project requirements. Our team is ready to provide 
            the engineering expertise you need.
          </p>
          <Link to="/contact">
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold tracking-wide uppercase text-sm px-8 py-6"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
