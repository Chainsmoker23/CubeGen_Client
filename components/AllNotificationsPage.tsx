import React from 'react';
import { motion } from 'framer-motion';
import { Notification, IconType } from '../types';
import ArchitectureIcon from './ArchitectureIcon';

type Page = 'app' | 'neuralNetwork';

interface AllNotificationsPageProps {
  onNavigate: (page: Page) => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'error',
    title: 'Generation Failed',
    message: 'The AI model is currently overloaded. We automatically retried with a different key, but all were busy. Please try again in a moment.',
    timestamp: '2 minutes ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Diagram Generated',
    message: 'Your diagram for the "Scalable AI Inference API" has been successfully created.',
    timestamp: '15 minutes ago',
    isRead: true,
  },
  {
    id: '3',
    type: 'info',
    title: 'New Feature: Playground Mode',
    message: 'You can now enter the Playground to manually edit and refine your generated diagrams.',
    timestamp: '1 hour ago',
    isRead: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'API Key Limit Reached',
    message: 'The shared API key has reached its daily limit. Please provide your own key in settings to continue.',
    timestamp: '3 hours ago',
    isRead: true,
  },
];

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  const baseClass = "w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center";
  switch (type) {
    case 'success':
      return (
        <div className={`${baseClass} bg-green-100 text-green-600`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'error':
      return (
        <div className={`${baseClass} bg-red-100 text-red-600`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        </div>
      );
    case 'info':
    default:
      return (
        <div className={`${baseClass} bg-blue-100 text-blue-600`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
      );
  }
};


const AllNotificationsPage: React.FC<AllNotificationsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen text-[var(--color-text-primary)] flex flex-col transition-colors duration-300 app-bg">
        <header className="relative p-6 flex justify-between items-center z-10">
            <button 
                onClick={() => onNavigate('app')} 
                className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--color-button-bg-hover)]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Back to App
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
                <h1 className="text-xl font-bold">Notifications</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">Your recent activity</p>
            </div>
        </header>

        <main className="flex-1 flex justify-center py-8 px-4">
            <motion.div 
                className="w-full max-w-2xl"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.07 } }
                }}
            >
                {mockNotifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 mb-4 rounded-2xl glass-panel relative"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                        }}
                    >
                        {!notification.isRead && (
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-pink-500 rounded-full" title="Unread"></div>
                        )}
                        <NotificationIcon type={notification.type} />
                        <div className="flex-1">
                            <h2 className="font-semibold text-[var(--color-text-primary)]">{notification.title}</h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{notification.message}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]/70 mt-2">{notification.timestamp}</p>
                        </div>
                    </motion.div>
                ))}
                 <div className="text-center mt-8">
                    <button className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        Mark all as read
                    </button>
                 </div>
            </motion.div>
        </main>
    </div>
  );
};

export default AllNotificationsPage;