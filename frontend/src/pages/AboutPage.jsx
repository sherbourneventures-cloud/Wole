import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Target, Clock } from 'lucide-react';
import { publicApi } from '../lib/api';

const ABOUT_IMAGE = "https://images.pexels.com/photos/4160237/pexels-photo-4160237.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const TEAM_PLACEHOLDER = "https://images.pexels.com/photos/8470842/pexels-photo-8470842.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const values = [
  {
    icon: Target,
    title: 'Precision',
    description: 'Every calculation matters. We deliver engineering solutions with meticulous attention to detail.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We maintain the highest standards in every project, ensuring quality that stands the test of time.',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'We work closely with clients, architects, and contractors to deliver integrated solutions.',
  },
  {
    icon: Clock,
    title: 'Reliability',
    description: 'Our track record speaks for itself - on-time delivery and consistent results.',
  },
];

export default function AboutPage() {
  const [team, setTeam] = useState([]);

  useEffect(() => {
    publicApi.getTeam().then(res => setTeam(res.data));
  }, []);

  return (
    <div data-testid="about-page">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-slate-50 grid-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">About Us</p>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6">
                Segun Labiran<br />& Associates
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Founded in 1995, Segun Labiran & Associates has grown to become one of Nigeria's 
                leading civil engineering consultancies. With over three decades of experience, 
                we have delivered structural, geotechnical, and project management solutions for 
                hundreds of projects across the nation.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Our team of COREN-registered engineers brings together expertise, innovation, 
                and a commitment to excellence that has earned us the trust of clients ranging 
                from private developers to government agencies.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img 
                src={ABOUT_IMAGE}
                alt="Engineering team"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute -bottom-8 -right-8 bg-slate-900 text-white p-8">
                <p className="text-5xl font-extrabold font-mono">1995</p>
                <p className="text-sm text-slate-400 uppercase tracking-widest mt-1">Established</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900 text-white p-12"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Our Mission</p>
              <h2 className="text-3xl font-bold tracking-tight mb-6">Building with Purpose</h2>
              <p className="text-slate-300 leading-relaxed">
                To provide precision-driven civil engineering solutions that meet the highest 
                international standards while addressing the unique challenges of the Nigerian 
                construction industry. We are committed to delivering projects that are safe, 
                sustainable, and economically viable.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-slate-50 p-12 border border-slate-200"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Our Vision</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Defining Tomorrow</h2>
              <p className="text-slate-600 leading-relaxed">
                To be the foremost civil engineering consultancy in West Africa, recognized for 
                technical excellence, innovative solutions, and our contribution to infrastructure 
                development that transforms communities and drives economic growth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 bg-slate-50 grid-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Our Values</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">What Drives Us</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-slate-200 p-8 text-center"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 md:py-32 bg-white" data-testid="team-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Our Team</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Meet the Experts</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.length > 0 ? team.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="aspect-[3/4] overflow-hidden bg-slate-100 mb-4">
                  <img 
                    src={member.image_url || TEAM_PLACEHOLDER}
                    alt={member.name}
                    className="w-full h-full object-cover img-grayscale"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                <p className="text-sm text-slate-500 uppercase tracking-widest mb-3">{member.position}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{member.bio}</p>
                {member.qualifications?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {member.qualifications.map((qual, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1">{qual}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            )) : (
              // Placeholder team members
              [
                { name: 'Engr. Segun Labiran', position: 'Principal Partner', bio: 'With over 35 years of experience in structural engineering, Engr. Labiran leads our team with vision and expertise.' },
                { name: 'Engr. Adebayo Ogundimu', position: 'Senior Structural Engineer', bio: 'Specializing in high-rise structures and complex geometries with 20 years of experience.' },
                { name: 'Engr. Funke Adesanya', position: 'Geotechnical Lead', bio: 'Expert in foundation design and soil mechanics with extensive experience across Nigeria.' },
              ].map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-200 mb-4">
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl font-bold text-slate-400">{member.name.charAt(0)}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                  <p className="text-sm text-slate-500 uppercase tracking-widest mb-3">{member.position}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{member.bio}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24 md:py-32 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Certifications</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Trusted & Certified</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: 'COREN', desc: 'Council for the Regulation of Engineering in Nigeria' },
              { title: 'NSE', desc: 'Nigerian Society of Engineers' },
              { title: 'ISO 9001', desc: 'Quality Management System' },
              { title: 'ACEN', desc: 'Association of Consulting Engineers Nigeria' },
            ].map((cert, index) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 border-2 border-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-slate-300">{cert.title}</span>
                </div>
                <p className="text-sm text-slate-400">{cert.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
