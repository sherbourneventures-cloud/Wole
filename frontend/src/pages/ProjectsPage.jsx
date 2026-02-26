import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { publicApi } from '../lib/api';
import { categoryLabels } from '../lib/utils';

const PROJECT_1 = "https://images.unsplash.com/photo-1761287347782-f3b433c0cee3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjb25jcmV0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwc3RydWN0dXJlfGVufDB8fHx8MTc3MjA4Mjc3MHww&ixlib=rb-4.1.0&q=85";
const PROJECT_2 = "https://images.unsplash.com/photo-1739599211500-74e04a9ca175?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb25jcmV0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwc3RydWN0dXJlfGVufDB8fHx8MTc3MjA4Mjc3MHww&ixlib=rb-4.1.0&q=85";
const PROJECT_3 = "https://images.unsplash.com/photo-1763333408639-6073d0587744?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBjb25jcmV0ZSUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nJTIwc3RydWN0dXJlfGVufDB8fHx8MTc3MjA4Mjc3MHww&ixlib=rb-4.1.0&q=85";

const categories = [
  { id: 'all', label: 'All Projects' },
  { id: 'structural', label: 'Structural' },
  { id: 'geotechnical', label: 'Geotechnical' },
  { id: 'project_management', label: 'Project Mgmt' },
  { id: 'construction_supervision', label: 'Supervision' },
];

const placeholderProjects = [
  { id: '1', title: 'Lagos Commercial Tower', category: 'structural', location: 'Victoria Island, Lagos', year: '2023', image_url: PROJECT_1 },
  { id: '2', title: 'Ibadan Industrial Complex', category: 'geotechnical', location: 'Ibadan, Oyo State', year: '2022', image_url: PROJECT_2 },
  { id: '3', title: 'Abuja Government Building', category: 'project_management', location: 'Abuja, FCT', year: '2023', image_url: PROJECT_3 },
  { id: '4', title: 'Port Harcourt Bridge', category: 'structural', location: 'Port Harcourt, Rivers', year: '2021', image_url: PROJECT_1 },
  { id: '5', title: 'Kano Shopping Mall', category: 'construction_supervision', location: 'Kano, Kano State', year: '2022', image_url: PROJECT_2 },
  { id: '6', title: 'Enugu Residential Estate', category: 'geotechnical', location: 'Enugu, Enugu State', year: '2023', image_url: PROJECT_3 },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory !== 'all' ? { category: activeCategory } : {};
    publicApi.getProjects(params)
      .then(res => {
        setProjects(res.data.length > 0 ? res.data : placeholderProjects);
      })
      .catch(() => setProjects(placeholderProjects))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const filteredProjects = activeCategory === 'all' 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  return (
    <div data-testid="projects-page">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-slate-50 grid-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Our Portfolio</p>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6">
              Projects
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Explore our portfolio of completed projects across Nigeria. From high-rise towers 
              to infrastructure developments, our work speaks to our commitment to engineering excellence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 bg-white border-b border-slate-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                data-testid={`filter-${cat.id}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/3] bg-slate-100 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="project-card group relative aspect-[4/3] overflow-hidden bg-slate-100 cursor-pointer"
                  data-testid={`project-card-${project.id}`}
                >
                  <img 
                    src={project.image_url || PROJECT_1}
                    alt={project.title}
                    className="project-image w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-xs text-slate-300 uppercase tracking-widest mb-2">
                        {categoryLabels[project.category] || project.category}
                      </p>
                      <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
                      <p className="text-slate-300 text-sm">{project.location} | {project.year}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {filteredProjects.length === 0 && !loading && (
            <div className="text-center py-16">
              <p className="text-slate-500">No projects found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Have a Project in Mind?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Let's discuss how we can bring your vision to life with our engineering expertise.
          </p>
          <Link to="/contact">
            <Button 
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-sm font-semibold tracking-wide uppercase text-sm px-8 py-6"
            >
              Start Your Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
