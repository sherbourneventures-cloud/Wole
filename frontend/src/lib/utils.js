import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const services = [
  {
    id: 'structural',
    title: 'Structural Engineering',
    description: 'Comprehensive structural analysis, design and detailing for buildings, bridges, and infrastructure projects.',
    icon: 'Building2',
  },
  {
    id: 'geotechnical',
    title: 'Geotechnical Engineering',
    description: 'Soil investigation, foundation design, slope stability analysis, and ground improvement solutions.',
    icon: 'Mountain',
  },
  {
    id: 'project_management',
    title: 'Project Management',
    description: 'End-to-end project planning, scheduling, cost control, and delivery for construction projects.',
    icon: 'ClipboardList',
  },
  {
    id: 'construction_supervision',
    title: 'Construction Supervision',
    description: 'On-site quality control, progress monitoring, and compliance verification throughout construction.',
    icon: 'HardHat',
  },
  {
    id: 'internships',
    title: 'Internship Programs',
    description: 'Hands-on training and mentorship opportunities for aspiring civil engineers and graduates.',
    icon: 'GraduationCap',
  },
];

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const categoryLabels = {
  structural: 'Structural Engineering',
  geotechnical: 'Geotechnical Engineering',
  project_management: 'Project Management',
  construction_supervision: 'Construction Supervision',
};

export const statusLabels = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
};

export const statusColors = {
  new: 'bg-green-100 text-green-800',
  contacted: 'bg-blue-100 text-blue-800',
  closed: 'bg-slate-100 text-slate-800',
};
