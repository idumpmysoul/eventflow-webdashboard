import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    HomeIcon,
    UsersIcon,
    MapIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Participants', href: '/participants', icon: UsersIcon },
    { name: 'Heatmap', href: '/heatmap', icon: MapIcon },
    { name: 'Statistics', href: '/statistics', icon: ChartBarIcon },
];

const Navbar = () => {
    const linkClasses = "flex items-center px-4 py-3 text-tremor-content dark:text-dark-tremor-content hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted rounded-tremor-default transition-colors duration-150";
    const activeLinkClasses = "bg-tremor-background-muted dark:bg-dark-tremor-background-muted text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold";

    return (
        <nav className="w-64 p-4 border-r border-tremor-border dark:border-dark-tremor-border bg-tremor-background dark:bg-dark-tremor-background flex flex-col">
        <div className="flex items-center space-x-3 mb-8 px-2">
            <img src="/logo.svg" alt="EventFlow Logo" className="h-10 w-10" />
            <span className="text-xl font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            EventFlow
            </span>
        </div>
        <div className="flex flex-col space-y-2">
            {navigation.map((item) => (
            <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                `${linkClasses} ${isActive ? activeLinkClasses : ''}`
                }
            >
                <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                <span>{item.name}</span>
            </NavLink>
            ))}
        </div>
        <div className="mt-auto px-4 py-2 text-center text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
            <p>&copy; 2024 EventFlow Inc.</p>
            <p>v1.0.0</p>
        </div>
        </nav>
    );
};

export default Navbar;